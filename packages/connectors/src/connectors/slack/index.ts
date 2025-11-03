import { createConnector } from "@databite/build";
import { z } from "zod";
import {
  SlackIntegrationConfigSchema,
  SlackConnectionConfigSchema,
} from "./schemas";
import { sendMessage } from "./actions";
import { fetchMessages } from "./syncs";

export const slack = createConnector<
  typeof SlackIntegrationConfigSchema,
  typeof SlackConnectionConfigSchema
>()
  .withIdentity("slack", "Slack")
  .withVersion("1.0.0")
  .withAuthor("Databite Team")
  .withLogo("https://slack.com/img/icons/app-57.png")
  .withDocumentationUrl("https://api.slack.com")
  .withDescription("Slack connector for messaging and team communication")
  .withIntegrationConfig(SlackIntegrationConfigSchema)
  .withConnectionConfig(SlackConnectionConfigSchema)
  .withCategories("communication")
  .withTags("messaging", "team", "communication")
  .withAuthenticationFlow("slackAuth", (flow) =>
    flow
      // Step 1: OAuth authentication
      .oauth<"authenticate", { code: string }>("authenticate", {
        authUrl: (input) => {
          const state = Math.random().toString(36).substring(7);

          const params = new URLSearchParams({
            client_id: input.integration.clientId,
            scope: input.integration.scopes.join(","),
            redirect_uri: input.integration.redirectUri,
            state: state,
          });

          return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
        },
        title: "Authorize Slack",
        description: "Click below to open Slack and authorize this application",
        buttonLabel: "Connect to Slack",
        popupWidth: 600,
        popupHeight: 800,
        timeout: 300000, // 5 minutes
        extractParams: (url) => ({
          code: url.searchParams.get("code") || "",
        }),
      })

      // Step 2: Exchange code for access token
      .http("tokenExchange", {
        url: "https://slack.com/api/oauth.v2.access",
        method: "POST",
        headers: () => ({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
        body: (ctx) =>
          new URLSearchParams({
            client_id: ctx.integration.clientId,
            client_secret: ctx.integration.clientSecret,
            code: ctx.authenticate.code,
            redirect_uri: ctx.integration.redirectUri,
          }).toString(),
        returnType: {} as any,
      })

      // Step 3: Transform the response into our desired format
      .transform<"result", z.infer<typeof SlackConnectionConfigSchema>>(
        "result",
        (ctx) => {
          const { tokenExchange } = ctx;

          if (!tokenExchange.ok) {
            console.log(tokenExchange);
            throw new Error("Failed to authenticate with Slack");
          }

          return {
            workspace: tokenExchange.team.name,
            userId: tokenExchange.authed_user.id,
            accessToken: tokenExchange.access_token,
            teamId: tokenExchange.team.id,
            teamName: tokenExchange.team.name,
          };
        }
      )

      // Step 4: Show success message
      .display("success", {
        title: "Successfully Connected!",
        content: (ctx) =>
          `You've successfully connected to ${ctx.result.teamName}. You can now send messages and interact with your Slack workspace.`,
        continueLabel: "Done",
      })
      .returns((ctx) => ctx.result)
  )
  .withRefresh(async (connection, _integration) => {
    return connection.config;
  })
  .withRateLimit({
    requests: 100, // 100 requests per minute
    windowMs: 60000, // 1 minute
    strategy: "per-connection", // rate limit per connection
  })
  .withActions({ "Send Message": sendMessage })
  .withSyncs({ "Fetch Messages": fetchMessages })
  .build();
