import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Container, Card, Button, Form, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap'
import { format } from 'date-fns'
import { discussionsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const DiscussionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [comment, setComment] = useState('')

    const { data: discussion, isLoading, error } = useQuery(
        ['discussion', id],
        () => discussionsAPI.getById(id!),
        {
            enabled: !!id,
        }
    )

    const addCommentMutation = useMutation(
        (content: string) => discussionsAPI.addComment(id!, content),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['discussion', id])
                setComment('')
                toast.success('Comment added successfully')
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to add comment')
            },
        }
    )

    const deleteCommentMutation = useMutation(
        (commentId: string) => discussionsAPI.deleteComment(id!, commentId),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['discussion', id])
                toast.success('Comment deleted successfully')
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to delete comment')
            },
        }
    )

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault()
        if (comment.trim()) {
            addCommentMutation.mutate(comment.trim())
        }
    }

    const handleDeleteComment = (commentId: string) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            deleteCommentMutation.mutate(commentId)
        }
    }

    if (isLoading) {
        return (
            <Container>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <Alert variant="danger">
                    Error loading discussion. Please try again later.
                </Alert>
            </Container>
        )
    }

    if (!discussion?.data) {
        return (
            <Container>
                <Alert variant="warning">
                    Discussion not found.
                </Alert>
            </Container>
        )
    }

    const discussionData = discussion.data

    return (
        <Container>
            <Row>
                <Col>
                    {/* Discussion Header */}
                    <Card className="mb-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h1>{discussionData.title}</h1>
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <Badge bg="info" className="category-badge">
                                            {discussionData.category}
                                        </Badge>
                                        <small className="text-muted">
                                            by {discussionData.author?.username}
                                        </small>
                                        <small className="text-muted">
                                            {format(new Date(discussionData.createdAt), 'MMM d, yyyy')}
                                        </small>
                                    </div>
                                </div>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => navigate(-1)}
                                >
                                    Back
                                </Button>
                            </div>

                            <div className="discussion-content">
                                {discussionData.content.split('\n').map((paragraph: string, index: number) => (
                                    <p key={index} className="mb-3">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                                <div className="stats-text">
                                    <span className="me-3">{discussionData.comments?.length || 0} comments</span>
                                    <span className="me-3">{discussionData.views || 0} views</span>
                                    <span>{discussionData.likes?.length || 0} likes</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Add Comment Form */}
                    {user && (
                        <Card className="mb-4">
                            <Card.Body>
                                <h5>Add a Comment</h5>
                                <Form onSubmit={handleAddComment}>
                                    <Form.Group className="mb-3">
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Share your thoughts..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            required
                                        />
                                    </Form.Group>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={addCommentMutation.isLoading}
                                    >
                                        {addCommentMutation.isLoading ? 'Posting...' : 'Post Comment'}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Comments Section */}
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">
                                Comments ({discussionData.comments?.length || 0})
                            </h5>

                            {discussionData.comments?.length === 0 ? (
                                <p className="text-muted text-center py-3">
                                    No comments yet. Be the first to comment!
                                </p>
                            ) : (
                                <div className="comment-section">
                                    {discussionData.comments?.map((comment: any) => (
                                        <div key={comment._id} className="comment-item">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <strong className="me-2">{comment.author?.username}</strong>
                                                        <small className="text-muted">
                                                            {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                                                        </small>
                                                    </div>
                                                    <p className="mb-0">{comment.content}</p>
                                                </div>
                                                {user && user.id === comment.author?._id && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        disabled={deleteCommentMutation.isLoading}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default DiscussionDetail
