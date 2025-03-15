// Websocket service with reconnection logic
class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private messageHandlers: ((event: MessageEvent) => void)[] = [];
  private walletHandlers: ((data: { wallet: string, balance: number }) => void)[] = [];
  private withdrawalHandlers: ((data: { type: string, userId: string, amount: number, status: string }) => void)[] = [];
  private spreadHandlers: ((data: { id: string, buyPrice: string, sellPrice: string }) => void)[] = [];
  private openHandlers: (() => void)[] = [];
  private errorHandlers: ((error: Event) => void)[] = [];
  private closeHandlers: ((event: CloseEvent) => void)[] = [];
  
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
      this.openHandlers.forEach(handler => handler());
    };
    
    this.socket.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
      this.socket = null;
      this.closeHandlers.forEach(handler => handler(event));
      this.attemptReconnect();
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.errorHandlers.forEach(handler => handler(error));
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
        
        // Check if this is a points update from our custom server
        if (data.wallet && data.points !== undefined) {
          this.walletHandlers.forEach(handler => handler({
            wallet: data.wallet,
            balance: data.points
          }));
          return;
        }
        
        // Check if this is a withdrawal notification
        if (data.type === 'withdrawal_update' && data.userId && data.amount !== undefined && data.status) {
          this.withdrawalHandlers.forEach(handler => handler({
            type: data.type,
            userId: data.userId,
            amount: data.amount,
            status: data.status
          }));
          return;
        }
        
        // Check if this is a spread update
        if (data.type === 'spread_update' && data.id && data.buyPrice && data.sellPrice) {
          this.spreadHandlers.forEach(handler => handler({
            id: data.id,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice
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
  
  addWithdrawalHandler(handler: (data: { type: string, userId: string, amount: number, status: string }) => void) {
    this.withdrawalHandlers.push(handler);
  }
  
  removeWithdrawalHandler(handler: (data: { type: string, userId: string, amount: number, status: string }) => void) {
    this.withdrawalHandlers = this.withdrawalHandlers.filter(h => h !== handler);
  }
  
  addSpreadHandler(handler: (data: { id: string, buyPrice: string, sellPrice: string }) => void) {
    this.spreadHandlers.push(handler);
  }
  
  removeSpreadHandler(handler: (data: { id: string, buyPrice: string, sellPrice: string }) => void) {
    this.spreadHandlers = this.spreadHandlers.filter(h => h !== handler);
  }
  
  addOpenHandler(handler: () => void) {
    this.openHandlers.push(handler);
  }
  
  removeOpenHandler(handler: () => void) {
    this.openHandlers = this.openHandlers.filter(h => h !== handler);
  }
  
  addErrorHandler(handler: (error: Event) => void) {
    this.errorHandlers.push(handler);
  }
  
  removeErrorHandler(handler: (error: Event) => void) {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }
  
  addCloseHandler(handler: (event: CloseEvent) => void) {
    this.closeHandlers.push(handler);
  }
  
  removeCloseHandler(handler: (event: CloseEvent) => void) {
    this.closeHandlers = this.closeHandlers.filter(h => h !== handler);
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

  simulateBalanceUpdate(wallet: string, newBalance: number) {
    console.log(`Simulating balance update for wallet ${wallet}: ${newBalance}`);
    this.walletHandlers.forEach(handler => handler({
      wallet,
      balance: newBalance
    }));
  }

  simulateSpreadUpdate(id: string, buyPrice: string, sellPrice: string) {
    console.log(`Simulating spread update for market ID ${id}: buy=${buyPrice}, sell=${sellPrice}`);
    this.spreadHandlers.forEach(handler => handler({
      id,
      buyPrice,
      sellPrice
    }));
  }

  simulateWithdrawalNotification(userId: string, amount: number, status: 'approved' | 'rejected') {
    console.log(`Simulating withdrawal ${status} notification for wallet ${userId}: ${amount}`);
    this.withdrawalHandlers.forEach(handler => handler({
      type: 'withdrawal_update',
      userId,
      amount,
      status
    }));
  }
  
  simulateBatchUpdate(updates: { id: number, sellPrice: string, buyPrice: string }[]) {
    console.log(`Simulating batch update for ${updates.length} markets`);
    const event = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'market_updates',
        updates
      })
    });
    this.messageHandlers.forEach(handler => handler(event));
  }
}

export default WebSocketService;
