import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI } from '../services/api'

interface User {
    id: string
    username: string
    email: string
    bio?: string
    avatar?: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<void>
    signup: (username: string, email: string, password: string) => Promise<void>
    logout: () => void
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token')
            if (storedToken) {
                try {
                    const response = await authAPI.getMe()
                    setUser(response.data)
                } catch (error) {
                    localStorage.removeItem('token')
                    setToken(null)
                }
            }
            setLoading(false)
        }

        initAuth()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const response = await authAPI.login(email, password)
            const { token: newToken } = response.data

            localStorage.setItem('token', newToken)
            setToken(newToken)

            // Fetch user details after login
            const userResponse = await authAPI.getMe()
            setUser(userResponse.data)

        } catch (error: any) {
            throw error
        }
    }

    const signup = async (username: string, email: string, password: string) => {
        try {
            await authAPI.signup(username, email, password)
        } catch (error: any) {
            throw error
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    const value = {
        user,
        token,
        login,
        signup,
        logout,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
