import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile">
      <h3>User Profile</h3>
      <dl className="user-info">
        <dt>Name:</dt>
        <dd>{user.name || user.preferred_username || 'N/A'}</dd>

        <dt>Email:</dt>
        <dd>{user.email || 'N/A'}</dd>

        <dt>Username:</dt>
        <dd>{user.preferred_username || user.name || 'N/A'}</dd>

        <dt>User ID:</dt>
        <dd>{user.sub || 'N/A'}</dd>
      </dl>

      <button onClick={logout} className="logout-button">
        Sign Out
      </button>
    </div>
  );
};

export default UserProfile;