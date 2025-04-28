// src/utils/memoWebSocket.ts

// Function to establish a WebSocket connection for memo updates
export const connectMemoWebSocket = (onMessage: (data: any) => void, onError: (error: any) => void): WebSocket | null => {
  // Determine the WebSocket URL based on the current location
  // Use ws:// for http and wss:// for https
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/api/memos/ws`;

  try {
    console.log('Attempting to connect to Memo WebSocket at:', url);

    // Use the native browser WebSocket API
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('Memo WebSocket connected successfully');
    };

    ws.onmessage = (event) => {
      console.log('Memo WebSocket message received:', event.data);
      // Assuming the message data is a string and needs parsing
      try {
        const data = JSON.parse(event.data as string);
        onMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
        onError(e);
      }
    };

    ws.onclose = (event) => {
      console.log(`Memo WebSocket disconnected. Code: ${event.code}, Reason: '${event.reason}', WasClean: ${event.wasClean}`);
      console.log('CloseEvent object:', event); // ★Added
    };

    ws.onerror = (error) => {
      console.error('Memo WebSocket error:', error);
      onError(error);
    };

    return ws;
  } catch (error) {
    console.error('Failed to connect to Memo WebSocket:', error);
    onError(error); // Pass the error to the handler
    return null;
  }
};

// Function to disconnect the WebSocket when needed
export const disconnectMemoWebSocket = (ws: WebSocket | null) => {
  if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
    ws.close();
    console.log('Memo WebSocket disconnected manually.');
  }
};

// Function to send a message over the WebSocket
export const sendMemoWebSocketMessage = (ws: WebSocket | null, message: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
      console.log('Memo WebSocket message sent:', message);
    } catch (e) {
      console.error('Failed to send WebSocket message:', e);
    }
  } else {
    console.warn('WebSocket is not connected. Cannot send message.');
  }
};