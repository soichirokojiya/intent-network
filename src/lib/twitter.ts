import { TwitterApi } from "twitter-api-v2";

// Agent-level Twitter credentials stored in localStorage (client) or DB (future)
export interface TwitterCredentials {
  agentId: string;
  accessToken: string;
  accessSecret: string;
  username: string;
}

// App-level client (for search etc)
export function getAppClient() {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
  });
}

// Agent-level client (for posting as that agent's account)
export function getAgentClient(creds: TwitterCredentials) {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: creds.accessToken,
    accessSecret: creds.accessSecret,
  });
}
