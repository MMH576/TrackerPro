"use client"

import { SocialView } from "@/components/social-view"
import { useFriends } from "@/hooks/use-friends"
import { useChallenges } from "@/hooks/use-challenges"
import { useToast } from "@/hooks/use-toast"

export default function SocialPage() {
  const { friends } = useFriends()
  const { challenges, joinChallenge, leaveChallenge, createChallenge } = useChallenges()
  const { toast } = useToast()

  const handleJoinChallenge = (challengeId: string) => {
    joinChallenge(challengeId)
    toast({
      title: "Challenge joined!",
      description: "You've successfully joined the challenge.",
      duration: 3000,
    })
  }

  const handleLeaveChallenge = (challengeId: string) => {
    leaveChallenge(challengeId)
    toast({
      title: "Challenge left",
      description: "You've left the challenge.",
      duration: 3000,
    })
  }

  const handleCreateChallenge = (challengeData: any) => {
    createChallenge(challengeData)
    toast({
      title: "Challenge created!",
      description: "Your new challenge has been created.",
      duration: 3000,
    })
  }

  return (
    <SocialView
      friends={friends}
      challenges={challenges}
      onJoinChallenge={handleJoinChallenge}
      onLeaveChallenge={handleLeaveChallenge}
      onCreateChallenge={handleCreateChallenge}
    />
  )
}

