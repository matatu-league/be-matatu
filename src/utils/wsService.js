// wsService.js
export class WebSocketService {
  constructor() {
    this.clients = new Map(); // key: userId, value: ws connection
  }

  registerUser(userId, ws) {
    this.clients.set(userId, ws);
  }

  unregisterUser(userId) {
    this.clients.delete(userId);
  }

  sendToUser(userId, message) {
    const client = this.clients.get(userId);
    if (client && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }
}

export const wsService = new WebSocketService();
