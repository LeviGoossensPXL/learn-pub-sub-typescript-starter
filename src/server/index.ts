import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState, type PlayingState } from "../internal/gamelogic/gamestate.js";

async function main() {
  console.log("Starting Peril server...");
  const connString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(connString);
  console.log("Connnection was succesful.");

  const channel = await conn.createConfirmChannel();
  const playingState: PlayingState = {isPaused: true}
  publishJSON(channel, ExchangePerilDirect, PauseKey, playingState)

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
