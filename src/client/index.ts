import amqp from "amqplib";
import { clientWelcome, commandStatus, getInput, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType, subscribeJSON } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { handlerPause } from "./handlers.js";

async function main() {
  console.log("Starting Peril client...");
  const connString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(connString);
  console.log("Connnection was succesful.");

  let username = await clientWelcome();
  declareAndBind(conn, ExchangePerilDirect, 'pause.' + username, PauseKey, SimpleQueueType.Transient);

  let myGameState = new GameState(username);

  while (true) {
      const input = await getInput();
      const first_word = input[0];

      subscribeJSON(conn, ExchangePerilDirect, 'pause.' + username, PauseKey, SimpleQueueType.Transient, handlerPause(myGameState));

      if (first_word === "spawn") {
        console.log("Sending a spawn message");
        try {
          commandSpawn(myGameState, input);          
        } catch (error) {
          console.error(error);
        }
      }
      else if (first_word === "move") {
        console.log("Sending a move message");
        try {
          commandMove(myGameState, input);          
        } catch (error) {
          console.error(error);
        }
      }
      else if (first_word === "status") {
        commandStatus(myGameState);
      }
      else if (first_word === "help") {
        printClientHelp();
      }
      else if (first_word === "spam") {
        console.log("Spamming not allowed yet!");
      }
      else if (first_word === "quit") {
        console.log("We are quiting. Breaking out of loop.");
        printQuit();
        break;
      }
      else {
        console.error("command not understood. Please try again");
      }
    };


  process.on('SIGINT', async () => {
    await conn.close();
    console.log('Connection closed.');
    console.log('Program is shuting down.');
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
