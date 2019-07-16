"use strict";
//Renderer
//Manages the switching between the different views (todos, schedule, settings)
//Fetch the buttonContainers
var buttonContainers = $(".nav-item");
var lastButton = buttonContainers[1];
var _loop_1 = function (i) {
    buttonContainers[i].addEventListener("click", function () {
        //Make last button inactive
        lastButton.classList.remove("active");
        lastButton = buttonContainers[i];
        //Make current button active
        buttonContainers[i].classList.add("active");
        loadView(i);
    });
};
//Add listeners on all the buttonContainers to load their corresponding view
for (var i = 0; i < buttonContainers.length; ++i) {
    _loop_1(i);
}
//Hold all the views for each button of navbar in order + their js files to execute
var views = [];
var viewJs = [];
var viewPath = "./app/views/";
var fs = require("fs");
var files = fs.readdirSync(viewPath);
files.sort();
//Starting text when looking for view js files below
//Files may be paths, eg app/view/test.js
var viewManagerDeclarationText = "<!--js=";
for (var i = 0; i < files.length; ++i) {
    var contents = fs.readFileSync(viewPath + files[i]).toString();
    //Parse the first line of a view file for the text <!--js=
    //Example: <!--js=test.js-->
    if (contents.startsWith(viewManagerDeclarationText)) {
        var firstLineLength = viewManagerDeclarationText.length;
        //Get length of first line
        while (firstLineLength < contents.length && contents[firstLineLength] != '\n')
            ++firstLineLength;
        //Get name to a .js file which will be executed when the view is called
        //Ignore --> at end of comment
        viewJs.push(contents.substring(viewManagerDeclarationText.length, firstLineLength - 3));
    }
    else
        viewJs.push("-"); //Push undefined character
    //Store the html file
    views.push(contents);
}
//Open the default page
buttonContainers[0].click();
function loadView(viewIndex) {
    //Inject view html into index.html #view-container
    $("#view-container").html(views[viewIndex]);
    //Load js file for view if it is defined
    if (viewJs[viewIndex] != "-") {
        require("./" + viewJs[viewIndex]);
        //Remove the js file afterwards so it can be reran
        delete require.cache[require.resolve("./" + viewJs[viewIndex])];
    }
}
