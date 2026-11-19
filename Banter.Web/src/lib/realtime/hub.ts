import { HubConnectionBuilder, LogLevel, type IRetryPolicy } from '@microsoft/signalr';

export const HUB_URL = '/hubs/chat';
export const HEARTBEAT_INTERVAL_MS = 25_000;
export const HEARTBEAT_METHOD = 'Heartbeat';

const RETRY_DELAYS_MS = [0, 1000, 3000, 6000, 12_000, 20_000];

export function nextRetryDelay(previousRetryCount: number): number | null {
  if (previousRetryCount >= 6) return null;
  return RETRY_DELAYS_MS[previousRetryCount] ?? 20_000;
}

export const reconnectPolicy: IRetryPolicy = {
  nextRetryDelayInMilliseconds(context) {
    return nextRetryDelay(context.previousRetryCount);
  },
};

export function createChatHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, { withCredentials: true })
    .withAutomaticReconnect(reconnectPolicy)
    .configureLogging(LogLevel.Warning)
    .build();
}
