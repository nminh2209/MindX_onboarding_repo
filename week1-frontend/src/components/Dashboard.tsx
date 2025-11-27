import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import './Dashboard.css';

interface ApiResponse {
  message?: string;
  status?: string;
  timestamp?: string;
  service?: string;
  user?: any;
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [healthData, setHealthData] = useState<ApiResponse | null>(null);
  const [helloData, setHelloData] = useState<ApiResponse | null>(null);
  const [rootData, setRootData] = useState<ApiResponse | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch health endpoint (public)
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      const healthResult = await healthResponse.json();
      setHealthData(healthResult);

      // Fetch protected endpoints
      const rootResponse = await fetch(`${API_BASE_URL}/`, { headers });
      const rootResult = await rootResponse.json();
      setRootData(rootResult);

      const helloResponse = await fetch(`${API_BASE_URL}/hello`, { headers });
      const helloResult = await helloResponse.json();
      setHelloData(helloResult);

      const profileResponse = await fetch(`${API_BASE_URL}/profile`, { headers });
      const profileResult = await profileResponse.json();
      setProfileData(profileResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Week 1 MindX Dashboard</h1>
        <p>Authenticated API Testing Interface</p>
      </div>

      <UserProfile />

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading API data...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      <div className="api-grid">
        <div className="api-card">
          <h3>API Health Check (Public)</h3>
          {healthData && (
            <pre className="api-response">{JSON.stringify(healthData, null, 2)}</pre>
          )}
        </div>

        <div className="api-card">
          <h3>API Root Endpoint (Protected)</h3>
          {rootData && (
            <pre className="api-response">{JSON.stringify(rootData, null, 2)}</pre>
          )}
        </div>

        <div className="api-card">
          <h3>API Hello Endpoint (Protected)</h3>
          {helloData && (
            <pre className="api-response">{JSON.stringify(helloData, null, 2)}</pre>
          )}
        </div>

        <div className="api-card">
          <h3>User Profile (Protected)</h3>
          {profileData && (
            <pre className="api-response">{JSON.stringify(profileData, null, 2)}</pre>
          )}
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={fetchData} disabled={loading} className="refresh-button">
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="dashboard-info">
        <h3>Configuration</h3>
        <p><strong>API URL:</strong> {API_BASE_URL}</p>
        <p><strong>Authentication:</strong> JWT via API</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
};

export default Dashboard;