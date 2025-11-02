import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { discussionsAPI, resourcesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

const DiscussionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { refreshNotifications } = useNotifications()
    const [comment, setComment] = useState('')
    const [showResourceForm, setShowResourceForm] = useState(false)
    const [resourceForm, setResourceForm] = useState({
        title: '',
        type: 'link',
        link: '',
        description: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmittingResource, setIsSubmittingResource] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [discussionData, setDiscussionData] = useState<any | null>(null)
    const [resources, setResources] = useState<any[]>([])
    const commentsEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        let isMounted = true
        const fetchDiscussion = async () => {
            if (!id) return
            try {
                setIsLoading(true)
                setError(null)
                const res = await discussionsAPI.getById(id)
                if (isMounted) {
                    setDiscussionData(res.data)
                    // Scroll to bottom after data loads
                    setTimeout(() => scrollToBottom(), 100)
                }
            } catch (e) {
                if (isMounted) setError('Error loading discussion. Please try again later.')
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }
        fetchDiscussion()
        return () => { isMounted = false }
    }, [id])

    useEffect(() => {
        const fetchResources = async () => {
            if (!id) return
            try {
                const res = await resourcesAPI.getAll({ discussionId: id })
                setResources(res.data.resources || [])
            } catch (err) {
                console.error('Error loading resources:', err)
            }
        }
        if (discussionData) {
            fetchResources()
        }
    }, [id, discussionData])

    // Scroll to bottom when comments or resources change
    useEffect(() => {
        if (discussionData?.comments || resources.length > 0) {
            setTimeout(() => scrollToBottom(), 100)
        }
    }, [discussionData?.comments, resources])

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id || !comment.trim()) return
        try {
            setIsLoading(true)
            await discussionsAPI.participate(id, comment.trim())
            setComment('')
            // Refresh
            const res = await discussionsAPI.getById(id)
            setDiscussionData(res.data)
            // Scroll to bottom after adding comment
            setTimeout(() => scrollToBottom(), 100)
            refreshNotifications()

        } catch (err: any) {
            window.alert(err.response?.data?.message || 'Failed to add comment')
        } finally {
            setIsLoading(false)
        }
    }

    const handleShareResource = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id || !resourceForm.title.trim() || !resourceForm.link.trim()) return

        try {
            setIsSubmittingResource(true)
            await resourcesAPI.create({
                ...resourceForm,
                discussionId: id,
                communityId: discussionData?.community?._id || discussionData?.community,
            })
            window.alert('Resource shared successfully!')
            setResourceForm({ title: '', type: 'link', link: '', description: '' })
            setShowResourceForm(false)

            // Refresh resources
            const res = await resourcesAPI.getAll({ discussionId: id })
            setResources(res.data.resources || [])

            // Refresh notifications for community members
            refreshNotifications()
        } catch (err: any) {
            window.alert(err.response?.data?.message || err.response?.data?.error || 'Failed to share resource')
        } finally {
            setIsSubmittingResource(false)
        }
    }

    if (isLoading && !discussionData) {
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

    if (error) {
        return (
            <div className="container">
                <div className="alert alert-danger" role="alert">{error}</div>
            </div>
        )
    }

    if (!discussionData) {
        return (
            <div className="container">
                <div className="alert alert-warning" role="alert">Discussion not found.</div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
            <div className="container" style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Discussion Header */}
                <div className="card mb-1" style={{}}>
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start ">
                            <div style={{ flex: 1 }}>
                                <h1 style={{ textAlign: 'left', fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem' }}>{discussionData.title}</h1>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <span className="badge bg-info category-badge">
                                        {discussionData.category}
                                    </span>
                                    <small className="text-muted">
                                        by {discussionData.author?.username}
                                    </small>
                                    <small className="text-muted">
                                        {format(new Date(discussionData.createdAt), 'MMM d, yyyy')}
                                    </small>
                                </div>
                            </div>
                            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Back</button>
                        </div>

                        {/* <div className="discussion-content" style={{ textAlign: 'left', lineHeight: '1.8' }}>
                            {discussionData.content.split('\n').map((paragraph: string, index: number) => (
                                <p key={index} className="mb-3" style={{ textAlign: 'left' }}>
                                    {paragraph}
                                </p>
                            ))}
                        </div> */}

                        {/* <div className="d-flex justify-content-between align-items-center">
                            <div className="stats-text"> */}
                        {/* <span className="me-3">{discussionData.comments?.length || 0} comments</span> */}
                        {/* <span className="me-3">{discussionData.views || 0} views</span>
                                <span>{discussionData.likes?.length || 0} likes</span> */}
                        {/* </div>
                        </div> */}
                    </div>
                </div>

                {/* Comments Section - Scrollable */}
                <div
                    className="card mb-2"
                    style={{
                        flex: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        minHeight: 0
                    }}
                >
                    <div className="card-body" style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <h5 className="mb-3" style={{ flexShrink: 0 }}>
                            Comments ({discussionData.comments?.length || 0})
                        </h5>

                        <div
                            ref={chatContainerRef}
                            style={{
                                flex: '1',
                                overflowY: 'auto',
                                paddingRight: '10px'
                            }}
                        >
                            {discussionData.comments?.length === 0 && resources.length === 0 ? (
                                <p className="text-muted text-center py-3">
                                    No comments yet. Be the first to comment!
                                </p>
                            ) : (
                                <div className="comment-section" style={{ textAlign: 'left' }}>
                                    {/* Display resources mixed with comments, sorted by creation date */}
                                    {[...(discussionData.comments || []), ...resources].sort((a, b) => {
                                        const dateA = new Date(a.createdAt).getTime()
                                        const dateB = new Date(b.createdAt).getTime()
                                        return dateA - dateB
                                    }).map((item: any) => {
                                        // Check if it's a resource (has link property) or comment (has content property)
                                        if (item.link) {
                                            // It's a resource - ensure left alignment
                                            return (
                                                <div key={`resource-${item._id}`} className="comment-item mb-3 pb-3 border-bottom" style={{ textAlign: 'left' }}>
                                                    <div className="d-flex justify-content-start align-items-start" style={{ textAlign: 'left' }}>
                                                        <div className="flex-grow-1" style={{ textAlign: 'left' }}>
                                                            <div className="d-flex align-items-center mb-2" style={{ justifyContent: 'flex-start' }}>
                                                                <strong className="me-2">{item.author?.username}</strong>
                                                                <span className="badge bg-success me-2">Shared Resource</span>
                                                                <small className="text-muted">
                                                                    {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                                                                </small>
                                                            </div>
                                                            <div className="card bg-light p-3 mb-2" style={{ textAlign: 'left', backgroundColor: '#f8fafc' }}>
                                                                <h6 className="mb-2" style={{ textAlign: 'left' }}>{item.title}</h6>
                                                                {item.description && (
                                                                    <p className="mb-2 text-muted small" style={{ textAlign: 'left' }}>{item.description}</p>
                                                                )}
                                                                <div className="d-flex align-items-center gap-2" style={{ justifyContent: 'flex-start' }}>
                                                                    <span className="badge bg-info">{item.type}</span>
                                                                    <a
                                                                        href={item.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="btn btn-sm btn-outline-primary"
                                                                    >
                                                                        Open Link
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        } else {
                                            // It's a comment - ensure left alignment
                                            return (
                                                <div key={`comment-${item._id}`} className="comment-item mb-3 pb-3 border-bottom" style={{ textAlign: 'left' }}>
                                                    <div className="d-flex justify-content-start align-items-start" style={{ textAlign: 'left' }}>
                                                        <div className="flex-grow-1" style={{ textAlign: 'left' }}>
                                                            <div className="d-flex align-items-center mb-2" style={{ justifyContent: 'flex-start' }}>
                                                                <strong className="me-2">{item.author?.username}</strong>
                                                                <small className="text-muted">
                                                                    {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                                                                </small>
                                                            </div>
                                                            <p className="mb-0" style={{ textAlign: 'left' }}>{item.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    })}
                                    <div ref={commentsEndRef} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Comment/Resource Form - Fixed at Bottom */}
                {user && (
                    <div className="card" style={{}}>
                        <div className="card-body">
                            <div className="d-flex gap-2 mb-2">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${!showResourceForm ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setShowResourceForm(false)}
                                >
                                    Comment
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${showResourceForm ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setShowResourceForm(true)}
                                >
                                    Share Resource
                                </button>
                            </div>

                            {!showResourceForm ? (
                                <form onSubmit={handleAddComment}>
                                    <div className="d-flex justify-content">
                                        <div className="mb-1 d-flex flex-grow-1 p-2">
                                            <textarea
                                                className="form-control"
                                                rows={1}
                                                placeholder="Share your thoughts..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="d-flex align-items-center justify-content-end">
                                            <button type="submit" className="btn btn-primary" disabled={isLoading || !comment.trim()}>
                                                {isLoading ? 'Posting...' : 'Post Comment'}
                                            </button>
                                        </div>
                                    </div>

                                </form>
                            ) : (
                                <form onSubmit={handleShareResource}>
                                    <div className="row mb-2">
                                        <div className="col-md-8">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Resource title"
                                                value={resourceForm.title}
                                                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-4">
                                            <select
                                                className="form-select"
                                                value={resourceForm.type}
                                                onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                                            >
                                                <option value="link">Link</option>
                                                <option value="article">Article</option>
                                                <option value="video">Video</option>
                                                <option value="document">Document</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <input
                                            type="url"
                                            className="form-control"
                                            placeholder="https://example.com"
                                            value={resourceForm.link}
                                            onChange={(e) => setResourceForm({ ...resourceForm, link: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-1">
                                        <textarea
                                            className="form-control"
                                            rows={1}
                                            placeholder="Description (optional)"
                                            value={resourceForm.description}
                                            onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary me-2"
                                            onClick={() => {
                                                setShowResourceForm(false)
                                                setResourceForm({ title: '', type: 'link', link: '', description: '' })
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isSubmittingResource || !resourceForm.title.trim() || !resourceForm.link.trim()}
                                        >
                                            {isSubmittingResource ? 'Sharing...' : 'Share Resource'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DiscussionDetail
