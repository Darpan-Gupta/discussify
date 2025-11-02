import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { communitiesAPI } from '../services/api'

const MyCommunitiesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [communities, setCommunities] = useState<any[]>([])

    useEffect(() => {
        const fetchMyCommunities = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await communitiesAPI.getMyCommunities()
                setCommunities(response.data)
            } catch (err) {
                setError('Error loading your communities')
            } finally {
                setIsLoading(false)
            }
        }
        fetchMyCommunities()
    }, [])

    const filteredCommunities = communities.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
    }

    // Separate communities by type
    const publicCommunities = filteredCommunities.filter(community => !community.isPrivate)
    const privateCommunities = filteredCommunities.filter(community => community.isPrivate)

    return (
        <div className="container mt-4">
            <div className="row mb-4">
                <div className="col">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1>My Communities</h1>
                        <Link to="/communities/create" className="btn btn-primary">Create Community</Link>
                    </div>

                    <form onSubmit={handleSearch} className="mb-4">
                        <div className="row">
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search your communities..."
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
                <>
                    {/* Public Communities Section */}
                    <div className="mb-5">
                        <h2 className="mb-3">Public Communities</h2>
                        {publicCommunities.length === 0 ? (
                            <div className="card">
                                <div className="card-body text-center py-5">
                                    <h5>No public communities</h5>
                                    <p className="text-muted">
                                        {searchTerm
                                            ? 'No public communities match your search'
                                            : 'You are not part of any public communities yet'}
                                    </p>
                                    {!searchTerm && (
                                        <Link to="/communities/create" className="btn btn-primary">Create Community</Link>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="row">
                                {publicCommunities.map((community) => (
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
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Private Communities Section */}
                    <div className="mb-5">
                        <h2 className="mb-3">Private Communities</h2>
                        {privateCommunities.length === 0 ? (
                            <div className="card">
                                <div className="card-body text-center py-5">
                                    <h5>No private communities</h5>
                                    <p className="text-muted">
                                        {searchTerm
                                            ? 'No private communities match your search'
                                            : 'You are not part of any private communities yet'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="row">
                                {privateCommunities.map((community) => (
                                    <div className="col-md-6 col-lg-4 mb-4" key={community._id}>
                                        <div className="card h-100 border-warning">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h5 className="card-title">{community.name}</h5>
                                                    <span className="badge bg-warning text-dark">Private</span>
                                                </div>
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
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Empty State if no communities at all */}
                    {publicCommunities.length === 0 && privateCommunities.length === 0 && !searchTerm && (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <h5>No communities found</h5>
                                <p className="text-muted">
                                    You are not part of any communities yet. Join or create one to get started!
                                </p>
                                <div className="mt-3">
                                    <Link to="/communities/create" className="btn btn-primary me-2">Create Community</Link>
                                    <Link to="/communities" className="btn btn-outline-primary">Browse Communities</Link>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default MyCommunitiesPage

