'use client';

import { useState, useEffect } from 'react';

// Temporary friend type
type Friend = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastActive?: string;
};

// Temporary friend request type
type FriendRequest = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

// Mock friends for development
const MOCK_FRIENDS: Friend[] = [
  {
    id: 'friend-1',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    status: 'online',
    lastActive: new Date().toISOString()
  },
  {
    id: 'friend-2',
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: 'offline',
    lastActive: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
  }
];

// Mock friend requests for development
const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    status: 'pending',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString() // 1 day ago
  }
];

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API fetch in development mode
    const loadFriends = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setFriends(MOCK_FRIENDS);
        setFriendRequests(MOCK_FRIEND_REQUESTS);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load friends'));
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  const sendFriendRequest = async (email: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Here we would normally make an API call to send the request
      console.log(`Friend request sent to ${email}`);
      
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send friend request');
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (id: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the request
      const request = friendRequests.find(req => req.id === id);
      if (!request) {
        throw new Error('Friend request not found');
      }
      
      // Update the request status
      const updatedRequests = friendRequests.filter(req => req.id !== id);
      setFriendRequests(updatedRequests);
      
      // Add the friend to the friends list
      const newFriend: Friend = {
        id: `friend-${Date.now()}`,
        name: request.name,
        email: request.email,
        status: 'offline',
        lastActive: new Date().toISOString()
      };
      
      setFriends([...friends, newFriend]);
      
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to accept friend request');
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async (id: string) => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the request status
      const updatedRequests = friendRequests.filter(req => req.id !== id);
      setFriendRequests(updatedRequests);
      
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reject friend request');
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    friends,
    friendRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
  };
} 