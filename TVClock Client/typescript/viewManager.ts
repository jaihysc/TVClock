//Renderer
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

//Hold all the views for each button of navbar in order + their js files to execute
let views: string[] = [];
let viewJs: string[] = [];

const viewPath = "./app/views/";

let fs = require("fs");
let files = fs.readdirSync(viewPath);
files.sort();

//Starting text when looking for view js files below
//Files may be paths, eg app/view/test.js
const viewManagerDeclarationText = "<!--js=";

for (let i = 0; i < files.length; ++i) {
    fs.readFile(viewPath + files[i], "utf8", (err: null, contents: string) => {
        //Parse the first line of a view file for the text <!--js=
        //Example: <!--js=test.js-->
        if (contents.startsWith(viewManagerDeclarationText)) {
            let firstLineLength = viewManagerDeclarationText.length;
            //Get length of first line
            while (firstLineLength < contents.length && contents[firstLineLength] != '\n')
                ++firstLineLength;

            //Get name to a .js file which will be executed when the view is called
            //Ignore --> at end of comment
            viewJs.push(contents.substring(viewManagerDeclarationText.length, firstLineLength-3));
        } else
            viewJs.push("-"); //Push undefined character

        //Loads the default view 0 upon project start
        if (i === 0) {
            $("#view-container").html(contents);
        }

        //Store the html file
        views.push(contents)
    });
}

function loadView(viewIndex: number) {
    //Inject view html into index.html #view-container
    $("#view-container").html(views[viewIndex]);
    //Load js file for view if it is defined
    if (viewJs[viewIndex] != "-") {
        require("./" + viewJs[viewIndex]);

        //Remove the js file afterwards so it can be reran
        delete require.cache[require.resolve("./" + viewJs[viewIndex])]
    }
}
