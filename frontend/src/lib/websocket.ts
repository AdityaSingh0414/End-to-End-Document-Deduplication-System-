type WebSocketCallback = (data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<WebSocketCallback>> = new Map();
  private reconnectInterval = 5000; // 5 seconds
  private maxReconnectAttempts = 10;
  private reconnectAttempts = 0;
  private isConnecting = false;

  constructor() {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_HOST || 'localhost:8000';
    this.url = `${wsProto}//${host}/ws`;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket Connection Established');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connection_status', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;
          if (type) {
            this.emit(type, data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket Connection Closed');
        this.isConnecting = false;
        this.emit('connection_status', { connected: false });
        this.attemptReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        this.ws?.close();
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting WebSocket in ${this.reconnectInterval / 1000}s... (Attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  public subscribe(type: string, callback: WebSocketCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(callback);

    // Return an unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  private emit(type: string, data: any): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in WebSocket callback for event ${type}:`, err);
        }
      });
    }
  }

  public send(type: string, data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('Cannot send WebSocket message: Socket not open');
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on deliberate disconnect
      this.ws.close();
      this.ws = null;
      console.log('WebSocket disconnected manually.');
    }
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
