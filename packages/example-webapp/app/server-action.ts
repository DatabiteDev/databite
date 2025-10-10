"use server";

import { connectors } from "@databite/connectors";
import { createFlow } from "@databite/flow";

export async function getConnectors() {
  console.log(connectors);
  return connectors.map((connector) => ({
    id: connector.id,
    name: connector.name,
    logo: connector.logo,
  }));
}
