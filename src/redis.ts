import { createClient } from "redis";

const client = createClient({
  url: "redis://localhost:6379"
});

client.on("error", (err: Error) => {
  console.error("Redis Error:", err);
});

async function connectRedis() {
  await client.connect();
  console.log("Redis Connected");
}

export  { client, connectRedis };