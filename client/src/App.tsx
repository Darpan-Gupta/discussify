import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DiscussionDetail from './pages/DiscussionDetail'
import CreateDiscussion from './pages/CreateDiscussion'
import ProfilePage from './pages/ProfilePage'
import CommunitiesPage from './pages/CommunitiesPage'
import CreateCommunityPage from './pages/CreateCommunityPage'
import CommunityDetailPage from './pages/CommunityDetailPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    return (
        <AuthProvider>
            <div className="App">
                <Navbar />
                <main className="container-fluid py-4">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/discussion/:id" element={<DiscussionDetail />} />
                        <Route
                            path="/create"
                            element={
                                <ProtectedRoute>
                                    <CreateDiscussion />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/communities" element={<CommunitiesPage />} />
                        <Route
                            path="/communities/create"
                            element={
                                <ProtectedRoute>
                                    <CreateCommunityPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/communities/:id" element={<CommunityDetailPage />} />
                    </Routes>
                </main>
            </div>
        </AuthProvider>
    )
}

export default App
