import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { profileAPI } from '../services/api'

interface ProfileFormData {
    username: string
    bio: string
}

const API_BASE_URL = 'http://localhost:5000'

const ProfilePage: React.FC = () => {
    const { user } = useAuth()

    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState<ProfileFormData>({ username: '', bio: '' })
    const [formErrors, setFormErrors] = useState<Partial<ProfileFormData>>({})

    const getAvatarUrl = (avatarPath: string | undefined): string | null => {
        if (!avatarPath) return null
        // If avatar path already starts with http, return as is
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            return avatarPath
        }
        // If avatar path doesn't start with '/', add it
        const normalizedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`
        // console.log(`${API_BASE_URL}${normalizedPath}`)
        return `${API_BASE_URL}${normalizedPath}`
    }

    useEffect(() => {
        if (user) {
            setForm({ username: user.username || '', bio: user.bio || '' })
        }
    }, [user])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errs: Partial<ProfileFormData> = {}
        if (!form.username) errs.username = 'Username is required'
        else if (form.username.length < 3) errs.username = 'Username must be at least 3 characters'
        setFormErrors(errs)
        if (Object.keys(errs).length > 0) return
        setIsLoading(true)
        setError('')

        try {
            await profileAPI.update(form)
            window.alert('Profile updated successfully!')
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to update profile'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            window.alert('Please select an image file')
            return
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            window.alert('File size must be less than 2MB')
            return
        }

        setIsUploading(true)
        try {
            await profileAPI.uploadPicture(file)
            window.alert('Profile picture uploaded successfully!')
            // Refresh user data
            window.location.reload()
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to upload picture'
            window.alert(message)
        } finally {
            setIsUploading(false)
        }
    }

    if (!user) {
        return (
            <div className="container mt-5">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title text-center mb-4">Profile Settings</h5>

                            {error && (
                                <div className="alert alert-danger mb-3" role="alert">{error}</div>
                            )}

                            <form onSubmit={onSubmit} noValidate>
                                <div className="row">
                                    <div className="col-md-4 text-center mb-4">
                                        <div className="mb-3">
                                            {user.avatar ? (
                                                <>
                                                    <img
                                                        src={getAvatarUrl(user.avatar) || ''}
                                                        // src={'Screenshot-(220)-1761844187176.png'}
                                                        alt="Profile"
                                                        className="rounded-circle"
                                                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                    // onError={(e) => {
                                                    //     // Hide the broken image and show fallback
                                                    //     const target = e.target as HTMLImageElement;
                                                    //     target.style.display = 'none';
                                                    //     const fallback = target.nextElementSibling as HTMLElement;
                                                    //     if (fallback) {
                                                    //         fallback.style.display = 'flex';
                                                    //     }
                                                    // }}
                                                    />

                                                </>
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
                                            <label htmlFor="profile-picture" className="btn btn-outline-primary">
                                                {isUploading ? 'Uploading...' : 'Change Picture'}
                                            </label>
                                            <input
                                                id="profile-picture"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                                style={{ display: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-8">
                                        <div className="mb-3">
                                            <label className="form-label">Email</label>
                                            <input type="email" className="form-control bg-light" value={user.email} disabled />
                                            <div className="form-text">Email cannot be changed</div>
                                        </div>

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
                                            <label className="form-label">Bio</label>
                                            <textarea
                                                rows={3}
                                                className="form-control"
                                                placeholder="Tell us about yourself..."
                                                value={form.bio}
                                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                            />
                                        </div>

                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
