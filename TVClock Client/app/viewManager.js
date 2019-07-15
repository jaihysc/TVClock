"use strict";
//Manages the switching between the different views (todos, schedule, settings)
//Fetch the buttonContainers
var buttonContainers = $(".nav-item");
var lastButton = buttonContainers[0];
var _loop_1 = function (i) {
    buttonContainers[i].addEventListener("click", function () {
        //Make active
        buttonContainers[i].classList.add("active");
        //Make last button inactive
        lastButton.classList.remove("active");
        lastButton = buttonContainers[i];
        loadView(i);
    });
};
//Add listeners on all the buttonContainers to load their corresponding view
for (var i = 0; i < buttonContainers.length; ++i) {
    _loop_1(i);
}
//Hold all the views for each button of navbar in order
var views = [];
var viewPath = "./app/views/";
var fs = require("fs");
var files = fs.readdirSync(viewPath);
var _loop_2 = function (i) {
    fs.readFile(viewPath + files[i], "utf8", function (err, contents) {
        //Loads the default view 0
        if (i === 0) {
            $("#view-container").html(contents);
        }
        views.push(contents);
    });
};
for (var i = 0; i < files.length; ++i) {
    _loop_2(i);
}
function loadView(viewIndex) {
    //Inject view html into index.html #view-container
    $("#view-container").html(views[viewIndex]);
}
