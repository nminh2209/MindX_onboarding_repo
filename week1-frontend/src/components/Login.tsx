import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome to MindX</h1>
          <p>Please sign in to access the application</p>
        </div>

        <div className="auth-form">
          <button
            onClick={login}
            disabled={isLoading}
            className="auth-button"
          >
            {isLoading ? 'Signing in...' : 'Sign in with MindX'}
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;