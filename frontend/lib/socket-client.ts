'use client';

import { io, Socket } from 'socket.io-client';

// Socket event data types
export interface ChallengeJoinedData {
  userId: string;
  challengeId: string;
  name: string;
  avatar: string;
}

export interface ChallengeLeftData {
  userId: string;
  challengeId: string;
}

export interface ChallengeUpdatedData {
  userId: string;
  challengeId: string;
  progress: number;
}

export interface FriendRequestData {
  userId: string;
  targetEmail: string;
  name: string;
  avatar: string;
  email: string;
}

export interface FriendRequestAcceptedData {
  userId: string;
  targetId: string;
  name: string;
  avatar: string;
  email: string;
}

export interface FriendRequestRejectedData {
  userId: string;
  targetId: string;
}

// Declare the global window interface to add socketCallbacks
declare global {
  interface Window {
    socketCallbacks?: {
      [userId: string]: {
        [event: string]: (...args: any[]) => void;
      };
    };
  }
}

export class SocketClient {
  private static instance: SocketClient | null = null;
  private sockets: Map<string, Socket> = new Map();
  
  // Get singleton instance
  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }
  
  // Connect to socket
  public connectToSocket(userId: string): Socket {
    if (this.sockets.has(userId)) {
      return this.sockets.get(userId) as Socket;
    }
    
    let socket: Socket;
    
    // For development, create a mock socket
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      // Create a mock socket implementation
      const mockSocket = {
        on: (event: string, callback: (...args: any[]) => void) => {
          // Store the callback in a global registry
          if (typeof window !== 'undefined') {
            if (!window.socketCallbacks) {
              window.socketCallbacks = {};
            }
            if (!window.socketCallbacks[userId]) {
              window.socketCallbacks[userId] = {};
            }
            window.socketCallbacks[userId][event] = callback;
          }
          return mockSocket;
        },
        off: (event: string) => {
          if (typeof window !== 'undefined' && window.socketCallbacks?.[userId]?.[event]) {
            delete window.socketCallbacks[userId][event];
          }
          return mockSocket;
        },
        emit: (event: string, ...args: any[]) => {
          console.log(`[MOCK SOCKET] Emitting ${event}:`, ...args);
          return mockSocket;
        },
        disconnect: () => {
          this.sockets.delete(userId);
          if (typeof window !== 'undefined' && window.socketCallbacks?.[userId]) {
            delete window.socketCallbacks[userId];
          }
        },
        id: `mock-socket-${userId}`
      } as unknown as Socket;
      
      socket = mockSocket;
    } else {
      // Connect to real socket server in production
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      socket = io(socketUrl, {
        query: { userId },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      
      socket.on('connect', () => {
        console.log('Socket connected', socket.id);
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    
    this.sockets.set(userId, socket);
    return socket;
  }
  
  // Disconnect socket
  public disconnectSocket(): void {
    this.sockets.forEach((socket) => {
      socket.disconnect();
    });
    this.sockets.clear();
  }
  
  // Helper method to trigger mock events in development (for testing)
  public mockEmit(userId: string, event: string, data: any): void {
    if (process.env.NEXT_PUBLIC_DEBUG !== 'true' || typeof window === 'undefined') return;
    
    const callback = window.socketCallbacks?.[userId]?.[event];
    if (callback) {
      console.log(`[MOCK SOCKET] Received ${event}:`, data);
      callback(data);
    }
  }
  
  // Ensure socket is connected before using
  private ensureConnected(): Socket {
    if (this.sockets.size === 0) {
      throw new Error('No sockets connected. Call connectToSocket first.');
    }
    
    // Get the first socket if there's at least one
    const socket = Array.from(this.sockets.values())[0];
    if (!socket) {
      throw new Error('No active socket connection found');
    }
    
    return socket;
  }
  
  // Challenge Events
  
  // Emit challenge joined event
  public emitChallengeJoined(data: ChallengeJoinedData): void {
    const socket = this.ensureConnected();
    socket.emit('challengeJoined', data);
  }
  
  // Listen for challenge joined event
  public onChallengeJoined(callback: (data: ChallengeJoinedData) => void): void {
    const socket = this.ensureConnected();
    socket.on('challengeJoined', callback);
  }
  
  // Emit challenge left event
  public emitChallengeLeft(data: ChallengeLeftData): void {
    const socket = this.ensureConnected();
    socket.emit('challengeLeft', data);
  }
  
  // Listen for challenge left event
  public onChallengeLeft(callback: (data: ChallengeLeftData) => void): void {
    const socket = this.ensureConnected();
    socket.on('challengeLeft', callback);
  }
  
  // Emit challenge updated event
  public emitChallengeUpdated(data: ChallengeUpdatedData): void {
    const socket = this.ensureConnected();
    socket.emit('challengeUpdated', data);
  }
  
  // Listen for challenge updated event
  public onChallengeUpdated(callback: (data: ChallengeUpdatedData) => void): void {
    const socket = this.ensureConnected();
    socket.on('challengeUpdated', callback);
  }
  
  // Friend Events
  
  // Emit friend request event
  public emitFriendRequest(data: FriendRequestData): void {
    const socket = this.ensureConnected();
    socket.emit('friendRequest', data);
  }
  
  // Listen for friend request event
  public onFriendRequest(callback: (data: FriendRequestData) => void): void {
    const socket = this.ensureConnected();
    socket.on('friendRequest', callback);
  }
  
  // Emit friend request accepted event
  public emitFriendRequestAccepted(data: FriendRequestAcceptedData): void {
    const socket = this.ensureConnected();
    socket.emit('friendRequestAccepted', data);
  }
  
  // Listen for friend request accepted event
  public onFriendRequestAccepted(callback: (data: FriendRequestAcceptedData) => void): void {
    const socket = this.ensureConnected();
    socket.on('friendRequestAccepted', callback);
  }
  
  // Emit friend request rejected event
  public emitFriendRequestRejected(data: FriendRequestRejectedData): void {
    const socket = this.ensureConnected();
    socket.emit('friendRequestRejected', data);
  }
  
  // Listen for friend request rejected event
  public onFriendRequestRejected(callback: (data: FriendRequestRejectedData) => void): void {
    const socket = this.ensureConnected();
    socket.on('friendRequestRejected', callback);
  }
}

// Create singleton instance
const socketClient = new SocketClient();
export default socketClient; 