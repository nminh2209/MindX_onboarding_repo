import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import Chat from './Chat';
import KnowledgeIngest from './KnowledgeIngest';
import Onboarding from './Onboarding';
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

  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  console.log('🔍 Dashboard - REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('🔍 Dashboard - API_BASE_URL:', API_BASE_URL);

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
      <Onboarding />
      
      <div className="dashboard-header">
        <h1>MindX AI Assistant</h1>
        <p>Production-Ready AI Chat with RAG & MCP Tools</p>
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

      <div className="chat-section">
        <h2>💬 AI Chat & Knowledge Base</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div className="knowledge-section" style={{ flex: '1', minWidth: '300px' }}>
            <KnowledgeIngest apiUrl={API_BASE_URL} />
          </div>
          <div style={{ flex: '2', minWidth: '400px' }}>
            <Chat apiUrl={API_BASE_URL} />
          </div>
        </div>
      </div>

      <div className="dashboard-info">
        <h3>📋 Technical Details</h3>
        <p><strong>API URL:</strong> {API_BASE_URL}</p>
        <p><strong>Authentication:</strong> JWT via MindX OAuth</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        <p><strong>Vector DB:</strong> Qdrant v1.9.0</p>
        <p><strong>AI Model:</strong> GPT-4o-mini (OpenRouter)</p>
      </div>
    </div>
  );
};

export default Dashboard;