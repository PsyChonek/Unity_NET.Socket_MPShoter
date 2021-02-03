"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var net = __importStar(require("net"));
var Timer_1 = __importDefault(require("./Utils/Timer"));
var uuid_1 = require("uuid");
var timer = new Timer_1.default();
var Room = /** @class */ (function () {
    function Room(player0, player1) {
        this.player0 = null;
        this.player1 = null;
        this.player0 = player0;
        this.player1 = player1;
    }
    return Room;
}());
//List of all the players who are searching a match
var PlayersInQueue = new Array();
var Games = new Map();
var PlayersTotal = new Map();
//Object with all commands(I'll change it for a enum later)
var commands = {
    SEARCH_MATCH: "SEARCH_MATCH",
    SET_NAME: "SET_NAME",
    PING: "PING",
    SEARCHING_FOR_PLAYER: "SEARCHING_FOR_PLAYER",
    REMOVE_FROM_SEARCH: "REMOVE_FROM_SEARCH",
    GAME: "GAME_"
};
/**
 * @description Create the TCP server
 * @param socket client refference
 */
var server = net.createServer(function (socket) {
    var id = uuid_1.v4();
    var connected = false;
    var PlayerName = "";
    var gameID = "";
    //Send a "connected" message after one second to the client
    timer.executeAfter(2).then(function () {
        console.log(socket.remoteAddress + " has connected");
        connected = true;
        PlayerName = "Player" + Math.floor(Math.random() * 1000) + 1;
        socket.write(Buffer.from("CONNECTED" + '\n', "utf-8"));
        socket.write(Buffer.from("ID" + id + '\n', "utf-8"));
        socket.write(Buffer.from(PlayerName + '\n', "utf-8"));
        PlayersTotal.set(id, { id: id, connection: socket, PlayerName: PlayerName, gameID: gameID });
    });
    //Recieve data and execute command
    socket.on("data", function (data) {
        var commandsArray = data.toString().split('\n');
        commandsArray.forEach(function (dataOut) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            if (dataOut != "") {
                if (dataOut.startsWith(commands.SET_NAME)) {
                    dataOut = dataOut.replace("SET_NAME", "");
                    var temp = PlayersTotal.get(id);
                    PlayersTotal.delete(id);
                    temp.PlayerName = dataOut;
                    PlayersTotal.set(id, temp);
                }
                else if (dataOut == commands.PING) {
                    //Do nothing
                }
                else if (dataOut == commands.SEARCHING_FOR_PLAYER) {
                    PlayersInQueue.push(id);
                    console.log("Player: " + PlayerName + " Was added to queue");
                    console.log("Queue size: " + PlayersInQueue.length);
                }
                else if (dataOut == commands.REMOVE_FROM_SEARCH) {
                    PlayersInQueue = removeItemAll(PlayersInQueue, id);
                    console.log("Player: " + PlayerName + " Was removed from queue");
                    console.log("Queue size: " + PlayersInQueue.length);
                }
                else if (dataOut.startsWith(commands.GAME)) {
                    var trim = dataOut.replace(commands.GAME, "");
                    // Rework
                    if (trim == "GETPLAYERS") {
                        socket.write(Buffer.from("GAMEPLAYERS" + "0" + ((_b = (_a = Games.get(PlayersTotal.get(id).gameID)) === null || _a === void 0 ? void 0 : _a.player0) === null || _b === void 0 ? void 0 : _b.PlayerName) + "@" + ((_d = (_c = Games.get(PlayersTotal.get(id).gameID)) === null || _c === void 0 ? void 0 : _c.player0) === null || _d === void 0 ? void 0 : _d.id) + '\n', "utf-8"));
                        socket.write(Buffer.from("GAMEPLAYERS" + "1" + ((_f = (_e = Games.get(PlayersTotal.get(id).gameID)) === null || _e === void 0 ? void 0 : _e.player1) === null || _f === void 0 ? void 0 : _f.PlayerName) + "@" + ((_h = (_g = Games.get(PlayersTotal.get(id).gameID)) === null || _g === void 0 ? void 0 : _g.player1) === null || _h === void 0 ? void 0 : _h.id) + '\n', "utf-8"));
                    }
                    if (trim.startsWith("MOVE")) {
                        var move = trim.replace("MOVE", "");
                        var splits = move.split("@");
                        if (Number(splits[1]) == 0) {
                            (_k = (_j = Games.get(PlayersTotal.get(id).gameID)) === null || _j === void 0 ? void 0 : _j.player1) === null || _k === void 0 ? void 0 : _k.connection.write(Buffer.from("ENEMY_MOVE" + splits[0] + splits[1] + '\n', "utf-8"));
                        }
                        else if (Number(splits[1]) == 1) {
                            (_m = (_l = Games.get(PlayersTotal.get(id).gameID)) === null || _l === void 0 ? void 0 : _l.player0) === null || _m === void 0 ? void 0 : _m.connection.write(Buffer.from("ENEMY_MOVE" + splits[0] + splits[1] + '\n', "utf-8"));
                        }
                    }
                    if (trim.startsWith("END")) {
                        var end = trim.replace("END", "");
                        Games.delete(PlayersTotal.get(id).gameID);
                        console.log("Game close: Player death");
                    }
                }
                else {
                    console.log("Uknow command! " + dataOut);
                }
            }
        });
    });
    //The client has disconnected
    socket.on("close", function () {
        Array.from(Games.keys()).forEach(function (element) {
            if (element.includes(id)) {
                console.log("Game closed: Enemy left");
                var temp = element.replace(id, "");
                PlayersTotal.get(temp).connection.write(Buffer.from("ENEMY_LEFT", "utf-8"));
                Games.delete(element);
            }
        });
        PlayersInQueue = removeItemAll(PlayersInQueue, id);
        PlayersTotal.delete(id);
        console.log("Disconnected");
    });
});
//Make the server listen on the selected port
var PORT = 443;
server.listen(PORT, function () {
    debugger;
    console.log("RUNNING ON PORT: " + PORT);
    var searchingTimer = new Timer_1.default(function () {
        //Get executed 60 times every second
        if (PlayersInQueue.length >= 2) {
            var players_1 = [];
            PlayersInQueue.forEach(function (j) {
                players_1.push(j);
                console.log("Player was push: " + PlayersTotal.get(j).PlayerName);
            });
            Games.set(players_1[0] + players_1[1], new Room(PlayersTotal.get(players_1[0]), PlayersTotal.get(players_1[1]))); // Need Rework
            for (var index = 0; index < players_1.length; index++) {
                PlayersTotal.get(players_1[index]).gameID = players_1[0] + players_1[1];
                PlayersTotal.get(players_1[index]).connection.write(Buffer.from("IN_GAME" + players_1[0] + players_1[1] + '\n' + "INDEX" + index + '\n', "utf-8"));
                console.log(index);
                PlayersInQueue = removeItemAll(PlayersInQueue, players_1[index]);
            }
            console.log("Room created: " + PlayersTotal.get(players_1[0]).PlayerName + " " + PlayersTotal.get(players_1[1]).PlayerName);
        }
    });
});
function removeItemAll(arr, value) {
    var i = 0;
    while (i < arr.length) {
        if (arr[i] === value) {
            arr.splice(i, 1);
        }
        else {
            ++i;
        }
    }
    return arr;
}
