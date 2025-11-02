import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { communitiesAPI } from '../services/api'

interface CommunityFormData {
    name: string
    description: string
    isPrivate: boolean
}

const CreateCommunityPage: React.FC = () => {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState<CommunityFormData>({ name: '', description: '', isPrivate: false })
    const [formErrors, setFormErrors] = useState<Partial<CommunityFormData>>({})
    const [inviteLink, setInviteLink] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errs: Partial<CommunityFormData> = {}
        if (!form.name) errs.name = 'Community name is required'
        if (!form.description) errs.description = 'Description is required'
        setFormErrors(errs)
        if (Object.keys(errs).length > 0) return
        setIsLoading(true)
        setError('')

        try {
            const response = await communitiesAPI.create(form)

            // If private community, show invite link
            if (form.isPrivate && response.data.community) {
                const link = `${window.location.origin}/communities/${response.data.community._id}?token=${response.data.community.inviteToken}`
                setInviteLink(link)
            } else {
                navigate('/communities')
            }
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to create community'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    const copyInviteLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
        }
    }

    const handleContinue = () => {
        navigate('/communities')
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title text-center mb-4">Create New Community</h5>

                            {error && (
                                <div className="alert alert-danger mb-3" role="alert">{error}</div>
                            )}

                            <form onSubmit={onSubmit} noValidate>
                                <div className="mb-3">
                                    <label className="form-label">Community Name</label>
                                    <input
                                        type="text"
                                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                        placeholder="Enter community name"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                    {formErrors.name && (
                                        <div className="invalid-feedback">{formErrors.name}</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        rows={4}
                                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        placeholder="Describe your community..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                    {formErrors.description && (
                                        <div className="invalid-feedback">{formErrors.description}</div>
                                    )}
                                    <div className="form-text">Help others understand what your community is about</div>
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={form.isPrivate}
                                            onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                                            id="isPrivateCheck"
                                        />
                                        <label className="form-check-label" htmlFor="isPrivateCheck">
                                            Make this a private community (requires invite link to join)
                                        </label>
                                    </div>
                                </div>

                                {inviteLink ? (
                                    <div className="mb-3">
                                        <div className="alert alert-success" role="alert">
                                            <h6 className="alert-heading">Invite Link Generated!</h6>
                                            <p>Share this link with people you want to invite to your community:</p>
                                            <div className="input-group mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={inviteLink}
                                                    readOnly
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={copyInviteLink}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <button className="btn btn-primary w-100" onClick={handleContinue}>
                                                Continue to Communities
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-between">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                            {isLoading ? 'Creating...' : 'Create Community'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateCommunityPage
