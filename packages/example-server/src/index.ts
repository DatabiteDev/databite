import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { DatabiteServer } from "@databite/server";
import { InMemoryAdapter } from "@databite/engine";
import { slack } from "@databite/connectors";

async function main() {
  // Create server instance with security configuration
  const server = new DatabiteServer({
    port: 3001,
    engineConfig: {
      schedulerAdapter: new InMemoryAdapter(),
      minutesBetweenSyncs: 1,
    },
    // Security configuration
    security: {
      // Rate limiting
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Max 100 requests per window per IP
      },

      // CORS - Allow specific origins (supports wildcards)
      allowedOrigins: [
        "http://localhost:3000",
        "http://localhost:*", // Allow any localhost port
        process.env.SLACK_REDIRECT_URI!,
      ],

      // Request size limit
      requestSizeLimit: "10mb",

      // Enable security features
      enableHelmet: true,
      enableRateLimit: true,

      // Optional: IP whitelist (empty = allow all)
      ipWhitelist: [],

      // Optional: IP blacklist
      ipBlacklist: [
        // '192.168.1.100', // Block specific IPs
      ],

      // Optional: Custom request validation
      requestValidator: async (req) => {
        // Example: Validate custom header
        const apiVersion = req.headers["x-api-version"];
        if (apiVersion && apiVersion !== "1.0") {
          console.warn(`Unsupported API version: ${apiVersion}`);
          return false;
        }

        // Example: Block requests with suspicious patterns
        const userAgent = req.headers["user-agent"] || "";
        if (
          userAgent.toLowerCase().includes("bot") &&
          !userAgent.includes("Googlebot")
        ) {
          console.warn(`Blocked suspicious user agent: ${userAgent}`);
          return false;
        }

        return true;
      },
    },
  });

  // Add integrations
  await server.addIntegration(
    slack.createIntegration("Slack Integration", {
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      redirectUri: process.env.SLACK_REDIRECT_URI!,
      scopes: [
        "chat:write",
        "channels:read",
        "users:read",
        "team:read",
        "channels:history",
      ],
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
  console.log("\n🔒 Security features enabled:");
  console.log("  ✓ Rate limiting (100 req/15min per IP)");
  console.log("  ✓ CORS protection with origin validation");
  console.log("  ✓ Security headers (Helmet)");
  console.log("  ✓ Input sanitization");
  console.log("  ✓ Request size limits (10mb)");
  console.log("  ✓ IP filtering");
  console.log("\n💡 Test with: curl http://localhost:3001/api/health");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Stopping server...");
    await server.stop();
    process.exit(0);
  });
}

main().catch(console.error);
