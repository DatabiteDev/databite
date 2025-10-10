import { createConnector } from "@databite/build";
import { createFlow } from "@databite/flow";
import { z } from "zod";

const SlackIntegrationConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
});

const SlackConnectionConfigSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

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
  .withAuthenticationFlow(
    createFlow<typeof SlackConnectionConfigSchema>("slackAuth")
      // Step 1: Get client credentials from user
      .form("getClientCredentials", {
        title: "Slack App Configuration",
        description:
          "Enter your Slack app credentials to begin the authentication process",
        fields: [
          {
            name: "clientId",
            label: "Client ID",
            type: "text",
            placeholder: "Enter your Slack app Client ID",
            required: true,
          },
          {
            name: "clientSecret",
            label: "Client Secret",
            type: "password",
            placeholder: "Enter your Slack app Client Secret",
            required: true,
          },
          {
            name: "redirectUri",
            label: "Redirect URI",
            type: "url",
            placeholder: "https://your-app.com/auth/callback",
            required: true,
          },
        ],
        submitLabel: "Continue to Authorization",
      })
      // Step 2: Generate OAuth authorization URL
      .transform("generateAuthUrl", (input) => {
        const state = Math.random().toString(36).substring(2, 15);
        const scopes = [
          "channels:read",
          "channels:write",
          "chat:write",
          "users:read",
          "team:read",
        ].join(",");

        const authUrl = new URL("https://slack.com/oauth/v2/authorize");
        authUrl.searchParams.set(
          "client_id",
          input.getClientCredentials.clientId
        );
        authUrl.searchParams.set("scope", scopes);
        authUrl.searchParams.set(
          "redirect_uri",
          input.getClientCredentials.redirectUri
        );
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("response_type", "code");

        return {
          authUrl: authUrl.toString(),
          state,
          scopes,
        };
      })
      // Step 3: Display authorization URL to user
      .display("showAuthUrl", {
        title: "Authorize with Slack",
        content: (input) => `${input.generateAuthUrl.authUrl}`,
        continueLabel: "I've Authorized the App",
      })
      // Step 4: Get authorization code from user
      .form("getAuthCode", {
        title: "Enter Authorization Code",
        description:
          "After authorizing the app, Slack will redirect you with a code. Please enter it below:",
        fields: [
          {
            name: "code",
            label: "Authorization Code",
            type: "text",
            placeholder: "Enter the authorization code from Slack",
            required: true,
          },
        ],
        submitLabel: "Complete Authentication",
      })
      // Step 5: Exchange authorization code for access token (using mock API)
      .http("exchangeCodeForToken", {
        url: "https://jsonplaceholder.typicode.com/posts",
        method: "POST",
        returnType: {
          ok: true,
          access_token: "",
          token_type: "Bearer",
          scope: "",
          bot_user_id: "",
          app_id: "",
          team: {
            id: "",
            name: "",
          },
          enterprise: null,
          authed_user: {
            id: "",
            scope: "",
            access_token: "",
            token_type: "Bearer",
          },
        },
        headers: {
          "Content-Type": "application/json",
        },
        body: (input) => ({
          title: "Slack OAuth Token Exchange",
          body: `Mock token exchange for client: ${input.getClientCredentials.clientId}`,
          userId: 1,
          // Mock the OAuth response structure
          ok: true,
          access_token: `xoxb-mock-access-token-${Math.random()
            .toString(36)
            .substring(2, 15)}`,
          token_type: "Bearer",
          scope: "channels:read,channels:write,chat:write,users:read,team:read",
          bot_user_id: `U${Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()}`,
          app_id: `A${Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()}`,
          team: {
            id: `T${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            name: "Mock Slack Workspace",
          },
          enterprise: null,
          authed_user: {
            id: `U${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            scope:
              "channels:read,channels:write,chat:write,users:read,team:read",
            access_token: `xoxp-mock-user-token-${Math.random()
              .toString(36)
              .substring(2, 15)}`,
            token_type: "Bearer",
          },
        }),
        timeout: 30000,
      })
      // Step 6: Validate and format the token response
      .transform("validateTokenResponse", (input) => {
        // For mock API, we'll use the mock data we sent in the body
        const mockResponse = input.exchangeCodeForToken;

        if (!mockResponse.ok) {
          throw new Error(
            "Failed to exchange authorization code for access token"
          );
        }

        if (!mockResponse.access_token) {
          throw new Error("No access token received from mock API");
        }

        return {
          accessToken: mockResponse.access_token,
          refreshToken:
            mockResponse.authed_user?.access_token || mockResponse.access_token,
          scope: mockResponse.scope,
          botUserId: mockResponse.bot_user_id,
          teamId: mockResponse.team.id,
          teamName: mockResponse.team.name,
          userId: mockResponse.authed_user?.id,
        };
      })
      // Step 7: Test the connection by fetching team info (using mock API)
      .http("testConnection", {
        url: "https://jsonplaceholder.typicode.com/users/1",
        method: "GET",
        returnType: {
          ok: true,
          team: {
            id: "",
            name: "",
            domain: "",
            email_domain: "",
            icon: {
              image_34: "",
              image_44: "",
              image_68: "",
              image_88: "",
              image_102: "",
              image_132: "",
              image_230: "",
            },
          },
        },
        headers: (input) => ({
          Authorization: `Bearer ${input.validateTokenResponse.accessToken}`,
        }),
        timeout: 15000,
      })
      // Step 7.5: Transform mock API response to team info format
      .transform("formatTeamInfo", (input) => {
        // Create mock team info from the validated token response
        return {
          ok: true,
          team: {
            id: input.validateTokenResponse.teamId,
            name: input.validateTokenResponse.teamName,
            domain: "mock-slack-workspace",
            email_domain: "mockcompany.com",
            icon: {
              image_34:
                "https://via.placeholder.com/34x34/4A154B/FFFFFF?text=MS",
              image_44:
                "https://via.placeholder.com/44x44/4A154B/FFFFFF?text=MS",
              image_68:
                "https://via.placeholder.com/68x68/4A154B/FFFFFF?text=MS",
              image_88:
                "https://via.placeholder.com/88x88/4A154B/FFFFFF?text=MS",
              image_102:
                "https://via.placeholder.com/102x102/4A154B/FFFFFF?text=MS",
              image_132:
                "https://via.placeholder.com/132x132/4A154B/FFFFFF?text=MS",
              image_230:
                "https://via.placeholder.com/230x230/4A154B/FFFFFF?text=MS",
            },
          },
        };
      })
      // Step 8: Display success confirmation
      .display("showSuccess", {
        title: "✅ Slack Connected Successfully!",
        content: (input) =>
          `${input.formatTeamInfo.team.name} has been successfully connected.`,
        continueLabel: "Finish Setup",
      })
      // Step 9: Return the final connection configuration
      .returns((context) => ({
        accessToken: context.validateTokenResponse.accessToken,
        refreshToken: context.validateTokenResponse.refreshToken,
      }))
      .build()
  )
  .withRefresh(async (connection) => {
    return {
      refreshToken: connection.config.refreshToken,
      accessToken: connection.config.accessToken,
    };
  })
  .build();
