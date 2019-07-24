"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var todoManager_1 = require("./todoManager");
var scheduleManager_1 = require("./scheduleManager");
var settingManager_1 = require("./settingManager");
var viewHtml = [];
var viewControllers = [new todoManager_1.TodoViewManager(), new scheduleManager_1.ScheduleViewManager(), new settingManager_1.SettingViewManager()];
var viewPath = "./app/views/";
var fs = require("fs");
var files = fs.readdirSync(viewPath);
files.sort();
for (var i = 0; i < files.length; ++i) {
    var contents = fs.readFileSync(viewPath + files[i]).toString();
    viewHtml.push(contents);
}
var buttonContainers = $(".nav-item");
var lastButton = buttonContainers[1];
var _loop_1 = function (i) {
    buttonContainers[i].addEventListener("click", function () {
        lastButton.classList.remove("active");
        lastButton = buttonContainers[i];
        buttonContainers[i].classList.add("active");
        $("#view-container").html(viewHtml[i]);
        viewControllers[i].initialize();
        viewControllers[i].preload();
        viewControllers[i].load();
    });
};
for (var i = 0; i < buttonContainers.length; ++i) {
    _loop_1(i);
}
buttonContainers[0].click();
