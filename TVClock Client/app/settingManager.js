"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
var SettingViewManager = (function () {
    function SettingViewManager() {
        this.networkingHostname = $("#networking-hostname");
        this.networkingPort = $("#networking-port");
        this.networkingUpdateBtn = $("#networking-info-update-btn");
    }
    SettingViewManager.prototype.initialize = function () {
        this.networkingHostname = $("#networking-hostname");
        this.networkingPort = $("#networking-port");
        this.networkingUpdateBtn = $("#networking-info-update-btn");
    };
    SettingViewManager.prototype.preload = function () {
        var _this = this;
        this.networkingUpdateBtn.on("click", function () {
            if (_this.networkingHostname != null)
                electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.ConfigModify, { hostname: String(_this.networkingHostname.val()), port: Number(_this.networkingPort.val()) });
            var hostname = _this.networkingHostname.val();
            if (hostname == "localhost")
                hostname = "127.0.0.1";
            electron_1.ipcRenderer.send("networking-display-address", { hostname: hostname, port: Number(_this.networkingPort.val()) });
        });
    };
    SettingViewManager.prototype.load = function () {
        $(function () {
        });
    };
    return SettingViewManager;
}());
exports.SettingViewManager = SettingViewManager;
