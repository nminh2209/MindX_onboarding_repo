import React, { useState, useEffect } from 'react';
import './App.css';

interface ApiResponse {
  message?: string;
  status?: string;
  timestamp?: string;
  service?: string;
}

function App() {
  const [healthData, setHealthData] = useState<ApiResponse | null>(null);
  const [helloData, setHelloData] = useState<ApiResponse | null>(null);
  const [rootData, setRootData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://135.171.192.18/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch health endpoint
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthResult = await healthResponse.json();
        setHealthData(healthResult);

        // Fetch root endpoint
        const rootResponse = await fetch(`${API_BASE_URL}/`);
        const rootResult = await rootResponse.json();
        setRootData(rootResult);

        // Fetch hello endpoint with default name
        const helloResponse = await fetch(`${API_BASE_URL}/hello/Minh`);
        const helloResult = await helloResponse.json();
        setHelloData(helloResult);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Week 1 MindX Frontend</h1>
        <p>React App connecting to API via Ingress</p>

        {loading && <p>Loading API data...</p>}
        {error && <p className="error">Error: {error}</p>}

        <div className="api-section">
          <h2>API Health Check</h2>
          {healthData && (
            <div className="api-response">
              <pre>{JSON.stringify(healthData, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="api-section">
          <h2>API Root Endpoint</h2>
          {rootData && (
            <div className="api-response">
              <pre>{JSON.stringify(rootData, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="api-section">
          <h2>API Hello Endpoint</h2>
          {helloData && (
            <div className="api-response">
              <pre>{JSON.stringify(helloData, null, 2)}</pre>
            </div>
          )}
        </div>

        <button onClick={handleRefresh} className="refresh-btn">
          Refresh Data
        </button>

        <div className="info-section">
          <h3>API Configuration</h3>
          <p><strong>API URL:</strong> {API_BASE_URL}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>
      </header>
    </div>
  );
}

export default App;