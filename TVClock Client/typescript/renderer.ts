//Items involving the DOM is performed in renderer
import {ViewManager} from "./viewManager";

import { ipcRenderer } from "electron";
import {NetworkOperation} from "./RequestTypes";
require("./statusBarManager.js");
ViewManager.initializeViews();

// Event sent by main once network is established to fetch data for the views
ipcRenderer.on(NetworkOperation.ViewDataFetch, (event: any) => {
    // Attempt to fetch view data from server, time out after 10 seconds
    const promise = new Promise((resolve, reject) => {
        setTimeout(reject, 10000);

        ViewManager.initializeViewData(resolve);
    });

    promise.then(() => {  // Success
        event.sender.send(NetworkOperation.ViewDataFetchSuccess);
    });
    promise.catch(() => {  // Failure
        event.sender.send(NetworkOperation.ViewDataFetchFailure);
    });
});