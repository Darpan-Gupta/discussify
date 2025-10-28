import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Container, Row, Col, Card, Form, Button, Badge, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { discussionsAPI } from '../services/api'

const Home: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const { data, isLoading, error } = useQuery(
        ['discussions', currentPage, selectedCategory, searchTerm],
        () => discussionsAPI.getAll({
            page: currentPage,
            limit: 10,
            category: selectedCategory || undefined,
            search: searchTerm || undefined,
        }),
        {
            keepPreviousData: true,
        }
    )

    const categories = ['General', 'Technology', 'Science', 'Arts', 'Sports', 'Politics', 'Other']

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
    }

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category === selectedCategory ? '' : category)
        setCurrentPage(1)
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
                <div className="alert alert-danger" role="alert">
                    Error loading discussions. Please try again later.
                </div>
            </Container>
        )
    }

    return (
        <Container>
            <Row className="mb-4">
                <Col>
                    <h1 className="text-center mb-4">Welcome to Discussify</h1>
                    <p className="text-center text-muted mb-4">
                        Join the conversation and share your thoughts with the community
                    </p>
                </Col>
            </Row>

            {/* Search and Filter */}
            <Row className="mb-4">
                <Col md={8}>
                    <Form onSubmit={handleSearch} className="d-flex">
                        <Form.Control
                            type="text"
                            placeholder="Search discussions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="me-2"
                        />
                        <Button type="submit" variant="primary">
                            Search
                        </Button>
                    </Form>
                </Col>
                <Col md={4}>
                    <div className="d-flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <Badge
                                key={category}
                                bg={selectedCategory === category ? 'primary' : 'secondary'}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleCategoryChange(category)}
                            >
                                {category}
                            </Badge>
                        ))}
                    </div>
                </Col>
            </Row>

            {/* Discussions List */}
            <Row>
                <Col>
                    {data?.discussions?.length === 0 ? (
                        <Card>
                            <Card.Body className="text-center py-5">
                                <h5>No discussions found</h5>
                                <p className="text-muted">
                                    {searchTerm || selectedCategory
                                        ? 'Try adjusting your search or filter criteria'
                                        : 'Be the first to start a discussion!'}
                                </p>
                            </Card.Body>
                        </Card>
                    ) : (
                        data?.discussions?.map((discussion: any) => (
                            <Card key={discussion._id} className="mb-3 discussion-card">
                                <Card.Body>
                                    <Row>
                                        <Col md={8}>
                                            <Card.Title>
                                                <Link
                                                    to={`/discussion/${discussion._id}`}
                                                    className="text-decoration-none"
                                                >
                                                    {discussion.title}
                                                </Link>
                                            </Card.Title>
                                            <Card.Text className="text-muted">
                                                {discussion.content.substring(0, 150)}
                                                {discussion.content.length > 150 && '...'}
                                            </Card.Text>
                                            <div className="d-flex align-items-center gap-3">
                                                <Badge bg="info" className="category-badge">
                                                    {discussion.category}
                                                </Badge>
                                                <small className="text-muted">
                                                    by {discussion.author?.username}
                                                </small>
                                                <small className="text-muted">
                                                    {format(new Date(discussion.createdAt), 'MMM d, yyyy')}
                                                </small>
                                            </div>
                                        </Col>
                                        <Col md={4} className="text-end">
                                            <div className="stats-text">
                                                <div>{discussion.comments?.length || 0} comments</div>
                                                <div>{discussion.views || 0} views</div>
                                                <div>{discussion.likes?.length || 0} likes</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))
                    )}
                </Col>
            </Row>

            {/* Pagination */}
            {data?.totalPages > 1 && (
                <Row className="mt-4">
                    <Col className="d-flex justify-content-center">
                        <div className="btn-group" role="group">
                            <Button
                                variant="outline-primary"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                Previous
                            </Button>
                            <Button variant="outline-primary" disabled>
                                {currentPage} of {data?.totalPages}
                            </Button>
                            <Button
                                variant="outline-primary"
                                disabled={currentPage === data?.totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </Col>
                </Row>
            )}
        </Container>
    )
}

export default Home
