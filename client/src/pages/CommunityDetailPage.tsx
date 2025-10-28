import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Badge, Spinner } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { discussionsAPI, resourcesAPI } from '../services/api'
import JoinCommunityButton from '../components/JoinCommunityButton'
import toast from 'react-hot-toast'

const CommunityDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('discussions')
    const [comment, setComment] = useState('')
    const [resourceForm, setResourceForm] = useState({
        title: '',
        type: 'link',
        link: '',
    })
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [isSubmittingResource, setIsSubmittingResource] = useState(false)

    // Mock data for now
    const community = {
        _id: id,
        name: 'Tech Enthusiasts',
        description: 'A community for technology lovers and developers to share ideas and discuss latest trends.',
        members: 1250,
        creator: { username: 'techguru' },
        createdAt: new Date('2024-01-15'),
    }

    const mockComments = [
        {
            _id: '1',
            content: 'Great discussion! I think we should focus more on AI trends this year.',
            author: { username: 'developer123' },
            createdAt: new Date('2024-01-20'),
        },
        {
            _id: '2',
            content: 'Has anyone tried the new React 18 features? They look promising.',
            author: { username: 'reactdev' },
            createdAt: new Date('2024-01-19'),
        },
    ]

    const mockResources = [
        {
            _id: '1',
            title: 'React 18 Documentation',
            type: 'article',
            link: 'https://react.dev',
            author: { username: 'reactdev' },
            createdAt: new Date('2024-01-18'),
        },
        {
            _id: '2',
            title: 'JavaScript Best Practices Video',
            type: 'video',
            link: 'https://youtube.com/watch?v=example',
            author: { username: 'jsguru' },
            createdAt: new Date('2024-01-17'),
        },
    ]

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!comment.trim()) return

        setIsSubmittingComment(true)
        try {
            // Mock discussion ID - in real app, this would be the discussion ID
            await discussionsAPI.participate('mock-discussion-id', comment.trim())
            toast.success('Comment added successfully!')
            setComment('')
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to add comment'
            toast.error(message)
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const handleResourceSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resourceForm.title.trim() || !resourceForm.link.trim()) return

        setIsSubmittingResource(true)
        try {
            await resourcesAPI.create({
                ...resourceForm,
                communityId: id,
            })
            toast.success('Resource shared successfully!')
            setResourceForm({ title: '', type: 'link', link: '' })
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to share resource'
            toast.error(message)
        } finally {
            setIsSubmittingResource(false)
        }
    }

    const handleJoinSuccess = () => {
        // Refresh community data or update UI
        toast.success('Welcome to the community!')
    }

    return (
        <Container className="mt-4">
            <Row>
                <Col>
                    {/* Community Header */}
                    <Card className="mb-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h1>{community.name}</h1>
                                    <p className="text-muted">{community.description}</p>
                                    <div className="d-flex align-items-center gap-3">
                                        <Badge bg="info">{community.members} members</Badge>
                                        <small className="text-muted">
                                            Created by {community.creator.username}
                                        </small>
                                        <small className="text-muted">
                                            {community.createdAt.toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate(-1)}
                                    >
                                        Back
                                    </Button>
                                    <JoinCommunityButton
                                        communityId={community._id}
                                        onJoin={handleJoinSuccess}
                                    />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Tabs */}
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k || 'discussions')}
                        className="mb-3"
                    >
                        <Tab eventKey="discussions" title="Discussions">
                            <Card>
                                <Card.Body>
                                    <h5>Community Discussions</h5>

                                    {/* Comments List */}
                                    <div className="mb-4">
                                        {mockComments.map((comment) => (
                                            <div key={comment._id} className="border-bottom pb-3 mb-3">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <strong>{comment.author.username}</strong>
                                                        <small className="text-muted ms-2">
                                                            {comment.createdAt.toLocaleDateString()}
                                                        </small>
                                                        <p className="mt-2 mb-0">{comment.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Comment Form */}
                                    {user && (
                                        <Form onSubmit={handleCommentSubmit}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Add a Comment</Form.Label>
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
                                                disabled={isSubmittingComment || !comment.trim()}
                                            >
                                                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                            </Button>
                                        </Form>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="resources" title="Resources">
                            <Card>
                                <Card.Body>
                                    <h5>Shared Resources</h5>

                                    {/* Add Resource Form */}
                                    {user && (
                                        <Card className="mb-4">
                                            <Card.Body>
                                                <h6>Share a Resource</h6>
                                                <Form onSubmit={handleResourceSubmit}>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Title</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Resource title"
                                                                    value={resourceForm.title}
                                                                    onChange={(e) =>
                                                                        setResourceForm({ ...resourceForm, title: e.target.value })
                                                                    }
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Type</Form.Label>
                                                                <Form.Select
                                                                    value={resourceForm.type}
                                                                    onChange={(e) =>
                                                                        setResourceForm({ ...resourceForm, type: e.target.value })
                                                                    }
                                                                >
                                                                    <option value="link">Link</option>
                                                                    <option value="article">Article</option>
                                                                    <option value="video">Video</option>
                                                                    <option value="document">Document</option>
                                                                    <option value="other">Other</option>
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>URL</Form.Label>
                                                        <Form.Control
                                                            type="url"
                                                            placeholder="https://example.com"
                                                            value={resourceForm.link}
                                                            onChange={(e) =>
                                                                setResourceForm({ ...resourceForm, link: e.target.value })
                                                            }
                                                            required
                                                        />
                                                    </Form.Group>
                                                    <Button
                                                        type="submit"
                                                        variant="primary"
                                                        disabled={isSubmittingResource || !resourceForm.title.trim() || !resourceForm.link.trim()}
                                                    >
                                                        {isSubmittingResource ? 'Sharing...' : 'Share Resource'}
                                                    </Button>
                                                </Form>
                                            </Card.Body>
                                        </Card>
                                    )}

                                    {/* Resources List */}
                                    <div>
                                        {mockResources.map((resource) => (
                                            <div key={resource._id} className="border-bottom pb-3 mb-3">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6>
                                                            <a
                                                                href={resource.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-decoration-none"
                                                            >
                                                                {resource.title}
                                                            </a>
                                                        </h6>
                                                        <Badge bg="secondary" className="me-2">
                                                            {resource.type}
                                                        </Badge>
                                                        <small className="text-muted">
                                                            Shared by {resource.author.username} • {resource.createdAt.toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </Container>
    )
}

export default CommunityDetailPage
