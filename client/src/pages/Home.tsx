import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="container">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container">
            <div className="row mb-4">
                <div className="col">
                    <h1 className="text-center mb-4">Welcome to Discussify</h1>
                    <p className="text-center text-muted mb-4">
                        Join the conversation and share your thoughts with the community
                    </p>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <div className="d-flex justify-content-center gap-3">
                        {user ? (
                            <Link to="/communities" className="btn btn-primary btn-lg">
                                Browse Communities
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-primary btn-lg">
                                    Login
                                </Link>
                                <Link to="/signup" className="btn btn-outline-primary btn-lg">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
