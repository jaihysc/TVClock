"use strict";
var buttonContainers = $(".nav-item");
var lastButton = buttonContainers[1];
var _loop_1 = function (i) {
    buttonContainers[i].addEventListener("click", function () {
        lastButton.classList.remove("active");
        lastButton = buttonContainers[i];
        buttonContainers[i].classList.add("active");
        loadView(i);
    });
};
for (var i = 0; i < buttonContainers.length; ++i) {
    _loop_1(i);
}
var views = [];
var viewJs = [];
var viewPath = "./app/views/";
var fs = require("fs");
var files = fs.readdirSync(viewPath);
files.sort();
var viewManagerDeclarationText = "<!--js=";
for (var i = 0; i < files.length; ++i) {
    var contents = fs.readFileSync(viewPath + files[i]).toString();
    if (contents.startsWith(viewManagerDeclarationText)) {
        var firstLineLength = viewManagerDeclarationText.length;
        while (firstLineLength < contents.length && contents[firstLineLength] != '\n')
            ++firstLineLength;
        viewJs.push(contents.substring(viewManagerDeclarationText.length, firstLineLength - 3));
    }
    else
        viewJs.push("-");
    views.push(contents);
}
buttonContainers[0].click();
function loadView(viewIndex) {
    $("#view-container").html(views[viewIndex]);
    if (viewJs[viewIndex] != "-") {
        require("./" + viewJs[viewIndex]);
        delete require.cache[require.resolve("./" + viewJs[viewIndex])];
    }
}
