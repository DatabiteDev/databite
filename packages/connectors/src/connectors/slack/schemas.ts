import { z } from "zod";

export const SlackIntegrationConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string(),
  scopes: z.array(z.string()),
});

export const SlackConnectionConfigSchema = z.object({
  workspace: z.string(),
  userId: z.string(),
  accessToken: z.string(),
  teamId: z.string(),
  teamName: z.string(),
});
