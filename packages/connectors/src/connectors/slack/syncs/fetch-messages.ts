import { z } from "zod";
import { createSync } from "@databite/build";
import { SlackConnectionConfigSchema } from "../schemas";

export const FetchMessagesOutputSchema = z.object({
  ok: z.boolean(),
  channels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isMember: z.boolean(),
      latestTs: z.string().optional(),
      messages: z.array(
        z.object({
          ts: z.string(),
          text: z.string(),
          user: z.string().optional(),
        })
      ),
    })
  ),
});

export const fetchMessages = createSync<
  typeof FetchMessagesOutputSchema,
  typeof SlackConnectionConfigSchema
>({
  label: "Fetch Messages",
  description: "Fetch recent messages from all Slack channels in a workspace",
  outputSchema: FetchMessagesOutputSchema,
  maxRetries: 3,
  timeout: 60000,

  handler: async (connection) => {
    const { accessToken } = connection.config;

    // Get last sync result from metadata
    const lastResult = connection.metadata?.syncs?.["Fetch Messages"]
      ?.lastResult as
      | {
          channels?: { id: string; latestTs?: string }[];
        }
      | undefined;

    // Create a map of channel IDs to their last message timestamp
    const lastMessageMap = new Map<string, string>();
    if (lastResult?.channels) {
      lastResult.channels.forEach((ch) => {
        if (ch.latestTs) {
          lastMessageMap.set(ch.id, ch.latestTs);
        }
      });
    }

    // Step 1: Get list of channels with pagination
    let allChannels: { id: string; name: string; is_member: boolean }[] = [];
    let cursor: string | undefined;

    do {
      const channelsUrl = new URL("https://slack.com/api/conversations.list");
      channelsUrl.searchParams.set("limit", "100");
      if (cursor) {
        channelsUrl.searchParams.set("cursor", cursor);
      }

      const channelsResponse = await fetch(channelsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const channelsData = (await channelsResponse.json()) as {
        ok: boolean;
        channels?: { id: string; name: string; is_member: boolean }[];
        response_metadata?: { next_cursor?: string };
        error?: string;
      };

      if (!channelsData.ok || !channelsData.channels) {
        throw new Error(
          `Slack API error while fetching channels: ${
            channelsData.error ?? "Unknown error"
          }`
        );
      }

      allChannels = allChannels.concat(channelsData.channels);
      cursor = channelsData.response_metadata?.next_cursor;
    } while (cursor);

    // Step 2: For each channel, fetch new messages with pagination
    const channelsWithMessages = await Promise.all(
      allChannels.map(async (channel) => {
        const allMessages: { ts: string; text: string; user?: string }[] = [];
        let messageCursor: string | undefined;
        let shouldContinue = true;
        const lastTs = lastMessageMap.get(channel.id);

        do {
          const historyUrl = new URL(
            "https://slack.com/api/conversations.history"
          );
          historyUrl.searchParams.set("channel", channel.id);
          historyUrl.searchParams.set("limit", "100");

          // Only fetch messages newer than the last sync
          if (lastTs) {
            historyUrl.searchParams.set("oldest", lastTs);
            // Set inclusive to false to exclude the message with lastTs
            historyUrl.searchParams.set("inclusive", "false");
          }

          if (messageCursor) {
            historyUrl.searchParams.set("cursor", messageCursor);
          }

          const messagesResponse = await fetch(historyUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const messagesData = (await messagesResponse.json()) as {
            ok: boolean;
            messages?: { ts: string; text: string; user?: string }[];
            has_more?: boolean;
            response_metadata?: { next_cursor?: string };
            error?: string;
          };

          if (!messagesData.ok) {
            // If channel access fails, return empty messages
            shouldContinue = false;
            break;
          }

          const messages = messagesData.messages ?? [];
          allMessages.push(...messages);

          messageCursor = messagesData.response_metadata?.next_cursor;
          shouldContinue = messagesData.has_more === true && !!messageCursor;
        } while (shouldContinue);

        return {
          id: channel.id,
          name: channel.name,
          isMember: channel.is_member,
          latestTs: allMessages.length > 0 ? allMessages[0].ts : lastTs,
          messages: allMessages,
        };
      })
    );

    return {
      ok: true,
      channels: channelsWithMessages,
    };
  },
});
