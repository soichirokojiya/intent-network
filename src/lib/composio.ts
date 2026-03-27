import { Composio, ComposioToolSet } from "composio-core";
import Anthropic from "@anthropic-ai/sdk";

// Singleton Composio client
let composioClient: Composio | null = null;
let composioToolSet: ComposioToolSet | null = null;

export function getComposioClient(): Composio {
  if (!composioClient) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) throw new Error("COMPOSIO_API_KEY not set");
    composioClient = new Composio({ apiKey });
  }
  return composioClient;
}

export function getComposioToolSet(entityId?: string): ComposioToolSet {
  if (!composioToolSet) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) throw new Error("COMPOSIO_API_KEY not set");
    composioToolSet = new ComposioToolSet({ apiKey, entityId: entityId || "default" });
  }
  return composioToolSet;
}

/**
 * Map musu deviceId to Composio entityId
 * Composio uses entityId to track per-user connections
 */
export function toEntityId(deviceId: string): string {
  return `musu_${deviceId}`;
}

/**
 * Get Composio Entity for a musu user
 */
export function getEntity(deviceId: string) {
  const client = getComposioClient();
  return client.getEntity(toEntityId(deviceId));
}

/**
 * Check which Composio apps are connected for a user
 */
export async function getConnectedApps(deviceId: string): Promise<string[]> {
  try {
    const entity = getEntity(deviceId);
    const connections = await entity.getConnections();
    return connections
      .filter(c => c.status === "ACTIVE")
      .map(c => c.appName)
      .filter((v, i, a) => a.indexOf(v) === i); // unique
  } catch {
    return [];
  }
}

/**
 * Initiate OAuth connection for a Composio app
 * Returns the redirect URL for the user to authorize
 */
export async function initiateConnection(
  deviceId: string,
  appName: string,
  redirectUrl?: string
): Promise<{ redirectUrl: string; connectionId: string }> {
  const entity = getEntity(deviceId);
  const connection = await entity.initiateConnection({
    appName,
    redirectUri: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://musu.world"}/api/composio/callback`,
  });
  return {
    redirectUrl: connection.redirectUrl || "",
    connectionId: connection.connectedAccountId || "",
  };
}

/**
 * Get Composio tools as Claude-compatible tool definitions
 * Fetches raw schemas from Composio and converts to Anthropic tool format
 */
export async function getComposioToolsForClaude(
  deviceId: string,
  apps?: string[]
): Promise<Anthropic.Messages.Tool[]> {
  try {
    const toolSet = getComposioToolSet(toEntityId(deviceId));
    const filters: { apps?: string[]; tags?: string[] } = {};
    if (apps && apps.length > 0) {
      filters.apps = apps;
    }
    const rawTools = await toolSet.getToolsSchema(filters, toEntityId(deviceId));

    return rawTools.map(tool => ({
      name: tool.name,
      description: tool.description || tool.display_name || tool.name,
      input_schema: {
        type: "object" as const,
        properties: tool.parameters?.properties || {},
        required: tool.parameters?.required || [],
      },
    }));
  } catch (err) {
    console.error("[composio] Failed to get tools:", err);
    return [];
  }
}

/**
 * Execute a Composio action
 */
export async function executeComposioAction(
  deviceId: string,
  actionName: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const toolSet = getComposioToolSet(toEntityId(deviceId));
    const result = await toolSet.executeAction({
      action: actionName,
      params,
      entityId: toEntityId(deviceId),
    });
    return result as Record<string, unknown>;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Composio app name mapping (musu service name → Composio app key)
 */
export const COMPOSIO_APP_MAP: Record<string, string> = {
  gmail: "GMAIL",
  google_calendar: "GOOGLECALENDAR",
  google_sheets: "GOOGLESHEETS",
  google_drive: "GOOGLEDRIVE",
  trello: "TRELLO",
  notion: "NOTION",
  slack: "SLACK",
  twitter: "TWITTER",
  line: "LINE",
  chatwork: "CHATWORK",
  meta: "FACEBOOK",
  instagram: "INSTAGRAM",
  youtube: "YOUTUBE",
  square: "SQUARE",
};

// Reverse map: Composio app key → musu service name
export const COMPOSIO_APP_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COMPOSIO_APP_MAP).map(([k, v]) => [v, k])
);
