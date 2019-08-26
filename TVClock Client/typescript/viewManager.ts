//Renderer
//Manages the switching between the different views

import {TodoViewManager} from "./view-scripts/tasks";
import {ScheduleViewManager} from "./view-scripts/schedule";
import {SettingViewManager} from "./view-scripts/settings";
import {CssClasses} from "./ViewCommon";

export interface IViewController {
    initialize(): void; //Initialize jquery selectors
    preload(): void //Setup event listeners
    load(): void; //Document ready operations
}

//Hold all the views for each button of navbar in order + their controllers to execute
let viewHtml: string[] = [];
let viewControllers: IViewController[] = [new TodoViewManager(), new ScheduleViewManager(), new SettingViewManager()]; //!! Add view controllers here !!

const viewPath = __dirname + "/views/";

//Read and store the view html files in alphanumeric order
let fs = require("fs");
let files = fs.readdirSync(viewPath);
files.sort();

for (let i = 0; i < files.length; ++i) {
    let contents = fs.readFileSync(viewPath + files[i]).toString();
    viewHtml.push(contents)
}

//Buttons for the different views
let buttonContainers = $( ".nav-item" );
let lastButton = buttonContainers[1];

//Add listeners on all the buttonContainers to load their corresponding view
for (let i = 0; i < buttonContainers.length; ++i) {
    buttonContainers[i].addEventListener("click", () => {
        //Make last button inactive
        lastButton.classList.remove(CssClasses.NavbarActive);
        lastButton = buttonContainers[i];

        //Make current button active
        buttonContainers[i].classList.add(CssClasses.NavbarActive);

        //Inject view html into index.html #view-container
        $("#view-container").html(viewHtml[i]);

        // Todo, redo the 3 methods in viewController
        // initialize initializes ipcRenderer event handlers
        // preload instead loads Jquery selectors, etc...
        // loadEvents loads view dependent event handlers
        // load stays the same

        //Load the corresponding viewController
        viewControllers[i].initialize();
        viewControllers[i].preload();
        viewControllers[i].load();
    });
}

// Todo, call initialize on all the views

//Load the first view
buttonContainers[0].click();