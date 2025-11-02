import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

interface LoginFormData {
    email: string
    password: string
}

interface ResetPasswordFormData {
    email: string
    otp: string
    newPassword: string
    confirmPassword: string
}

const STATIC_OTP = '123456'

const LoginPage: React.FC = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetStep, setResetStep] = useState<'email' | 'otp' | 'success'>('email')
    const [resetError, setResetError] = useState('')
    const [isRequestingOTP, setIsRequestingOTP] = useState(false)
    const [isResettingPassword, setIsResettingPassword] = useState(false)

    const [form, setForm] = useState<LoginFormData>({ email: '', password: '' })
    const [formErrors, setFormErrors] = useState<Partial<LoginFormData>>({})
    const [resetForm, setResetForm] = useState<ResetPasswordFormData>({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [resetFormErrors, setResetFormErrors] = useState<Partial<ResetPasswordFormData>>({})

    const validate = (): boolean => {
        const errs: Partial<LoginFormData> = {}
        if (!form.email) errs.email = 'Email is required'
        else if (!/^\S+@\S+$/.test(form.email)) errs.email = 'Invalid email address'
        if (!form.password) errs.password = 'Password is required'
        setFormErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleForgotPasswordClick = () => {
        setShowForgotPassword(true)
        setResetStep('email')
        setResetError('')
        setResetForm({ email: '', otp: '', newPassword: '', confirmPassword: '' })
        setResetFormErrors({})
    }

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetForm.email) {
            setResetFormErrors({ email: 'Email is required' })
            return
        }
        if (!/^\S+@\S+$/.test(resetForm.email)) {
            setResetFormErrors({ email: 'Invalid email address' })
            return
        }

        setIsRequestingOTP(true)
        setResetError('')
        setResetFormErrors({})

        try {
            const fetchedOTP = await authAPI.forgotPassword(resetForm.email)
            setResetStep('otp')
        } catch (err: any) {
            setResetError(err.response?.data?.error || 'Failed to request OTP')
        } finally {
            setIsRequestingOTP(false)
        }
    }

    const validateResetForm = (): boolean => {
        const errs: Partial<ResetPasswordFormData> = {}
        if (!resetForm.otp) errs.otp = 'OTP is required'
        else if (resetForm.otp !== STATIC_OTP) errs.otp = 'Invalid OTP'
        if (!resetForm.newPassword) errs.newPassword = 'New password is required'
        else if (resetForm.newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters'
        if (!resetForm.confirmPassword) errs.confirmPassword = 'Please confirm your password'
        else if (resetForm.newPassword !== resetForm.confirmPassword) errs.confirmPassword = 'Passwords do not match'

        setResetFormErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateResetForm()) return

        setIsResettingPassword(true)
        setResetError('')

        try {
            await authAPI.resetPassword(resetForm.email, resetForm.otp, resetForm.newPassword)
            setResetStep('success')
        } catch (err: any) {
            setResetError(err.response?.data?.error || 'Failed to reset password')
        } finally {
            setIsResettingPassword(false)
        }
    }

    const handleCloseForgotPassword = () => {
        setShowForgotPassword(false)
        setResetStep('email')
        setResetError('')
        setResetForm({ email: '', otp: '', newPassword: '', confirmPassword: '' })
        setResetFormErrors({})
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setIsLoading(true)
        setError('')

        try {
            await login(form.email, form.password)
            navigate('/communities/my')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed')
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
                            <h5 className="card-title text-center mb-4">Login to Discussify</h5>

                            {error && (
                                <div className="alert alert-danger mb-3" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={onSubmit} noValidate>
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

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>
                            </form>

                            <div className="text-center mb-2">
                                <button
                                    type="button"
                                    className="btn btn-link text-decoration-none p-0"
                                    onClick={handleForgotPasswordClick}
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            <div className="text-center">
                                <small className="text-muted">
                                    Don't have an account?{' '}
                                    <Link to="/signup" className="text-decoration-none">
                                        Sign up here
                                    </Link>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Reset Password</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseForgotPassword}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {resetError && (
                                    <div className="alert alert-danger mb-3" role="alert">
                                        {resetError}
                                    </div>
                                )}

                                {resetStep === 'email' && (
                                    <form onSubmit={handleRequestOTP}>
                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className={`form-control ${resetFormErrors.email ? 'is-invalid' : ''}`}
                                                placeholder="Enter your email"
                                                value={resetForm.email}
                                                onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                                                disabled={isRequestingOTP}
                                            />
                                            {resetFormErrors.email && (
                                                <div className="invalid-feedback">{resetFormErrors.email}</div>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100"
                                            disabled={isRequestingOTP}
                                        >
                                            {isRequestingOTP ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    </form>
                                )}

                                {resetStep === 'otp' && (
                                    <div>
                                        <div className="alert alert-info mb-3" role="alert">
                                            <strong>Your OTP:</strong> {STATIC_OTP}
                                            <br />
                                            <small>Use this OTP to reset your password</small>
                                        </div>
                                        <form onSubmit={handleResetPassword}>
                                            <div className="mb-3">
                                                <label className="form-label">Enter OTP</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${resetFormErrors.otp ? 'is-invalid' : ''}`}
                                                    placeholder="Enter 6-digit OTP"
                                                    value={resetForm.otp}
                                                    onChange={(e) => setResetForm({ ...resetForm, otp: e.target.value })}
                                                    maxLength={6}
                                                    disabled={isResettingPassword}
                                                />
                                                {resetFormErrors.otp && (
                                                    <div className="invalid-feedback">{resetFormErrors.otp}</div>
                                                )}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">New Password</label>
                                                <input
                                                    type="password"
                                                    className={`form-control ${resetFormErrors.newPassword ? 'is-invalid' : ''}`}
                                                    placeholder="Enter new password"
                                                    value={resetForm.newPassword}
                                                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                                                    disabled={isResettingPassword}
                                                />
                                                {resetFormErrors.newPassword && (
                                                    <div className="invalid-feedback">{resetFormErrors.newPassword}</div>
                                                )}
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    className={`form-control ${resetFormErrors.confirmPassword ? 'is-invalid' : ''}`}
                                                    placeholder="Confirm new password"
                                                    value={resetForm.confirmPassword}
                                                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                                                    disabled={isResettingPassword}
                                                />
                                                {resetFormErrors.confirmPassword && (
                                                    <div className="invalid-feedback">{resetFormErrors.confirmPassword}</div>
                                                )}
                                            </div>
                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100"
                                                disabled={isResettingPassword}
                                            >
                                                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {resetStep === 'success' && (
                                    <div>
                                        <div className="alert alert-success mb-3" role="alert">
                                            <strong>Success!</strong> Your password has been reset successfully.
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary w-100"
                                            onClick={handleCloseForgotPassword}
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LoginPage
