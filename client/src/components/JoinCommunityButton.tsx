import React, { useState } from 'react'
import { communitiesAPI } from '../services/api'

interface JoinCommunityButtonProps {
    communityId: string
    isJoined?: boolean
    inviteToken?: string
    onJoin?: () => void
}

const JoinCommunityButton: React.FC<JoinCommunityButtonProps> = ({
    communityId,
    isJoined = false,
    inviteToken,
    onJoin,
}) => {
    const [isLoading, setIsLoading] = useState(false)

    const handleJoin = async () => {
        setIsLoading(true)
        try {
            await communitiesAPI.join(communityId, inviteToken)
            window.alert('Joined community successfully!')
            if (onJoin) {
                onJoin()
            }
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to join community'
            window.alert(message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isJoined) {
        return (
            <button className="btn btn-success" disabled>
                Joined
            </button>
        )
    }

    return (
        <button
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Joining...
                </>
            ) : (
                'Join Community'
            )}
        </button>
    )
}

export default JoinCommunityButton
