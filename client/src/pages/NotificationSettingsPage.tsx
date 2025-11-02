import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../contexts/NotificationContext'

const NotificationSettingsPage: React.FC = () => {
    const navigate = useNavigate()
    const { preferences, updatePreferences, loading } = useNotifications()
    const [localPrefs, setLocalPrefs] = useState(preferences)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setLocalPrefs(preferences)
    }, [preferences])

    const handleToggle = async (type: 'discussion' | 'resource') => {
        const newValue = !localPrefs[type]
        const updatedPrefs = { ...localPrefs, [type]: newValue }

        // Check if both would be disabled
        if (!updatedPrefs.discussion && !updatedPrefs.resource) {
            setErrorMessage('At least one notification type must be enabled')
            setTimeout(() => setErrorMessage(null), 3000)
            return
        }

        setLocalPrefs(updatedPrefs)

        try {
            await updatePreferences({ [type]: newValue })
            setSuccessMessage('Preferences updated successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update preferences')
            setLocalPrefs(preferences) // Revert on error
            setTimeout(() => setErrorMessage(null), 3000)
        }
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Notification Settings</h4>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
                                Back
                            </button>
                        </div>
                        <div className="card-body">
                            {successMessage && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    {successMessage}
                                    <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)}></button>
                                </div>
                            )}
                            {errorMessage && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {errorMessage}
                                    <button type="button" className="btn-close" onClick={() => setErrorMessage(null)}></button>
                                </div>
                            )}

                            <p className="text-muted mb-4">
                                Manage your notification preferences. At least one notification type must remain enabled.
                            </p>

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="card mb-3">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="mb-1">Discussion Notifications</h5>
                                                    <p className="text-muted mb-0 small">
                                                        Get notified when new discussions are created in your communities
                                                    </p>
                                                </div>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        id="discussionSwitch"
                                                        checked={localPrefs.discussion}
                                                        onChange={() => handleToggle('discussion')}
                                                        disabled={!localPrefs.resource && localPrefs.discussion}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card mb-3">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="mb-1">Resource Notifications</h5>
                                                    <p className="text-muted mb-0 small">
                                                        Get notified when new resources are shared in your communities
                                                    </p>
                                                </div>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        id="resourceSwitch"
                                                        checked={localPrefs.resource}
                                                        onChange={() => handleToggle('resource')}
                                                        disabled={!localPrefs.discussion && localPrefs.resource}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {(!localPrefs.discussion || !localPrefs.resource) && (
                                        <div className="alert alert-info" role="alert">
                                            <small>
                                                <strong>Note:</strong> At least one notification type must be enabled.
                                                If both are enabled, you can disable either one.
                                                To disable the last one, you must first enable the other.
                                            </small>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotificationSettingsPage

