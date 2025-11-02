import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { format } from 'date-fns'

const Navbar: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    const [showNotifications, setShowNotifications] = useState(false)
    const notificationRef = useRef<HTMLDivElement>(null)

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const handleNotificationClick = (notificationId: string, discussionId?: string) => {
        markAsRead(notificationId)
        setShowNotifications(false)
        if (discussionId) {
            navigate(`/discussion/${discussionId}`)
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false)
            }
        }

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showNotifications])

    return (
        <nav className="navbar navbar-expand-lg mb-4">
            <div className="container">
                <Link className="navbar-brand" to="/">Discussify</Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/communities">Communities</Link>
                        </li>
                        {user && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/communities/my">My Communities</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/communities/create">Create Community</Link>
                                </li>
                            </>
                        )}
                    </ul>
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        {user ? (
                            <>
                                <li className="nav-item" style={{ position: 'relative' }}>
                                    <div ref={notificationRef} style={{ position: 'relative' }}>
                                        <button
                                            className="btn btn-link nav-link position-relative"
                                            onClick={() => setShowNotifications(!showNotifications)}
                                            style={{ border: 'none', background: 'none', padding: '0.5rem' }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
                                            </svg>
                                            {unreadCount > 0 && (
                                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </button>
                                        {showNotifications && (
                                            <div
                                                className="dropdown-menu dropdown-menu-end show"
                                                style={{
                                                    minWidth: '350px',
                                                    maxHeight: '500px',
                                                    overflowY: 'auto',
                                                    position: 'absolute',
                                                    right: 0,
                                                    marginTop: '8px',
                                                    zIndex: 1050,
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                                                    <h6 className="mb-0">Notifications</h6>
                                                    {notifications.length > 0 && (
                                                        <button
                                                            className="btn btn-sm btn-link text-decoration-none p-0"
                                                            onClick={markAllAsRead}
                                                        >
                                                            Mark all as read
                                                        </button>
                                                    )}
                                                </div>
                                                {notifications.length === 0 ? (
                                                    <div className="px-3 py-4 text-center text-muted">
                                                        <p className="mb-0">No notifications</p>
                                                    </div>
                                                ) : (
                                                    <div className="list-group list-group-flush">
                                                        {notifications.slice(0, 10).map((notification) => (
                                                            <button
                                                                key={notification._id}
                                                                className={`list-group-item list-group-item-action ${!notification.isRead ? 'bg-light' : ''}`}
                                                                onClick={() => handleNotificationClick(
                                                                    notification._id,
                                                                    notification.discussion?._id
                                                                )}
                                                            >
                                                                <div className="d-flex w-100 justify-content-between">
                                                                    <h6 className="mb-1">{notification.title}</h6>
                                                                    {!notification.isRead && (
                                                                        <span className="badge bg-primary rounded-pill">New</span>
                                                                    )}
                                                                </div>
                                                                <p className="mb-1 small">{notification.message.split('||').map((item: string) => <p className="mb-1" key={item}>{item}</p>)}</p>
                                                                <small className="text-muted">
                                                                    {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                                                </small>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="border-top px-3 py-2">
                                                    <Link
                                                        to="/notifications/settings"
                                                        className="btn btn-sm btn-link text-decoration-none p-0"
                                                        onClick={() => setShowNotifications(false)}
                                                    >
                                                        Notification Settings
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </li>
                                <li className="nav-item dropdown">
                                    <a
                                        className="nav-link dropdown-toggle"
                                        href="#"
                                        id="userDropdown"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        {user.username}
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                        <li>
                                            <Link className="dropdown-item" to="/profile">Profile</Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/notifications/settings">Notification Settings</Link>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/signup">Sign Up</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
