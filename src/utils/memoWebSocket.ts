// src/utils/memoWebSocket.ts
import websocketManager from './websocketManager';

const MEMO_WEBSOCKET_PATH = '/api/memos/ws';

/**
 * Initializes the WebSocket connection specifically for memo updates.
 * This should be called once, typically during application startup or when the first component
 * requiring memo updates is mounted.
 */
export const initializeMemoWebSocket = () => {
  websocketManager.initializeWebSocket(MEMO_WEBSOCKET_PATH);
};

/**
 * Subscribes a callback function to receive memo update messages from the WebSocket.
 * @param callback The function to call when a memo message is received.
 */
export const subscribeToMemoMessages = (callback: (data: any) => void) => {
  websocketManager.subscribeToMessages(callback);
};

/**
 * Unsubscribes a callback function from receiving memo update messages.
 * @param callback The function to remove.
 */
export const unsubscribeFromMemoMessages = (callback: (data: any) => void) => {
  websocketManager.unsubscribeFromMessages(callback);
};

/**
 * Sends a message related to memos over the WebSocket.
 * @param message The message to send.
 */
export const sendMemoMessage = (message: any) => {
  websocketManager.sendMessage(message);
};

// Note: Manual disconnection of the memo-specific WebSocket is not exposed here
// as the websocketManager is intended to manage a single, persistent connection.
// If a full disconnection of the shared connection is needed, the
// disconnectWebSocket function from websocketManager should be used elsewhere
// with caution, as it affects all subscribers.