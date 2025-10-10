import { createConnector } from "@databite/build";
import { createFlow } from "@databite/flow";
import { z } from "zod";

const TrelloIntegrationConfigSchema = z.object({});

const TrelloConnectionConfigSchema = z.object({
  apiKey: z.string(),
});

export const trello = createConnector<
  typeof TrelloIntegrationConfigSchema,
  typeof TrelloConnectionConfigSchema
>()
  .withIdentity("trello", "Trello")
  .withVersion("1.0.0")
  .withAuthor("Databite Team")
  .withLogo("https://www.vectorlogo.zone/logos/trello/trello-icon.svg")
  .withDocumentationUrl("https://api.trello.com")
  .withDescription("Trello connector for project management and collaboration")
  .withIntegrationConfig(TrelloIntegrationConfigSchema)
  .withConnectionConfig(TrelloConnectionConfigSchema)
  .withCategories("productivity")
  .withTags("project", "management", "collaboration")
  .withAuthenticationFlow(
    createFlow<typeof TrelloConnectionConfigSchema>("trelloAuth").build()
  )
  .withRefresh(async (connection) => {
    return {
      apiKey: connection.config.apiKey,
    };
  })
  .build();
