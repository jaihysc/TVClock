"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RequestTypes_1 = require("./RequestTypes");
var NetworkingPacket = (function () {
    function NetworkingPacket(requestType, data, dataIdentifiers, timestamp, id) {
        this.requestType = requestType;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.timestamp = timestamp;
        this.id = id;
    }
    return NetworkingPacket;
}());
var NetworkingConfig = (function () {
    function NetworkingConfig() {
        this.hostname = "localhost";
        this.port = 4999;
    }
    return NetworkingConfig;
}());
var NetworkManager = (function () {
    function NetworkManager(window, callback) {
        this.networkingId = 0;
        this.networkConnected = false;
        var net = require("net");
        this.networkClient = new net.Socket();
        this.window = window;
        this.networkConfig = new NetworkingConfig();
        this.queuedRequests = [];
        this.networkingId = 0;
        this.callback = callback;
        this.initialize();
        this.connect();
    }
    NetworkManager.prototype.initialize = function () {
        var _this = this;
        this.networkClient.on(RequestTypes_1.NetworkingStatus.Data, function (response) {
            if (response == undefined)
                return;
            console.log("Networking | Received: " + response);
            var returnedPacket;
            try {
                returnedPacket = JSON.parse(response.toString());
            }
            catch (e) {
                console.log("Networking | Error handling received message: " + e);
                return;
            }
            if (returnedPacket.requestType == RequestTypes_1.RequestType.Update) {
                if (returnedPacket.dataIdentifiers == undefined || returnedPacket.data == undefined)
                    return;
                for (var i = 0; i < returnedPacket.dataIdentifiers.length; ++i) {
                    _this.window.webContents.send(returnedPacket.dataIdentifiers[i] + "-update", returnedPacket.data[i]);
                }
                return;
            }
            var foundId = false;
            for (var i = 0; i < _this.queuedRequests.length; ++i) {
                if (_this.queuedRequests[i].id === returnedPacket.id) {
                    _this.queuedRequests[i].event.returnValue = { identifiers: returnedPacket.dataIdentifiers, data: returnedPacket.data };
                    _this.queuedRequests.splice(i, 1);
                    foundId = true;
                    break;
                }
            }
            if (!foundId)
                console.log("Networking | Received packet with no matching id - Ignoring");
        });
        this.networkClient.once(RequestTypes_1.NetworkingStatus.Ready, function () {
            _this.callback();
        });
        this.networkClient.on(RequestTypes_1.NetworkingStatus.Close, function () {
            console.log("Networking | Connection closed");
            _this.disconnect();
            _this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "disconnected");
        });
        this.networkClient.on(RequestTypes_1.NetworkingStatus.Error, function (error) {
            console.log("Networking | " + error);
            _this.disconnect();
            _this.queuedRequests.forEach(function (value) {
                value.event.returnValue = null;
            });
            _this.queuedRequests = [];
            _this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "disconnected");
        });
    };
    NetworkManager.prototype.send = function (event, requestType, identifiers, data) {
        if (!this.networkConnected) {
            event.returnValue = undefined;
            return;
        }
        var id = this.networkingId++;
        var dataJson = [];
        if (data != undefined) {
            dataJson.push(JSON.stringify(data));
        }
        var packet = new NetworkingPacket(requestType, dataJson, identifiers, Date.now(), id);
        this.queuedRequests.push({ id: id, event: event });
        var str = JSON.stringify(packet);
        this.sendString(str);
    };
    NetworkManager.prototype.sendString = function (str) {
        this.networkClient.write(str + "\r\n", function () {
            console.log("Networking | Sent: " + str);
        });
    };
    NetworkManager.prototype.modifyConfig = function (hostname, port) {
        this.networkConfig.hostname = hostname;
        this.networkConfig.port = port;
        this.reconnect();
    };
    NetworkManager.prototype.connect = function () {
        var _this = this;
        if (this.networkConnected)
            return;
        console.log("Networking | Connecting");
        this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "connecting");
        this.networkClient.connect(this.networkConfig.port, this.networkConfig.hostname, function () {
            console.log("Networking | Connection established");
            _this.networkConnected = true;
            _this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "connected");
            _this.window.webContents.send(RequestTypes_1.NetworkOperation.SetDisplayAddress, {
                hostname: _this.networkConfig.hostname,
                port: String(_this.networkConfig.port)
            });
        });
    };
    NetworkManager.prototype.disconnect = function () {
        if (!this.networkConnected)
            return;
        console.log("Networking | Disconnecting");
        this.networkConnected = false;
        this.networkClient.end();
    };
    NetworkManager.prototype.reconnect = function () {
        var _this = this;
        if (this.networkConnected) {
            this.disconnect();
            this.networkClient.once(RequestTypes_1.NetworkingStatus.Close, function () {
                _this.connectWithEvent();
            });
        }
        else {
            this.connectWithEvent();
        }
    };
    NetworkManager.prototype.connectWithEvent = function () {
        var _this = this;
        this.connect();
        this.networkClient.once(RequestTypes_1.NetworkingStatus.Ready, function () {
            _this.window.webContents.send(RequestTypes_1.NetworkOperation.Reconnect);
        });
    };
    return NetworkManager;
}());
exports.NetworkManager = NetworkManager;
