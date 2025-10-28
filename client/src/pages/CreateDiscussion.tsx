import React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap'
import { discussionsAPI } from '../services/api'
import toast from 'react-hot-toast'

interface DiscussionFormData {
    title: string
    content: string
    category: string
}

const CreateDiscussion: React.FC = () => {
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<DiscussionFormData>({
        defaultValues: {
            category: 'General',
        },
    })

    const createDiscussionMutation = useMutation(
        (data: DiscussionFormData) => discussionsAPI.create(data),
        {
            onSuccess: (response) => {
                toast.success('Discussion created successfully!')
                navigate(`/discussion/${response.data._id}`)
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to create discussion')
            },
        }
    )

    const onSubmit = (data: DiscussionFormData) => {
        createDiscussionMutation.mutate(data)
    }

    const categories = [
        'General',
        'Technology',
        'Science',
        'Arts',
        'Sports',
        'Politics',
        'Other',
    ]

    return (
        <Container>
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                Create New Discussion
                            </Card.Title>

                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter a descriptive title for your discussion"
                                        isInvalid={!!errors.title}
                                        {...register('title', {
                                            required: 'Title is required',
                                            minLength: {
                                                value: 1,
                                                message: 'Title cannot be empty',
                                            },
                                            maxLength: {
                                                value: 200,
                                                message: 'Title must be less than 200 characters',
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.title?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select
                                        isInvalid={!!errors.category}
                                        {...register('category', {
                                            required: 'Category is required',
                                        })}
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.category?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Content</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={10}
                                        placeholder="Share your thoughts, questions, or ideas..."
                                        isInvalid={!!errors.content}
                                        {...register('content', {
                                            required: 'Content is required',
                                            minLength: {
                                                value: 1,
                                                message: 'Content cannot be empty',
                                            },
                                            maxLength: {
                                                value: 5000,
                                                message: 'Content must be less than 5000 characters',
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.content?.message}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        Be respectful and constructive in your discussion.
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
                                        disabled={createDiscussionMutation.isLoading}
                                    >
                                        {createDiscussionMutation.isLoading ? 'Creating...' : 'Create Discussion'}
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

export default CreateDiscussion
