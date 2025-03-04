// Websocket service with reconnection logic
class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private messageHandlers: ((event: MessageEvent) => void)[] = [];
  private walletHandlers: ((data: { wallet: string, balance: number }) => void)[] = [];
  
  constructor(url: string) {
    this.url = url;
  }
  
  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    console.log(`Connecting to WebSocket: ${this.url}`);
    this.socket = new WebSocket(this.url);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectTimeout = 1000; // Reset timeout
    };
    
    this.socket.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
      this.socket = null;
      this.attemptReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Check if this is a wallet balance update
        if (data.type === 'wallet_update' && data.wallet && data.balance !== undefined) {
          this.walletHandlers.forEach(handler => handler({
            wallet: data.wallet,
            balance: data.balance
          }));
          return;
        }
        
        // Otherwise, treat as regular market update
        this.messageHandlers.forEach(handler => handler(event));
      } catch (error) {
        // If can't parse as JSON, pass the raw event to message handlers
        this.messageHandlers.forEach(handler => handler(event));
      }
    };
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const timeout = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1); // Exponential backoff
    console.log(`Attempting to reconnect in ${timeout}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, timeout);
  }
  
  addMessageHandler(handler: (event: MessageEvent) => void) {
    this.messageHandlers.push(handler);
  }
  
  removeMessageHandler(handler: (event: MessageEvent) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }
  
  addWalletHandler(handler: (data: { wallet: string, balance: number }) => void) {
    this.walletHandlers.push(handler);
  }
  
  removeWalletHandler(handler: (data: { wallet: string, balance: number }) => void) {
    this.walletHandlers = this.walletHandlers.filter(h => h !== handler);
  }
  
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error('Cannot send message, socket is not open');
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default WebSocketService;
