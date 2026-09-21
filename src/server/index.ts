import amqp from "amqplib";

async function main() {
  console.log("Starting Peril server...");
  const connString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(connString);
  console.log("Connnection was succesful.");

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
