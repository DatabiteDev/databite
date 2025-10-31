import { z } from "zod";
import { createAction } from "@databite/build";
import { SlackConnectionConfigSchema } from "../schemas";

export const SendMessageInputSchema = z.object({
  channelId: z
    .string()
    .describe("Slack channel ID or user ID to send the message to"),
  text: z.string().describe("Message text to send"),
});

export const SendMessageOutputSchema = z.object({
  ok: z.boolean(),
  channel: z.string(),
  ts: z.string(),
  message: z.object({
    text: z.string(),
    user: z.string().optional(),
  }),
});

export const sendMessage = createAction<
  typeof SendMessageInputSchema,
  typeof SendMessageOutputSchema,
  typeof SlackConnectionConfigSchema
>({
  label: "Send Slack Message",
  description: "Send a message to a Slack channel or user",
  inputSchema: SendMessageInputSchema,
  outputSchema: SendMessageOutputSchema,
  maxRetries: 3,
  timeout: 30000,

  handler: async (params, connection) => {
    const { channelId, text } = params;
    const { accessToken } = connection.config;

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text,
      }),
    });

    const data = (await response.json()) as any;

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error ?? "Unknown error"}`);
    }

    return {
      ok: data.ok,
      channel: data.channel,
      ts: data.ts,
      message: {
        text: data.message?.text ?? "",
        user: data.message?.user,
      },
    };
  },
});
