import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Container, Card, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { profileAPI } from '../services/api'
import toast from 'react-hot-toast'

interface ProfileFormData {
    username: string
    bio: string
}

const ProfilePage: React.FC = () => {
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ProfileFormData>({
        defaultValues: {
            username: user?.username || '',
            bio: user?.bio || '',
        },
    })

    useEffect(() => {
        if (user) {
            reset({
                username: user.username || '',
                bio: user.bio || '',
            })
        }
    }, [user, reset])

    const onSubmit = async (data: ProfileFormData) => {
        setIsLoading(true)
        setError('')

        try {
            await profileAPI.update(data)
            toast.success('Profile updated successfully!')
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to update profile'
            setError(message)
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB')
            return
        }

        setIsUploading(true)
        try {
            await profileAPI.uploadPicture(file)
            toast.success('Profile picture uploaded successfully!')
            // Refresh user data
            window.location.reload()
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to upload picture'
            toast.error(message)
        } finally {
            setIsUploading(false)
        }
    }

    if (!user) {
        return (
            <Container className="mt-5">
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </Container>
        )
    }

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">Profile Settings</Card.Title>

                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Row>
                                    <Col md={4} className="text-center mb-4">
                                        <div className="mb-3">
                                            {user.avatar ? (
                                                <img
                                                    src={`/uploads/${user.avatar}`}
                                                    alt="Profile"
                                                    className="rounded-circle"
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div
                                                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                                                    style={{ width: '150px', height: '150px', margin: '0 auto' }}
                                                >
                                                    <span className="text-white fs-1">
                                                        {user.username?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <Form.Group>
                                                <Form.Label htmlFor="profile-picture" className="btn btn-outline-primary">
                                                    {isUploading ? 'Uploading...' : 'Change Picture'}
                                                </Form.Label>
                                                <Form.Control
                                                    id="profile-picture"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading}
                                                    style={{ display: 'none' }}
                                                />
                                            </Form.Group>
                                        </div>
                                    </Col>

                                    <Col md={8}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                value={user.email}
                                                disabled
                                                className="bg-light"
                                            />
                                            <Form.Text className="text-muted">
                                                Email cannot be changed
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Username</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter your username"
                                                isInvalid={!!errors.username}
                                                {...register('username', {
                                                    required: 'Username is required',
                                                    minLength: {
                                                        value: 3,
                                                        message: 'Username must be at least 3 characters',
                                                    },
                                                    maxLength: {
                                                        value: 30,
                                                        message: 'Username must be less than 30 characters',
                                                    },
                                                })}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.username?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Bio</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder="Tell us about yourself..."
                                                isInvalid={!!errors.bio}
                                                {...register('bio', {
                                                    maxLength: {
                                                        value: 500,
                                                        message: 'Bio must be less than 500 characters',
                                                    },
                                                })}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {errors.bio?.message}
                                            </Form.Control.Feedback>
                                        </Form.Group>

                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default ProfilePage
