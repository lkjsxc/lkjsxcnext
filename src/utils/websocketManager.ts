// src/utils/websocketManager.ts

// This module manages a single WebSocket connection and provides subscription capabilities.

const RECONNECT_DELAY = 5000; // 5 seconds

class WebSocketManager {
  private websocket: WebSocket | null = null;
  private subscribers: Set<(data: any) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private getWebSocketUrl(path: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${path}`;
  }

  private connect(url: string) {
    if (this.websocket && (this.websocket.readyState === WebSocket.OPEN || this.websocket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting.');
      return;
    }

    console.log('Attempting to connect to WebSocket at:', url);

    this.websocket = new WebSocket(url);

    this.websocket.onopen = () => {
      console.log('WebSocket connected successfully');
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.websocket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data as string);
      this.subscribers.forEach(subscriber => subscriber(data));
    };

    this.websocket.onclose = (event) => {
      console.log(`WebSocket disconnected. Code: ${event.code}, Reason: '${event.reason}', WasClean: ${event.wasClean}`);
      this.websocket = null; // Clear the reference
      // Attempt to reconnect unless the close was intentional (e.g., code 1000) or due to an error that prevents reconnecting
      if (event.code !== 1000 && event.code !== 1001) { // 1000: Normal Closure, 1001: Going Away
         this.scheduleReconnect(url);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private scheduleReconnect(url: string) {
    if (this.reconnectTimeout) {
      return; // Already scheduled
    }
    console.log(`Scheduling WebSocket reconnect in ${RECONNECT_DELAY / 1000} seconds...`);
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect(url);
    }, RECONNECT_DELAY);
  }

  /**
   * Initializes and maintains the WebSocket connection.
   * @param path The path for the WebSocket endpoint (e.g., '/api/memos/ws').
   * @returns The WebSocket instance or null if already connected or connecting.
   */
  public initializeWebSocket(path: string): WebSocket | null {
      const url = this.getWebSocketUrl(path);
      this.connect(url);
      return this.websocket;
  }

  /**
   * Subscribes a callback function to receive messages from the WebSocket.
   * @param callback The function to call when a message is received.
   */
  public subscribeToMessages(callback: (data: any) => void) {
    this.subscribers.add(callback);
    console.log('Subscriber added. Total subscribers:', this.subscribers.size);
  }

  /**
   * Unsubscribes a callback function from receiving messages.
   * @param callback The function to remove.
   */
  public unsubscribeFromMessages(callback: (data: any) => void) {
    this.subscribers.delete(callback);
    console.log('Subscriber removed. Total subscribers:', this.subscribers.size);
  }

  /**
   * Sends a message over the WebSocket.
   * If the WebSocket is not open, the message will be logged but not sent.
   * @param message The message to send.
   */
  public sendMessage(message: any) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
      console.log('WebSocket message sent:', message);
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }

  /**
   * Disconnects the WebSocket connection.
   * This will prevent automatic re-connection.
   */
  public disconnectWebSocket() {
    if (this.websocket) {
      console.log('Manually disconnecting WebSocket.');
      this.websocket.close(1000, 'Manual disconnection'); // Use 1000 for normal closure
      this.websocket = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.subscribers.clear(); // Clear subscribers on manual disconnect
    console.log('All subscribers cleared.');
  }

  /**
   * Returns the current WebSocket instance.
   * Use with caution, as direct manipulation of the instance is generally discouraged.
   */
  public getWebSocketInstance(): WebSocket | null {
    return this.websocket;
  }
}

const websocketManager = new WebSocketManager();
export default websocketManager;