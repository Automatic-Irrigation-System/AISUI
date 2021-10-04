let baseURL = "https://7mvyv3fwv2.execute-api.ap-south-1.amazonaws.com/Prod";

document.addEventListener("DOMContentLoaded", function () {
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
  setInterval(getIrrigationState, 1000 * 15);
});

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
    .then((response) => console.log(response));
};

let callImmediateScheduleAPI = function () {
  let request = {
    hardwareId: "AISPI01",
  };
  axios
    .post(`${baseURL}/immediateschedule`, request)
    .then((response) => console.log(response));
};
