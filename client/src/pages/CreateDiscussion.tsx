import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { discussionsAPI } from '../services/api'
import { useNotifications } from '../contexts/NotificationContext'

interface DiscussionFormData {
    title: string
    content: string
    category: string
}

const CreateDiscussion: React.FC = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const { refreshNotifications } = useNotifications()
    const [form, setForm] = useState<DiscussionFormData>({ title: '', content: '', category: 'General' })
    const [errors, setErrors] = useState<Partial<DiscussionFormData>>({})
    const [isLoading, setIsLoading] = useState(false)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errs: Partial<DiscussionFormData> = {}
        if (!form.title) errs.title = 'Title is required'
        if (!form.category) errs.category = 'Category is required'
        if (!form.content) errs.content = 'Content is required'
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        if (!id) {
            return
        }

        try {
            setIsLoading(true)
            const res = await discussionsAPI.create({
                ...form,
                communityId: id
            })
            // Refresh notifications for community members
            refreshNotifications()
            navigate(`/discussion/${res.data._id}`)
        } catch (error: any) {
            console.error('Error creating discussion:', error)
            // Error handled silently
        } finally {
            setIsLoading(false)
        }
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
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title text-center mb-4">Create New Discussion</h5>

                            <form onSubmit={onSubmit} noValidate>
                                <div className="mb-3">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                        placeholder="Enter a descriptive title for your discussion"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                                    {errors.title && (
                                        <div className="invalid-feedback">{errors.title}</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Category</label>
                                    <select
                                        className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <div className="invalid-feedback">{errors.category}</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Content</label>
                                    <textarea
                                        rows={10}
                                        className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                                        placeholder="Share your thoughts, questions, or ideas..."
                                        value={form.content}
                                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    />
                                    {errors.content && (
                                        <div className="invalid-feedback">{errors.content}</div>
                                    )}
                                    <div className="form-text">Be respectful and constructive in your discussion.</div>
                                </div>

                                <div className="d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            if (id) {
                                                navigate(`/communities/${id}`)
                                            } else {
                                                navigate(-1)
                                            }
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Discussion'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateDiscussion
