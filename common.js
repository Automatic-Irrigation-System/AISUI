let baseURL = "https://7mvyv3fwv2.execute-api.ap-south-1.amazonaws.com/Prod";

document.addEventListener("DOMContentLoaded", function () {
  let redirectURI = window.location.origin;
  console.log(redirectURI);
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let cogCode = getWithExpiry("cog_code");

  if (urlParams.get("code")) {
    setWithExpiry("cog_code", urlParams.get("code"));
    window.location.href = redirectURI;
  } else if (!cogCode) {
    window.location.href = `https://iotauth.auth.ap-south-1.amazoncognito.com/login?client_id=4e5eft4s61688jqnt7f6ls7q1m&response_type=code&scope=email+openid&redirect_uri=${redirectURI}/`;
  }

  var elems = document.querySelectorAll(".timepicker");

  let options = {
    showClearBtn: true,
    onSelect: handleScheduleTime,
    twelveHour: false,
    autoClose: true,
  };
  var instances = M.Timepicker.init(elems, options);

  $("#immediate-btn").click(function () {
    callImmediateScheduleAPI();
  });
  getHardwareHealth();
  getIrrigationState();
  setInterval(getHardwareHealth, 1000 * 60);
  setInterval(getIrrigationState, 1000 * 5);
});

function setWithExpiry(key, value) {
  const now = new Date();

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    value: value,
    expiry: now.getTime() + 1000 * 60 * 60 * 24,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  // if the item doesn't exist, return null
  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  const now = new Date();
  // compare the expiry time of the item with the current time
  if (now.getTime() > item.expiry) {
    // If the item is expired, delete the item from storage
    // and return null
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

let getHardwareHealth = function () {
  axios.get(`${baseURL}/health?hardwareId=AISPI01`).then((response) => {
    console.log(response);
    $("#status-color").css("color", response.data.health);
  });
};

let getIrrigationState = function () {
  axios
    .get(`${baseURL}/hardwarestate?hardwareId=AISPI01&needCurrent=true`)
    .then((response) => {
      console.log(response);
      let state;
      switch (response.data.state) {
        case "irrigation_complete":
          state = "Completed!";
          break;
        case "irrigating":
          state = "Irrigating";
          break;
      }
      $("#irrigation-state")[0].innerText = state;
      let lastIrrigationTime = new Date(response.data.updatedAt);
      let dayLabel;
      if (lastIrrigationTime.getDate() === new Date().getDate()) {
        dayLabel = "today";
      } else if (lastIrrigationTime.getDate() < new Date().getDate()) {
        dayLabel = "yesterday";
      }
      $(
        "#irrigation-done-time"
      )[0].innerText = `${dayLabel} at ${lastIrrigationTime.toLocaleTimeString()}`;
    });
};

let handleScheduleTime = function (hour, min) {
  console.log("Selected:", hour, min);
  var now = new Date();
  var scheduleTime = new Date();
  scheduleTime.setHours(hour, min);
  console.log(scheduleTime);
  console.log(now);
  let dayLabel = "Today";
  if (now > scheduleTime) {
    dayLabel = "Tomorrow";
  }
  document.getElementById("next-irri-date").innerText = dayLabel;
  document.getElementById("next-irri-time").innerText =
    scheduleTime.toLocaleTimeString();

  callScheduleAPI(scheduleTime);
};

let callScheduleAPI = function (scheduledTime) {
  let request = {
    hardwareId: "AISPI01",
    scheduledTimeList: [scheduledTime.getTime()],
  };
  axios
    .post(`${baseURL}/schedule`, request)
    .then((response) => alert("Sent schedule irrigation request!"));
};

let callImmediateScheduleAPI = function () {
  let request = {
    hardwareId: "AISPI01",
  };
  axios
    .post(`${baseURL}/immediateschedule`, request)
    .then((response) => alert("Sent immediate irrigation request!"));
};
