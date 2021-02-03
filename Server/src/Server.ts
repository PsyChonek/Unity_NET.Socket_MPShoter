import * as net from "net";
import Timer from "./Utils/Timer";
import { v4 as uuidv4 } from 'uuid';
import { Console, time, timeStamp } from "console";
import { platform } from "os";
import { isTypeAliasDeclaration, resolveModuleName } from "typescript";

let timer: Timer = new Timer();

//Players interface
export interface IPlayer {
  id: string;
  connection: net.Socket;
  PlayerName: string;
  gameID: string;
}

class Room{
  public player0: IPlayer | null = null;
  public player1: IPlayer | null = null;
  constructor(player0: IPlayer, player1: IPlayer) {
    this.player0 = player0;
    this.player1 = player1;
  }
}

//List of all the players who are searching a match
let PlayersInQueue = new Array();

let Games = new Map<string, Room>();

let PlayersTotal = new Map();

//Object with all commands(I'll change it for a enum later)
let commands = {
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
let server = net.createServer((socket) => {
  let id = uuidv4();
  let connected = false;
  let PlayerName = "";
  let gameID = "";

  //Send a "connected" message after one second to the client
  timer.executeAfter(2).then(() => {
    console.log(`${socket.remoteAddress} has connected`);
    connected = true;
    PlayerName = "Player" + Math.floor(Math.random() * 1000) + 1
    socket.write(Buffer.from("CONNECTED" + '\n', "utf-8"));
    socket.write(Buffer.from(`ID${id}` + '\n', "utf-8"));
    socket.write(Buffer.from(PlayerName + '\n', "utf-8"));
    PlayersTotal.set(id, { id: id, connection: socket, PlayerName: PlayerName, gameID: gameID})
 
  });




  //Recieve data and execute command
  socket.on("data", (data) => {
    var commandsArray: Array<string> = data.toString().split('\n');

    commandsArray.forEach(dataOut => {
      if(dataOut != ""){
        if (dataOut.startsWith(commands.SET_NAME)) {
          dataOut = dataOut.replace("SET_NAME", "");      
          let temp = PlayersTotal.get(id);
          PlayersTotal.delete(id);
          temp.PlayerName = dataOut;
          PlayersTotal.set(id, temp)
        }
        else if (dataOut == commands.PING) {
          //Do nothing
        }
        else if (dataOut == commands.SEARCHING_FOR_PLAYER) {

          PlayersInQueue.push(id)
          console.log(`Player: ` + PlayerName + ` Was added to queue`);
          console.log("Queue size: " + PlayersInQueue.length)
        }
        else if (dataOut == commands.REMOVE_FROM_SEARCH) {
          PlayersInQueue = removeItemAll(PlayersInQueue,id)     
          console.log(`Player: ` + PlayerName + ` Was removed from queue`);
          console.log("Queue size: " + PlayersInQueue.length)
        }
        else if (dataOut.startsWith(commands.GAME)){
          let trim = dataOut.replace(commands.GAME, "")

            // Rework
            if (trim == "GETPLAYERS"){  
              socket.write(Buffer.from("GAMEPLAYERS" + "0" + Games.get(PlayersTotal.get(id).gameID)?.player0?.PlayerName + "@" + Games.get(PlayersTotal.get(id).gameID)?.player0?.id+'\n', "utf-8"))
              socket.write(Buffer.from("GAMEPLAYERS" + "1" + Games.get(PlayersTotal.get(id).gameID)?.player1?.PlayerName + "@" + Games.get(PlayersTotal.get(id).gameID)?.player1?.id+'\n', "utf-8"))
            }   

            if (trim.startsWith("MOVE")){
              let move = trim.replace("MOVE", "")
              let splits = move.split("@")
              
              if (Number(splits[1]) == 0){
                Games.get(PlayersTotal.get(id).gameID)?.player1?.connection.write(Buffer.from( "ENEMY_MOVE" + splits[0] + splits[1] +'\n', "utf-8"));
              }
              else if (Number(splits[1]) == 1){
                Games.get(PlayersTotal.get(id).gameID)?.player0?.connection.write(Buffer.from( "ENEMY_MOVE" + splits[0] + splits[1] +'\n', "utf-8"));
              }

            }

            if (trim.startsWith("END")){
              let end = trim.replace("END", "")
              Games.delete(PlayersTotal.get(id).gameID)
              console.log("Game close: Player death")
            }
        }
        else {
          console.log("Uknow command! " + dataOut )
        }
      }
        
    });
  });

  //The client has disconnected
  socket.on("close", () => {
    Array.from(Games.keys()).forEach(element => {
      if(element.includes(id)){  
        console.log("Game closed: Enemy left")
        let temp = element.replace(id,"")
        PlayersTotal.get(temp).connection.write(Buffer.from("ENEMY_LEFT", "utf-8"));
        Games.delete(element)
      }     
    });
    PlayersInQueue = removeItemAll(PlayersInQueue,id);
    PlayersTotal.delete(id);

    console.log("Disconnected");
  });
});

//Make the server listen on the selected port
const PORT = 443;

server.listen(PORT, () => {
  debugger;
  console.log("RUNNING ON PORT: " + PORT);

  let searchingTimer: Timer = new Timer(() => {
    //Get executed 60 times every second
    if (PlayersInQueue.length >= 2) {
      let players: Array<string> = [];
      PlayersInQueue.forEach((j) => {
        players.push(j);
        console.log("Player was push: " + PlayersTotal.get(j).PlayerName)
      });
      Games.set(players[0] + players[1],new Room(PlayersTotal.get(players[0]), PlayersTotal.get(players[1]))); // Need Rework

      for (let index = 0; index < players.length; index++) {

        PlayersTotal.get(players[index]).gameID = players[0] + players[1];     
        PlayersTotal.get(players[index]).connection.write(Buffer.from("IN_GAME" + players[0] + players[1] + '\n' + "INDEX" + index + '\n', "utf-8"));
        console.log(index)
        PlayersInQueue = removeItemAll(PlayersInQueue,players[index]) 
      }

      console.log("Room created: " + PlayersTotal.get(players[0]).PlayerName + " " + PlayersTotal.get(players[1]).PlayerName);  
    }
  });

});

function removeItemAll(arr: string[], value: string) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}

