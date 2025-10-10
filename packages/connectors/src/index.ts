import { slack } from "./connectors/slack";
import { trello } from "./connectors/trello";

export { slack, trello };
export const connectors = [slack, trello];
