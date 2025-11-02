import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface SignupFormData {
    username: string
    email: string
    password: string
    confirmPassword: string

}

const SignupPage: React.FC = () => {
    const { signup } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState<SignupFormData>({ username: '', email: '', password: '', confirmPassword: '' })
    const [formErrors, setFormErrors] = useState<Partial<SignupFormData>>({})

    const validate = (): boolean => {
        const errs: Partial<SignupFormData> = {}
        if (!form.username) errs.username = 'Username is required'
        else if (form.username.length < 3) errs.username = 'Username must be at least 3 characters'
        if (!form.email) errs.email = 'Email is required'
        else if (!/^\S+@\S+$/.test(form.email)) errs.email = 'Invalid email address'
        if (!form.password) errs.password = 'Password is required'
        else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters'
        if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
        else if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match'
        setFormErrors(errs)
        return Object.keys(errs).length === 0
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setIsLoading(true)
        setError('')

        try {
            await signup(form.username, form.email, form.password)
            navigate('/login')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Signup failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title text-center mb-4">Join Discussify</h5>

                            {error && (
                                <div className="alert alert-danger mb-3" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={onSubmit} noValidate>
                                <div className="mb-3">
                                    <label className="form-label">Username</label>
                                    <input
                                        type="text"
                                        className={`form-control ${formErrors.username ? 'is-invalid' : ''}`}
                                        placeholder="Enter your username"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    />
                                    {formErrors.username && (
                                        <div className="invalid-feedback">{formErrors.username}</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                                        placeholder="Enter your email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                    {formErrors.email && (
                                        <div className="invalid-feedback">{formErrors.email}</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                                        placeholder="Enter your password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    />
                                    {formErrors.password && (
                                        <div className="invalid-feedback">{formErrors.password}</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                                        placeholder="Confirm your password"
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    />
                                    {formErrors.confirmPassword && (
                                        <div className="invalid-feedback">{formErrors.confirmPassword}</div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                                </button>
                            </form>

                            <div className="text-center">
                                <small className="text-muted">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-decoration-none">
                                        Login here
                                    </Link>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupPage
