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
var NetworkManager = (function () {
    function NetworkManager(window, ready) {
        var _this = this;
        this.networkConnected = false;
        this.readyCallbackUsed = false;
        this.networkingId = 0;
        this.connectionId = 0;
        this.activeConnectionId = 0;
        this.hostname = "";
        this.port = 0;
        this.window = window;
        this.queuedRequests = [];
        this.networkingId = 0;
        this.readyCallback = function () {
            if (!_this.readyCallbackUsed) {
                _this.readyCallbackUsed = true;
                ready();
            }
        };
        this.dataCallback = function (id, response) {
            if (response == undefined || id < _this.activeConnectionId)
                return;
            _this.checkConnectionId(id);
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
        };
        this.closeCallback = function (id) {
            if (id < _this.activeConnectionId)
                return;
            _this.checkConnectionId(id);
            console.log("Networking | Connection closed");
            _this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "disconnected");
        };
        this.errorCallback = function (id, str) {
            if (id < _this.activeConnectionId)
                return;
            _this.checkConnectionId(id);
            console.log("Networking | " + str);
            _this.disconnect();
            _this.queuedRequests.forEach(function (value) {
                value.event.returnValue = null;
            });
            _this.queuedRequests = [];
            _this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "disconnected");
        };
        this.connection = new Connection(this.connectionId++, this.readyCallback, this.dataCallback, this.closeCallback, this.errorCallback);
    }
    NetworkManager.prototype.checkConnectionId = function (id) {
        if (id > this.activeConnectionId)
            this.activeConnectionId = id;
    };
    NetworkManager.prototype.send = function (event, requestType, identifiers, data) {
        if (!this.networkConnected || this.connection == undefined) {
            event.returnValue = undefined;
            return;
        }
        var id = this.networkingId++;
        var dataJson = [];
        if (data != undefined) {
            dataJson.push(JSON.stringify(data));
        }
        this.queuedRequests.push({ id: id, event: event });
        var str = JSON.stringify(new NetworkingPacket(requestType, dataJson, identifiers, Date.now(), id));
        this.connection.sendString(str, function () {
            console.log("Networking | Sent: " + str);
        });
    };
    NetworkManager.prototype.modifyConfig = function (hostname, port) {
        this.hostname = hostname;
        this.port = port;
        this.reconnect();
    };
    NetworkManager.prototype.connect = function () {
        var _this = this;
        if (this.networkConnected || this.connection == undefined)
            return;
        console.log("Networking | Connecting");
        this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "connecting");
        this.connection.connect(this.hostname, this.port, function () {
            console.log("Networking | Connection established");
            _this.checkConnectionId(_this.connection.id);
            _this.networkConnected = true;
            _this.window.webContents.send(RequestTypes_1.NetworkingStatus.SetStatus, "connected");
            _this.window.webContents.send(RequestTypes_1.NetworkOperation.SetDisplayAddress, {
                hostname: _this.hostname,
                port: String(_this.port)
            });
        });
    };
    NetworkManager.prototype.disconnect = function () {
        if (!this.networkConnected || this.connection == undefined)
            return;
        console.log("Networking | Disconnecting");
        this.networkConnected = false;
        this.connection.disconnect();
    };
    NetworkManager.prototype.reconnect = function () {
        if (this.networkConnected && this.connection != undefined) {
            this.disconnect();
            this.reconnectConnection();
        }
        else {
            this.reconnectConnection();
        }
    };
    NetworkManager.prototype.reconnectConnection = function () {
        var _this = this;
        this.connection = new Connection(this.connectionId++, function () {
            _this.readyCallback();
            _this.window.webContents.send(RequestTypes_1.NetworkOperation.Reconnect);
        }, this.dataCallback, this.closeCallback, this.errorCallback);
        this.connect();
    };
    return NetworkManager;
}());
exports.NetworkManager = NetworkManager;
var Connection = (function () {
    function Connection(id, ready, data, close, error) {
        var _this = this;
        var net = require("net");
        this.networkClient = new net.Socket();
        this.id = id;
        this.networkClient.on(RequestTypes_1.NetworkingStatus.Ready, function () { ready(_this.id); });
        this.networkClient.on(RequestTypes_1.NetworkingStatus.Data, function (response) { data(_this.id, response); });
        this.networkClient.on(RequestTypes_1.NetworkingStatus.Close, function () { close(_this.id); });
        this.networkClient.on(RequestTypes_1.NetworkingStatus.Error, function (str) { error(_this.id, str); });
    }
    Connection.prototype.sendString = function (str, callback) {
        this.networkClient.write(str + "\r\n", callback);
    };
    Connection.prototype.connect = function (hostname, port, callback) {
        this.networkClient.connect(port, hostname, callback);
    };
    Connection.prototype.disconnect = function () {
        this.networkClient.end();
    };
    return Connection;
}());
