'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define local interfaces to avoid module export errors
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  status?: 'online' | 'offline';
  avatar?: string;
  lastActive?: string;
}

export interface ChallengeParticipant {
  userId: string;
  progress: number;
  joinedAt: Date;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  goal: number;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  participants: ChallengeParticipant[];
}

interface SocialChallengesViewProps {
  challenges: Challenge[];
  friends: Friend[];
  user: User;
  loading: boolean;
  onJoinChallenge: (challengeId: string) => Promise<void>;
  onLeaveChallenge: (challengeId: string) => Promise<void>;
  onCreateChallenge: (
    name: string,
    description: string,
    type: string,
    goal: number,
    startDate: Date,
    endDate: Date
  ) => Promise<void>;
  onUpdateProgress: (challengeId: string, progress: number) => Promise<void>;
}

export function SocialChallengesView({
  challenges = [],
  friends = [],
  user,
  loading = false,
  onJoinChallenge,
  onLeaveChallenge,
  onCreateChallenge,
  onUpdateProgress,
}: SocialChallengesViewProps) {
  // Provide default values to avoid null/undefined errors
  const safeUser = user || { id: "", name: "", email: "" };
  
  const [newChallenge, setNewChallenge] = useState({
    name: "",
    description: "",
    type: "steps",
    goal: 10000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [progressValue, setProgressValue] = useState<Record<string, number>>({});

  const handleCreateChallenge = async () => {
    try {
      // Validate all required fields
      if (!newChallenge.name.trim()) {
        throw new Error("Challenge name is required");
      }
      
      if (!newChallenge.description.trim()) {
        throw new Error("Challenge description is required");
      }
      
      if (!newChallenge.type) {
        throw new Error("Challenge type is required");
      }
      
      if (!newChallenge.goal || newChallenge.goal <= 0) {
        throw new Error("Challenge goal must be greater than zero");
      }
      
      const now = new Date();
      const startDate = new Date(newChallenge.startDate);
      const endDate = new Date(newChallenge.endDate);
      
      if (isNaN(startDate.getTime())) {
        throw new Error("Invalid start date");
      }
      
      if (isNaN(endDate.getTime())) {
        throw new Error("Invalid end date");
      }
      
      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
      
      // Call the provided onCreateChallenge function
      await onCreateChallenge(
        newChallenge.name,
        newChallenge.description,
        newChallenge.type,
        newChallenge.goal,
        newChallenge.startDate,
        newChallenge.endDate
      );
      
      // Reset state after successful creation
      setIsCreateDialogOpen(false);
      setNewChallenge({
        name: "",
        description: "",
        type: "steps",
        goal: 10000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch (error) {
      console.error("Error creating challenge:", error);
      if (error instanceof Error) {
        // In a real app, you would show this error to the user via a toast or alert
        console.error(error.message);
      }
    }
  };

  const handleUpdateProgress = async (challengeId: string) => {
    try {
      const progress = progressValue[challengeId] || 0;
      await onUpdateProgress(challengeId, progress);
      setProgressValue((prev) => ({
        ...prev,
        [challengeId]: 0,
      }));
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const formatDate = (date: Date) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  const isUserParticipant = (challenge: Challenge) => {
    if (!challenge?.participants?.length || !safeUser?.id) return false;
    return challenge.participants.some((p) => p.userId === safeUser.id);
  };

  const getUserProgress = (challenge: Challenge) => {
    if (!challenge?.participants?.length || !safeUser?.id) return 0;
    const userParticipant = challenge.participants.find((p) => p.userId === safeUser.id);
    return userParticipant ? userParticipant.progress : 0;
  };

  const getFriendName = (userId: string) => {
    if (!userId || !friends?.length) return "Unknown User";
    const friend = friends.find(f => f.id === userId);
    return friend ? friend.name : "Unknown User";
  };

  const renderChallenges = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!challenges?.length) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No challenges available</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Challenge</Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle>{challenge.name}</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm capitalize">{challenge.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Goal:</span>
                  <span className="text-sm">{challenge.goal} {challenge.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Period:</span>
                  <span className="text-sm">
                    {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Participants:</span>
                  <span className="text-sm">{challenge.participants?.length || 0}</span>
                </div>
                
                {isUserParticipant(challenge) && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Your Progress:</span>
                      <span className="text-sm">{getUserProgress(challenge)} / {challenge.goal}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${Math.min(100, (getUserProgress(challenge) / challenge.goal) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {challenge.participants?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Leaderboard:</h4>
                    <div className="space-y-2">
                      {[...challenge.participants]
                        .sort((a, b) => b.progress - a.progress)
                        .slice(0, 5)
                        .map((participant) => (
                          <div key={participant.userId} className="flex justify-between items-center">
                            <span className="text-sm">
                              {participant.userId === safeUser.id ? 'You' : getFriendName(participant.userId)}
                            </span>
                            <div className="flex items-center">
                              <span className="text-sm mr-2">{participant.progress}</span>
                              <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-primary h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(100, (participant.progress / challenge.goal) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              {isUserParticipant(challenge) ? (
                <>
                  <div className="flex-1 mr-2">
                    <Input
                      type="number"
                      placeholder="Update progress"
                      value={progressValue[challenge.id] || ''}
                      onChange={(e) => setProgressValue({
                        ...progressValue,
                        [challenge.id]: parseInt(e.target.value || '0')
                      })}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateProgress(challenge.id)}
                  >
                    Update
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="ml-2"
                    onClick={() => onLeaveChallenge(challenge.id)}
                  >
                    Leave
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => onJoinChallenge(challenge.id)}
                  className="w-full"
                >
                  Join Challenge
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Challenges</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create Challenge</Button>
      </div>

      {renderChallenges()}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Create a new challenge to compete with your friends.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="challenge-name" className="text-right">Name</Label>
              <Input
                id="challenge-name"
                value={newChallenge.name}
                onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="challenge-description" className="text-right">Description</Label>
              <Input
                id="challenge-description"
                value={newChallenge.description}
                onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="challenge-type" className="text-right">Type</Label>
              <Select
                value={newChallenge.type}
                onValueChange={(value) => setNewChallenge({ ...newChallenge, type: value })}
              >
                <SelectTrigger id="challenge-type" className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steps">Steps</SelectItem>
                  <SelectItem value="distance">Distance (km)</SelectItem>
                  <SelectItem value="calories">Calories</SelectItem>
                  <SelectItem value="workouts">Workouts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="challenge-goal" className="text-right">Goal</Label>
              <Input
                id="challenge-goal"
                type="number"
                value={newChallenge.goal}
                onChange={(e) => setNewChallenge({ ...newChallenge, goal: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="challenge-start-date" className="text-right">Start Date</Label>
              <Input
                id="challenge-start-date"
                type="date"
                value={newChallenge.startDate.toISOString().split('T')[0]}
                onChange={(e) => setNewChallenge({ 
                  ...newChallenge, 
                  startDate: new Date(e.target.value) 
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="challenge-end-date" className="text-right">End Date</Label>
              <Input
                id="challenge-end-date"
                type="date"
                value={newChallenge.endDate.toISOString().split('T')[0]}
                onChange={(e) => setNewChallenge({ 
                  ...newChallenge, 
                  endDate: new Date(e.target.value) 
                })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateChallenge}>Create Challenge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 