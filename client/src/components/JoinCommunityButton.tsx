import React, { useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { communitiesAPI } from '../services/api'
import toast from 'react-hot-toast'

interface JoinCommunityButtonProps {
    communityId: string
    isJoined?: boolean
    onJoin?: () => void
}

const JoinCommunityButton: React.FC<JoinCommunityButtonProps> = ({
    communityId,
    isJoined = false,
    onJoin,
}) => {
    const [isLoading, setIsLoading] = useState(false)

    const handleJoin = async () => {
        setIsLoading(true)
        try {
            await communitiesAPI.join(communityId)
            toast.success('Joined community successfully!')
            if (onJoin) {
                onJoin()
            }
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to join community'
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    if (isJoined) {
        return (
            <Button variant="success" disabled>
                Joined
            </Button>
        )
    }

    return (
        <Button
            variant="primary"
            onClick={handleJoin}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Joining...
                </>
            ) : (
                'Join Community'
            )}
        </Button>
    )
}

export default JoinCommunityButton
