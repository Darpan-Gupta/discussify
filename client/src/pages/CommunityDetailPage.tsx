import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { discussionsAPI, communitiesAPI, usersAPI } from '../services/api'
import JoinCommunityButton from '../components/JoinCommunityButton'
import { format } from 'date-fns'

const CommunityDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [community, setCommunity] = useState<any | null>(null)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [discussions, setDiscussions] = useState<any[]>([])
    const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showManageMembersModal, setShowManageMembersModal] = useState(false)
    const [showDeleteCommunityModal, setShowDeleteCommunityModal] = useState(false)
    const [showDeleteDiscussionModal, setShowDeleteDiscussionModal] = useState(false)
    const [showLeaveCommunityModal, setShowLeaveCommunityModal] = useState(false)
    const [editingDescription, setEditingDescription] = useState('')
    const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null)
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [newMemberId, setNewMemberId] = useState('')
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Handle invite token from URL
    const getInviteTokenFromURL = () => {
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get('token')
    }

    useEffect(() => {
        const fetchCommunity = async () => {
            if (!id) return
            setIsLoading(true)
            setError(null)
            try {
                const response = await communitiesAPI.getById(id)
                const comm = response.data
                setCommunity(comm)

                // Check if user is creator and community is private - fetch invite link
                if (user && comm.creator?._id === user._id && comm.isPrivate) {
                    try {
                        const inviteResponse = await communitiesAPI.getInviteLink(id)
                        setInviteLink(inviteResponse.data.inviteLink)
                    } catch (err) {
                        // Silently fail - invite link fetch is optional
                    }
                }

                // For private communities, members and creators can always access
                // Non-members need an invite token only to view/join, but once they're members, they don't need token
                if (comm.isPrivate) {
                    const isCreator = comm.creator?._id === user?.id
                    const isMember = user && comm.members?.some((m: any) => m._id === user._id || m === user._id)
                    const hasToken = getInviteTokenFromURL()
                    // console.log('Private community', comm, user, isCreator, isMember, hasToken)



                    // Only show error if user is not a member/creator AND doesn't have token
                    // Members don't need token to access
                    if (!isCreator && !isMember && !hasToken) {
                        setError('This is a private community. You need an invite link to join it.')
                    }
                }
            } catch (err: any) {
                const message = err.response?.data?.error || err.response?.data?.message || 'Error loading community'
                setError(message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCommunity()
    }, [id, user])

    useEffect(() => {
        const fetchDiscussions = async () => {
            if (!id) return
            setIsLoadingDiscussions(true)
            try {
                const response = await discussionsAPI.getAll({ communityId: id })
                setDiscussions(response.data.discussions || [])
            } catch (err: any) {
                console.error('Error loading discussions:', err)
            } finally {
                setIsLoadingDiscussions(false)
            }
        }

        const isCreator = user && community?.creator?._id === user._id
        const isMember = user && community?.members?.some((m: any) => (m._id || m) === user._id)
        // Members and creators can always access. Non-members need token only if private community
        const hasAccess = isCreator || isMember || !community?.isPrivate || (community?.isPrivate && getInviteTokenFromURL())

        if (community && hasAccess) {
            fetchDiscussions()
        }
    }, [id, community, user])


    const handleJoinSuccess = () => {
        // Refresh community data
        if (id) {
            setIsLoading(true)
            communitiesAPI.getById(id).then(response => {
                setCommunity(response.data)
                // Clear error if user successfully joined
                setError(null)
                setIsLoading(false)
            }).catch(() => {
                setIsLoading(false)
            })
        }
    }

    const handleLeaveCommunity = async () => {
        if (!id) return

        try {
            await communitiesAPI.leave(id)
            setSuccessMessage('You have left the community successfully!')
            setShowLeaveCommunityModal(false)
            // Refresh community data
            const response = await communitiesAPI.getById(id)
            setCommunity(response.data)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || err.response?.data?.message || 'Failed to leave community')
            setShowLeaveCommunityModal(false)
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    const copyInviteLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
        }
    }

    const handleEditDescription = async () => {
        if (!id || !editingDescription.trim()) {
            setErrorMessage('Description cannot be empty')
            return
        }

        try {
            await communitiesAPI.updateDescription(id, editingDescription.trim())
            setSuccessMessage('Description updated successfully!')
            setShowEditModal(false)
            // Refresh community data
            const response = await communitiesAPI.getById(id)
            setCommunity(response.data)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || err.response?.data?.message || 'Failed to update description')
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    const handleManageMember = async (action: 'add' | 'remove', userId: string) => {
        if (!id) return

        try {
            await communitiesAPI.manageMembers(id, action, userId)
            setSuccessMessage(`Member ${action === 'add' ? 'added' : 'removed'} successfully!`)
            // Refresh community data
            const response = await communitiesAPI.getById(id)
            setCommunity(response.data)
            setNewMemberId('')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || err.response?.data?.message || `Failed to ${action} member`)
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    const handleDeleteCommunity = async () => {
        if (!id) return

        try {
            await communitiesAPI.delete(id)
            setSuccessMessage('Community deleted successfully!')
            setTimeout(() => {
                navigate('/communities')
            }, 1000)
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || err.response?.data?.message || 'Failed to delete community')
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    const handleDeleteDiscussion = async () => {
        if (!selectedDiscussionId) return

        try {
            await discussionsAPI.delete(selectedDiscussionId)
            setSuccessMessage('Discussion deleted successfully!')
            setShowDeleteDiscussionModal(false)
            setSelectedDiscussionId(null)
            // Refresh discussions
            if (id) {
                const response = await discussionsAPI.getAll({ communityId: id })
                setDiscussions(response.data.discussions || [])
            }
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to delete discussion')
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    useEffect(() => {
        const fetchUsers = async () => {
            if (showManageMembersModal) {
                try {
                    const response = await usersAPI.getAll()
                    setAllUsers(response.data || [])
                } catch (err) {
                    console.error('Error fetching users:', err)
                }
            }
        }
        fetchUsers()
    }, [showManageMembersModal])

    if (isLoading && !community) {
        return (
            <div className="container">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !community) {
        return (
            <div className="container">
                <div className="alert alert-danger" role="alert">
                    {error || 'Community not found'}
                </div>
            </div>
        )
    }

    const isCreator = user && community.creator?._id === user._id
    const isMember = user && community.members?.some((m: any) => (m._id || m) === user._id)
    // Members and creators can always access. Non-members need token only if private community
    const hasAccess = isCreator || isMember || !community.isPrivate || (community.isPrivate && getInviteTokenFromURL())



    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col">
                    {/* Community Header */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <h1 className="mb-0">{community.name}</h1>
                                        {community.isPrivate && (
                                            <span className="badge bg-warning text-dark">Private</span>
                                        )}
                                    </div>
                                    <p className="text-muted">{community.description}</p>
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="badge bg-info">{community.members?.length || 0} members</span>
                                        <small className="text-muted">Created by {community.creator?.username || 'Unknown'}</small>
                                        <small className="text-muted">{new Date(community.createdAt).toLocaleDateString()}</small>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    {/* <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Back</button> */}
                                    {!isMember && !isCreator && (
                                        <JoinCommunityButton
                                            communityId={community._id || ''}
                                            inviteToken={getInviteTokenFromURL() || undefined}
                                            onJoin={handleJoinSuccess}
                                        />
                                    )}
                                    {isMember && !isCreator && (
                                        <button className="btn btn-outline-danger" onClick={() => setShowLeaveCommunityModal(true)}>
                                            Leave Community
                                        </button>
                                    )}
                                    {isCreator && (
                                        <>
                                            <button className="btn btn-success" disabled>Joined</button>
                                        </>
                                    )}
                                    {isCreator && (
                                        <>
                                            <button
                                                style={{ border: "none" }}

                                                className="btn btn-outline-primary"
                                                onClick={() => {
                                                    setEditingDescription(community.description)
                                                    setShowEditModal(true)
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                // style={{ border: "solid" }}
                                                className="btn btn-outline-info"
                                                onClick={() => setShowManageMembersModal(true)}
                                            >
                                                Manage Members
                                            </button>
                                            <button
                                                type='button'
                                                // style={{ border: "solid" }}
                                                className="btn btn-outline-danger"
                                                onClick={() => setShowDeleteCommunityModal(true)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Success/Error Messages */}
                            {successMessage && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    {successMessage}
                                    <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
                                </div>
                            )}
                            {errorMessage && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {errorMessage}
                                    <button type="button" className="btn-close" onClick={() => setErrorMessage(null)}></button>
                                </div>
                            )}

                            {/* Invite Link Management for Creators */}
                            {isCreator && community.isPrivate && inviteLink && (
                                <div className="mt-3 pt-3 border-top">
                                    <h6>Invite Link Management</h6>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={inviteLink}
                                            readOnly
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={copyInviteLink}
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                    <small className="text-muted d-block mt-2">
                                        Share this link with people you want to invite to your private community.
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>

                    {!hasAccess && (
                        <div className="alert alert-warning" role="alert">
                            <h5>Private Community</h5>
                            <p>This is a private community. You need an invite link to join and view its content.</p>
                            <p className="mb-0">If you have an invite link, please use it to join this community. Once you're a member, you can access it anytime without the invite link.</p>
                        </div>
                    )}

                    {hasAccess && (
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0">Community Discussions</h5>
                                    {user && (isCreator || isMember) && (
                                        <Link
                                            to={`/communities/${id}/create-discussion`}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Create Discussion
                                        </Link>
                                    )}
                                </div>

                                {isLoadingDiscussions ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : discussions.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted mb-3">No discussions yet.</p>
                                        {user && (isCreator || isMember) && (
                                            <Link
                                                to={`/communities/${id}/create-discussion`}
                                                className="btn btn-primary"
                                            >
                                                Start the first discussion
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="list-group">
                                        {discussions.map((discussion) => (
                                            <div key={discussion._id} className="list-group-item d-flex justify-content-between ">
                                                <Link
                                                    to={`/discussion/${discussion._id}`}
                                                    className="text-decoration-none text-dark flex-grow-1"
                                                >
                                                    <div className="d-flex w-100 justify-content-between">
                                                        <h6 className="mb-1">{discussion.title}</h6>
                                                        <small className="text-muted">
                                                            {format(new Date(discussion.createdAt), 'MMM d, yyyy')}
                                                        </small>
                                                    </div>
                                                    <p className="mb-1 text-muted">
                                                        {discussion.content.substring(0, 150)}
                                                        {discussion.content.length > 150 && '...'}
                                                    </p>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-info">{discussion.category}</span>
                                                        <small className="text-muted">
                                                            by {discussion.author?.username}
                                                        </small>
                                                        <small className="text-muted">
                                                            {discussion.comments?.length || 0} comments
                                                        </small>
                                                    </div>
                                                </Link>
                                                <div
                                                    className='d-flex justify-content-end align-items-center'
                                                >

                                                    {isCreator && (
                                                        <button
                                                            style={{ border: "solid", height: "35px" }}
                                                            className="btn btn-sm btn-outline-danger mt-2 "
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                setSelectedDiscussionId(discussion._id)
                                                                setShowDeleteDiscussionModal(true)
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Description Modal */}
            {showEditModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Community Description</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <textarea
                                        id="description"
                                        className="form-control"
                                        rows={5}
                                        value={editingDescription}
                                        onChange={(e) => setEditingDescription(e.target.value)}
                                        maxLength={500}
                                    />
                                    <small className="text-muted">{editingDescription.length}/500 characters</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleEditDescription}>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {showManageMembersModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Manage Members</h5>
                                <button type="button" className="btn-close" onClick={() => setShowManageMembersModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <h6>Current Members ({community.members?.length || 0})</h6>
                                <div className="list-group mb-4">
                                    {community.members?.map((member: any) => (
                                        <div key={member._id || member} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>{member.username || member}</span>
                                            {member._id !== community.creator?._id && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleManageMember('remove', member._id || member)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                            {member._id === community.creator?._id && (
                                                <span className="badge bg-primary">Creator</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <h6>Add New Member</h6>
                                <div className="input-group mb-3">
                                    <select
                                        className="form-select"
                                        value={newMemberId}
                                        onChange={(e) => setNewMemberId(e.target.value)}
                                    >
                                        <option value="">Select a user...</option>
                                        {allUsers
                                            .filter((u: any) => !community.members?.some((m: any) => (m._id || m) === (u._id || u)))
                                            .map((u: any) => (
                                                <option key={u._id || u} value={u._id || u}>
                                                    {u.username}
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        onClick={() => {
                                            if (newMemberId) {
                                                handleManageMember('add', newMemberId)
                                            }
                                        }}
                                        disabled={!newMemberId}
                                    >
                                        Add Member
                                    </button>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowManageMembersModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Community Confirmation Modal */}
            {showDeleteCommunityModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Community</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteCommunityModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this community? This action cannot be undone.</p>
                                <p className="text-danger"><strong>All discussions and content in this community will be lost.</strong></p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteCommunityModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleDeleteCommunity}>
                                    Delete Community
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Discussion Confirmation Modal */}
            {showDeleteDiscussionModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete Discussion</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteDiscussionModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this discussion? This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteDiscussionModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleDeleteDiscussion}>
                                    Delete Discussion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Community Confirmation Modal */}
            {showLeaveCommunityModal && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Leave Community</h5>
                                <button type="button" className="btn-close" onClick={() => setShowLeaveCommunityModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to leave this community? You will lose access to all discussions and content.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveCommunityModal(false)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleLeaveCommunity}>
                                    Leave Community
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CommunityDetailPage
