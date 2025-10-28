import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { communitiesAPI } from '../services/api'
import toast from 'react-hot-toast'

interface CommunityFormData {
    name: string
    description: string
}

const CreateCommunityPage: React.FC = () => {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CommunityFormData>()

    const onSubmit = async (data: CommunityFormData) => {
        setIsLoading(true)
        setError('')

        try {
            await communitiesAPI.create(data)
            toast.success('Community created successfully!')
            navigate('/communities')
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to create community'
            setError(message)
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                Create New Community
                            </Card.Title>

                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Community Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter community name"
                                        isInvalid={!!errors.name}
                                        {...register('name', {
                                            required: 'Community name is required',
                                            minLength: {
                                                value: 1,
                                                message: 'Community name cannot be empty',
                                            },
                                            maxLength: {
                                                value: 100,
                                                message: 'Community name must be less than 100 characters',
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        placeholder="Describe your community..."
                                        isInvalid={!!errors.description}
                                        {...register('description', {
                                            required: 'Description is required',
                                            minLength: {
                                                value: 1,
                                                message: 'Description cannot be empty',
                                            },
                                            maxLength: {
                                                value: 500,
                                                message: 'Description must be less than 500 characters',
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.description?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        Help others understand what your community is about
                                    </Form.Text>
                                </Form.Group>

                                <div className="d-flex justify-content-between">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate(-1)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Community'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default CreateCommunityPage
