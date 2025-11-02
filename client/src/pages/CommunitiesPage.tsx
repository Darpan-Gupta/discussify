import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { communitiesAPI } from '../services/api'

const CommunitiesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [communities, setCommunities] = useState<any[]>([])

    useEffect(() => {
        const fetchCommunities = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await communitiesAPI.getAll()
                setCommunities(response.data)
            } catch (err) {
                setError('Error loading communities')
            } finally {
                setIsLoading(false)
            }
        }
        fetchCommunities()
    }, [])

    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
    }

    return (
        <div className="container mt-4">
            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>Communities</h1>
                        <Link to="/communities/create" className="btn btn-primary">Create Community</Link>
                    </div>

                    <form onSubmit={handleSearch} className="mb-4">
                        <div className="row">
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search communities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <button type="submit" className="btn btn-outline-primary w-100">
                                    Search
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {isLoading && (
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {!isLoading && !error && (
                <div className="row">
                    {filteredCommunities.length === 0 ? (
                        <div className="col">
                            <div className="card">
                                <div className="card-body text-center py-5">
                                    <h5>No communities found</h5>
                                    <p className="text-muted">
                                        {searchTerm
                                            ? 'Try adjusting your search criteria'
                                            : 'Be the first to create a community!'}
                                    </p>
                                    {!searchTerm && (
                                        <Link to="/communities/create" className="btn btn-primary">Create Community</Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        filteredCommunities.map((community) => (
                            <div className="col-md-6 col-lg-4 mb-4" key={community._id}>
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h5 className="card-title">{community.name}</h5>
                                        <p className="card-text text-muted">{community.description}</p>

                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <small className="text-muted">
                                                by {community.creator?.username || 'Unknown'}
                                            </small>
                                            <span className="badge bg-info">{community.members?.length || 0} members</span>
                                        </div>

                                        <div className="d-flex justify-content-between">
                                            <Link to={`/communities/${community._id}`} className="btn btn-outline-primary btn-sm">
                                                View Details
                                            </Link>
                                            <small className="text-muted">
                                                {new Date(community.createdAt).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default CommunitiesPage
