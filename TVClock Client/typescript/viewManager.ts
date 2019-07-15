//Manages the switching between the different views (todos, schedule, settings)

//Fetch the buttonContainers
let buttonContainers = $( ".nav-item" );
let lastButton = buttonContainers[0];

//Add listeners on all the buttonContainers to load their corresponding view
for (let i = 0; i < buttonContainers.length; ++i) {
    buttonContainers[i].addEventListener("click", () =>
    {
        //Make active
        buttonContainers[i].classList.add("active");

        //Make last button inactive
        lastButton.classList.remove("active");
        lastButton = buttonContainers[i];

        loadView(i);
    });
}

//Hold all the views for each button of navbar in order
let views: string[] = [];

const viewPath = "./app/views/";

let fs = require("fs");
let files = fs.readdirSync(viewPath);
for (let i = 0; i < files.length; ++i) {
    fs.readFile(viewPath + files[i], "utf8", (err: null, contents: string) => {
        //Loads the default view 0
        if (i === 0) {
            $("#view-container").html(contents);
        }
        views.push(contents)
    });
}

function loadView(viewIndex: number) {
    //Inject view html into index.html #view-container
    $("#view-container").html(views[viewIndex]);
}
