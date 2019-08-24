//Renderer
//Manager for settings view

import { ipcRenderer } from "electron";
import {NetworkOperation, RequestType} from "../RequestTypes";
import {IViewController} from "../viewManager";
import {StringTags} from "../ViewCommon";

export class SettingViewManager implements IViewController {
    networkingHostname!: JQuery<HTMLElement>;
    networkingPort!: JQuery<HTMLElement>;
    networkingUpdateBtn!: JQuery<HTMLElement>;
    apiUpdateBtn!: JQuery<HTMLElement>;

    openWeatherMapKey!: JQuery<HTMLElement>;
    googleDocsDocumentId!: JQuery<HTMLElement>;
    openWeatherMapLocationCity!: JQuery<HTMLElement>;

    initialize(): void {
        this.networkingHostname = $("#networking-hostname");
        this.networkingPort = $("#networking-port");
        this.networkingUpdateBtn = $("#networking-info-update-btn");
        this.apiUpdateBtn = $("#api-services-update-btn");

        this.openWeatherMapKey = $("#openWeatherMap-key");
        this.googleDocsDocumentId = $("#google-docs-document-id");
        this.openWeatherMapLocationCity = $("#weather-location-city");
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
        this.apiUpdateBtn.on("click", () => {
            let postIdentifiers: string[] = [];
            let postFields: string[] = []; //Fields that are going to be posted to the server

            this.validateAPIField(this.openWeatherMapKey, StringTags.OpenWeatherMapKey, postIdentifiers, postFields);
            this.validateAPIField(this.googleDocsDocumentId, StringTags.GoogleDocsDocumentId, postIdentifiers, postFields);
            this.validateAPIField(this.openWeatherMapLocationCity, StringTags.OpenWeatherMapLocationCity, postIdentifiers, postFields);

            if (postIdentifiers.length > 0)
                ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: postIdentifiers, data: postFields, sendUpdate: false});
        })
    }

    load(): void {
        $(() => {
        })
    }

    private validateAPIField(field: JQuery<HTMLElement>, identifier: string, postIdentifiers: string[], postFields: string[]) {
        //Only add fields that are filled out
        if (field.val() == "")
            return;

        postIdentifiers.push(identifier);
        postFields.push(String(field.val()));
    }
}