import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { DatabiteServer } from "@databite/server";
import { InMemoryAdapter } from "@databite/engine";
import { slack } from "@databite/connectors";

async function main() {
  // Create server instance
  const server = new DatabiteServer({
    port: 3001,
    engineConfig: {
      schedulerAdapter: new InMemoryAdapter(),
      minutesBetweenSyncs: 10,
    },
  });

  console.log(process.env.SLACK_REDIRECT_URI);

  // Add integrations (like example-webapp)
  await server.addIntegration(
    slack.createIntegration("Slack Integration", {
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      redirectUri: process.env.SLACK_REDIRECT_URI!,
      scopes: ["chat:write", "channels:read", "users:read", "team:read"],
    })
  );

  // Start the server
  await server.start();

  console.log("✅ Databite Server started successfully!");
  console.log("🌐 Server running at http://localhost:3001");
  console.log("\n📋 Available endpoints:");
  console.log("  GET  /api/health           - Health check");
  console.log("  GET  /api/status          - Server status");
  console.log("  GET  /api/connectors       - List connectors");
  console.log("  GET  /api/integrations     - List integrations");
  console.log("  GET  /api/connections     - List connections");
  console.log("\n💡 Test with: curl http://localhost:3001/api/health");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Stopping server...");
    await server.stop();
    process.exit(0);
  });
}

main().catch(console.error);
