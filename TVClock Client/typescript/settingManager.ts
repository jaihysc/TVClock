//Renderer
//Manager for settings view

import { ipcRenderer } from "electron";
import {NetworkOperation} from "./RequestTypes";
import {IViewController} from "./viewManager";

export class SettingViewManager implements IViewController {
    networkingHostname!: JQuery<HTMLElement>;
    networkingPort!: JQuery<HTMLElement>;
    networkingUpdateBtn!: JQuery<HTMLElement>;
    apiUpdateBtn!: JQuery<HTMLElement>;

    initialize(): void {
        this.networkingHostname = $("#networking-hostname");
        this.networkingPort = $("#networking-port");
        this.networkingUpdateBtn = $("#networking-info-update-btn");
        this.apiUpdateBtn = $("#api-services-update-btn");
    }

    preload(): void {
        //Updating networking status with refresh button click
        this.networkingUpdateBtn.on("click", () => {
            if (this.networkingHostname != null)
                ipcRenderer.send(NetworkOperation.ConfigModify,
                    {hostname: String(this.networkingHostname.val()), port: Number(this.networkingPort.val())}
                );

            let hostname = this.networkingHostname.val();
            if (hostname == "localhost")
                hostname = "127.0.0.1";

            ipcRenderer.send(NetworkOperation.SetDisplayAddress,
                {hostname: hostname, port: Number(this.networkingPort.val())}
            );
        });
    }

    load(): void {
        $(() => {
            //todo, stuff here
        })
    }
}