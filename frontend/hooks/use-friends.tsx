'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './use-user';
import { SocketClient } from '../lib/socket-client';

// Types
export interface Friend {
  id: string;
  name: string;
  status: 'online' | 'offline';
  avatar: string;
  lastActive: string;
  email: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  avatar: string;
  requestDate: string;
  email: string;
}

// Friend context type
interface FriendContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  friendSuggestions: Friend[];
  isLoading: boolean;
  sendFriendRequest: (email: string) => Promise<{ success: boolean, error: string | null }>;
  acceptFriendRequest: (id: string) => Promise<boolean>;
  rejectFriendRequest: (id: string) => Promise<boolean>;
  removeFriend: (id: string) => Promise<boolean>;
}

// Context with default values
const FriendsContext = createContext<FriendContextType>({
  friends: [],
  friendRequests: [],
  friendSuggestions: [],
  isLoading: true,
  sendFriendRequest: async () => ({ success: false, error: 'Not implemented' }),
  acceptFriendRequest: async () => false,
  rejectFriendRequest: async () => false,
  removeFriend: async () => false,
});

// Provider component
export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendSuggestions, setFriendSuggestions] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load friends data
  useEffect(() => {
    if (!isAuthenticated) {
      setFriends([]);
      setFriendRequests([]);
      setFriendSuggestions([]);
      setIsLoading(false);
      return;
    }

    const loadFriends = async () => {
      try {
        setIsLoading(true);
        
        // In a real app, fetch from API
        // const response = await fetch('/api/friends');
        // if (response.ok) {
        //   const data = await response.json();
        //   setFriends(data.friends);
        //   setFriendRequests(data.requests);
        //   setFriendSuggestions(data.suggestions);
        // }
        
        // Mock data for development
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock friends
        setFriends([
          {
            id: 'friend1',
            name: 'Jane Smith',
            status: 'online',
            avatar: '/placeholder.svg?height=40&width=40',
            lastActive: new Date().toISOString(),
            email: 'jane@example.com',
          },
          {
            id: 'friend2',
            name: 'John Doe',
            status: 'offline',
            avatar: '/placeholder.svg?height=40&width=40',
            lastActive: new Date(Date.now() - 3600000).toISOString(),
            email: 'john@example.com',
          },
          {
            id: 'friend3',
            name: 'Sarah Johnson',
            status: 'online',
            avatar: '/placeholder.svg?height=40&width=40',
            lastActive: new Date().toISOString(),
            email: 'sarah@example.com',
          },
        ]);
        
        // Mock friend requests
        setFriendRequests([
          {
            id: 'request1',
            name: 'Mike Williams',
            avatar: '/placeholder.svg?height=40&width=40',
            requestDate: new Date(Date.now() - 86400000).toISOString(),
            email: 'mike@example.com',
          },
        ]);
        
        // Mock friend suggestions
        setFriendSuggestions([
          {
            id: 'sugg1',
            name: 'Emma Brown',
            status: 'offline',
            avatar: '/placeholder.svg?height=40&width=40',
            lastActive: new Date(Date.now() - 7200000).toISOString(),
            email: 'emma@example.com',
          },
          {
            id: 'sugg2',
            name: 'David Wilson',
            status: 'online',
            avatar: '/placeholder.svg?height=40&width=40',
            lastActive: new Date().toISOString(),
            email: 'david@example.com',
          },
        ]);
      } catch (error) {
        console.error('Failed to load friends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFriends();
  }, [isAuthenticated]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
      // Connect to socket
      const socketClient = SocketClient.getInstance();
      socketClient.connectToSocket(user?.id || '');

      // Listen for friend request events
      socketClient.onFriendRequest((data) => {
        const newRequest: FriendRequest = {
          id: data.userId,
          name: data.name,
          avatar: data.avatar,
          requestDate: new Date().toISOString(),
          email: data.email,
        };
        setFriendRequests(prev => [newRequest, ...prev]);
      });

      // Listen for friend request accepted events
      socketClient.onFriendRequestAccepted((data) => {
        // Add to friends list
        const newFriend: Friend = {
          id: data.userId,
          name: data.name,
          status: 'online',
          avatar: data.avatar,
          lastActive: new Date().toISOString(),
          email: data.email,
        };
        setFriends(prev => [newFriend, ...prev]);
        
        // Remove from suggestions if present
        setFriendSuggestions(prev => 
          prev.filter(suggestion => suggestion.id !== data.userId)
        );
      });

      // Listen for friend request rejected events
      socketClient.onFriendRequestRejected((data) => {
        // Remove from requests
        setFriendRequests(prev => 
          prev.filter(request => request.id !== data.userId)
        );
      });

      // Clean up on unmount
      return () => {
        socketClient.disconnectSocket();
      };
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }, [isAuthenticated, user?.id]);

  // Send friend request
  const sendFriendRequest = async (email: string): Promise<{ success: boolean, error: string | null }> => {
    try {
      // In a real app, call API
      // const response = await fetch('/api/friends/request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      // if (!response.ok) {
      //   const error = await response.json();
      //   return { success: false, error: error.message };
      // }
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Check if already friends or request pending
      const isAlreadyFriend = friends.some(friend => friend.email === email);
      if (isAlreadyFriend) {
        return { success: false, error: 'Already friends with this user' };
      }
      
      const isPendingRequest = friendRequests.some(request => request.email === email);
      if (isPendingRequest) {
        return { success: false, error: 'Friend request already pending' };
      }
      
      // Find in suggestions and remove
      const suggestion = friendSuggestions.find(suggestion => suggestion.email === email);
      if (suggestion) {
        setFriendSuggestions(prev => 
          prev.filter(s => s.email !== email)
        );
        
        // Simulate sending to server and emit socket event
        try {
          const socketClient = SocketClient.getInstance();
          socketClient.emitFriendRequest({
            userId: user?.id || '',
            targetEmail: email,
            name: user?.name || '',
            avatar: user?.avatar || '',
            email: user?.email || '',
          });
        } catch (error) {
          console.error('Socket error:', error);
        }
        
        return { success: true, error: null };
      }
      
      // If email doesn't match any suggestion, simulate a "not found" error
      // This is just for the mock implementation
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send friend request' 
      };
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (id: string): Promise<boolean> => {
    try {
      // In a real app, call API
      // const response = await fetch(`/api/friends/request/${id}/accept`, {
      //   method: 'POST'
      // });
      // return response.ok;
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const requestToAccept = friendRequests.find(req => req.id === id);
      if (!requestToAccept) return false;
      
      // Add to friends list
      const newFriend: Friend = {
        id: requestToAccept.id,
        name: requestToAccept.name,
        status: 'online',
        avatar: requestToAccept.avatar,
        lastActive: new Date().toISOString(),
        email: requestToAccept.email,
      };
      
      setFriends(prev => [newFriend, ...prev]);
      
      // Remove from requests
      setFriendRequests(prev => 
        prev.filter(req => req.id !== id)
      );
      
      // Emit socket event
      try {
        const socketClient = SocketClient.getInstance();
        socketClient.emitFriendRequestAccepted({
          userId: user?.id || '',
          targetId: id,
          name: user?.name || '',
          avatar: user?.avatar || '',
          email: user?.email || '',
        });
      } catch (error) {
        console.error('Socket error:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (id: string): Promise<boolean> => {
    try {
      // In a real app, call API
      // const response = await fetch(`/api/friends/request/${id}/reject`, {
      //   method: 'POST'
      // });
      // return response.ok;
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from requests
      setFriendRequests(prev => 
        prev.filter(req => req.id !== id)
      );
      
      // Emit socket event
      try {
        const socketClient = SocketClient.getInstance();
        socketClient.emitFriendRequestRejected({
          userId: user?.id || '',
          targetId: id,
        });
      } catch (error) {
        console.error('Socket error:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      return false;
    }
  };

  // Remove friend
  const removeFriend = async (id: string): Promise<boolean> => {
    try {
      // In a real app, call API
      // const response = await fetch(`/api/friends/${id}`, {
      //   method: 'DELETE'
      // });
      // return response.ok;
      
      // Mock for development
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Remove from friends list
      setFriends(prev => 
        prev.filter(friend => friend.id !== id)
      );
      
      return true;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return false;
    }
  };

  return (
    <FriendsContext.Provider value={{
      friends,
      friendRequests,
      friendSuggestions,
      isLoading,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend
    }}>
      {children}
    </FriendsContext.Provider>
  );
}

// Hook to use the friends context
export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
} 