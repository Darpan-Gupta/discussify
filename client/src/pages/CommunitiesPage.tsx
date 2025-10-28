import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { communitiesAPI } from '../services/api'

const CommunitiesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')

    // Mock data for now - replace with actual API call when backend is ready
    const mockCommunities = [
        {
            _id: '1',
            name: 'Tech Enthusiasts',
            description: 'A community for technology lovers and developers to share ideas and discuss latest trends.',
            members: 1250,
            creator: { username: 'techguru' },
            createdAt: new Date('2024-01-15'),
        },
        {
            _id: '2',
            name: 'Art & Design',
            description: 'Creative minds sharing their artwork, design tips, and inspiration.',
            members: 890,
            creator: { username: 'artist123' },
            createdAt: new Date('2024-01-20'),
        },
        {
            _id: '3',
            name: 'Science & Research',
            description: 'Scientific discussions, research papers, and academic collaboration.',
            members: 2100,
            creator: { username: 'scientist' },
            createdAt: new Date('2024-01-10'),
        },
    ]

    const filteredCommunities = mockCommunities.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
    }

    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>Communities</h1>
                        <Link to="/communities/create">
                            <Button variant="primary">Create Community</Button>
                        </Link>
                    </div>

                    <Form onSubmit={handleSearch} className="mb-4">
                        <Row>
                            <Col md={8}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search communities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Col>
                            <Col md={4}>
                                <Button type="submit" variant="outline-primary" className="w-100">
                                    Search
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Col>
            </Row>

            <Row>
                {filteredCommunities.length === 0 ? (
                    <Col>
                        <Card>
                            <Card.Body className="text-center py-5">
                                <h5>No communities found</h5>
                                <p className="text-muted">
                                    {searchTerm
                                        ? 'Try adjusting your search criteria'
                                        : 'Be the first to create a community!'}
                                </p>
                                {!searchTerm && (
                                    <Link to="/communities/create">
                                        <Button variant="primary">Create Community</Button>
                                    </Link>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ) : (
                    filteredCommunities.map((community) => (
                        <Col md={6} lg={4} key={community._id} className="mb-4">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>{community.name}</Card.Title>
                                    <Card.Text className="text-muted">
                                        {community.description}
                                    </Card.Text>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <small className="text-muted">
                                            by {community.creator.username}
                                        </small>
                                        <Badge bg="info">
                                            {community.members} members
                                        </Badge>
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        <Link to={`/communities/${community._id}`}>
                                            <Button variant="outline-primary" size="sm">
                                                View Details
                                            </Button>
                                        </Link>
                                        <small className="text-muted">
                                            {community.createdAt.toLocaleDateString()}
                                        </small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>
        </Container>
    )
}

export default CommunitiesPage
