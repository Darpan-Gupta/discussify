import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface RegisterFormData {
    username: string
    email: string
    password: string
    confirmPassword: string
}

const Register: React.FC = () => {
    const { register: registerUser } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>()

    const password = watch('password')

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)
        setError('')

        try {
            await registerUser(data.username, data.email, data.password)
            navigate('/')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Container>
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card className="auth-container">
                        <Card.Body>
                            <Card.Title className="text-center mb-4">Join Discussify</Card.Title>

                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Form.Floating className="mb-3">
                                    <Form.Control
                                        id="username"
                                        type="text"
                                        placeholder="Username"
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
                                    <label htmlFor="username">Username</label>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>

                                <Form.Floating className="mb-3">
                                    <Form.Control
                                        id="email"
                                        type="email"
                                        placeholder="Email"
                                        isInvalid={!!errors.email}
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^\S+@\S+$/i,
                                                message: 'Invalid email address',
                                            },
                                        })}
                                    />
                                    <label htmlFor="email">Email</label>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>

                                <Form.Floating className="mb-3">
                                    <Form.Control
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        isInvalid={!!errors.password}
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters',
                                            },
                                        })}
                                    />
                                    <label htmlFor="password">Password</label>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>

                                <Form.Floating className="mb-3">
                                    <Form.Control
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm Password"
                                        isInvalid={!!errors.confirmPassword}
                                        {...register('confirmPassword', {
                                            required: 'Please confirm your password',
                                            validate: (value) =>
                                                value === password || 'Passwords do not match',
                                        })}
                                    />
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.confirmPassword?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-100 mb-3"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating Account...' : 'Register'}
                                </Button>
                            </Form>

                            <div className="text-center">
                                <small className="text-muted">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-decoration-none">
                                        Login here
                                    </Link>
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default Register
