import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { usersAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface ProfileFormData {
    username: string
    email: string
    bio: string
}

const Profile: React.FC = () => {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ProfileFormData>({
        defaultValues: {
            username: user?.username || '',
            email: user?.email || '',
            bio: user?.bio || '',
        },
    })

    const updateProfileMutation = useMutation(
        (data: ProfileFormData) => usersAPI.update(user!.id, data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['auth'])
                setIsEditing(false)
                toast.success('Profile updated successfully!')
            },
            onError: (error: any) => {
                setError(error.response?.data?.message || 'Failed to update profile')
            },
        }
    )

    const deleteAccountMutation = useMutation(
        () => usersAPI.delete(user!.id),
        {
            onSuccess: () => {
                toast.success('Account deleted successfully')
                logout()
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to delete account')
            },
        }
    )

    const onSubmit = (data: ProfileFormData) => {
        setError('')
        updateProfileMutation.mutate(data)
    }

    const handleEdit = () => {
        setIsEditing(true)
        setError('')
    }

    const handleCancel = () => {
        setIsEditing(false)
        setError('')
        reset()
    }

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            deleteAccountMutation.mutate()
        }
    }

    if (!user) {
        return (
            <Container>
                <Alert variant="danger">User not found</Alert>
            </Container>
        )
    }

    return (
        <Container>
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card>
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Card.Title>Profile</Card.Title>
                                {!isEditing && (
                                    <Button variant="outline-primary" onClick={handleEdit}>
                                        Edit Profile
                                    </Button>
                                )}
                            </div>

                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control
                                        type="text"
                                        disabled={!isEditing}
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
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        disabled={!isEditing}
                                        isInvalid={!!errors.email}
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^\S+@\S+$/i,
                                                message: 'Invalid email address',
                                            },
                                        })}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Bio</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        disabled={!isEditing}
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

                                {isEditing && (
                                    <div className="d-flex gap-2">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={updateProfileMutation.isLoading}
                                        >
                                            {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline-secondary"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </Form>

                            <hr className="my-4" />

                            <div className="text-center">
                                <Button
                                    variant="outline-danger"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteAccountMutation.isLoading}
                                >
                                    {deleteAccountMutation.isLoading ? 'Deleting...' : 'Delete Account'}
                                </Button>
                                <p className="text-muted mt-2 small">
                                    This action cannot be undone
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default Profile
