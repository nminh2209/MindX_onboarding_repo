import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { expressjwt } from 'express-jwt';
import * as openid from 'openid-client';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// OpenID Connect Configuration
const OIDC_ISSUER_URL = 'https://id-dev.mindx.edu.vn';
const OIDC_CLIENT_ID = 'mindx-onboarding';
const OIDC_CLIENT_SECRET = 'cHJldmVudGJvdW5kYmF0dHJlZWV4cGxvcmVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU=';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';

// Frontend URL for redirects after auth
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// JWT Secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// OpenID Client instance (Configuration object)
let oidcConfig: any;
let authorizationEndpoint: string = '';

// Middleware
app.use(express.json());
// Enable CORS for frontend
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// JWT Middleware for protecting routes
const jwtMiddleware = expressjwt({
  secret: JWT_SECRET,
  algorithms: ['HS256'],
  credentialsRequired: false, // Allow unauthenticated requests for public endpoints
});

// Initialize OpenID Client
async function initializeOIDC() {
  try {
    oidcConfig = await openid.discovery(
      new URL(OIDC_ISSUER_URL),
      OIDC_CLIENT_ID,
      OIDC_CLIENT_SECRET,
    );

    // Hardcode the authorization endpoint for MindX
    authorizationEndpoint = `${OIDC_ISSUER_URL}/auth`;

    console.log('✅ OpenID Connect client initialized');
    console.log('📍 Authorization endpoint:', authorizationEndpoint);
  } catch (error) {
    console.error('❌ Failed to initialize OpenID Connect client:', error);
    // Fallback endpoint
    authorizationEndpoint = `${OIDC_ISSUER_URL}/auth`;
  }
}

// Authentication Routes

// Login endpoint - redirect to OpenID provider
app.get('/auth/login', async (req: Request, res: Response) => {
  try {
    if (!authorizationEndpoint) {
      return res.status(500).json({ error: 'OpenID client not initialized' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    
    // Build authorization URL manually with correct parameters
    const params = new URLSearchParams({
      client_id: OIDC_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      state: state,
      max_age: '300',
    });

    const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Callback endpoint - handle OpenID provider response
app.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    console.log('Received callback with code:', code ? 'present' : 'missing');
    console.log('State:', state);
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code received', query: req.query });
    }

    // Manually exchange code for tokens
    console.log('Exchanging code for tokens...');
    console.log('Client ID:', OIDC_CLIENT_ID);
    console.log('Client Secret (first 10 chars):', OIDC_CLIENT_SECRET.substring(0, 10) + '...');
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Code:', code);
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
    });

    console.log('Token endpoint:', `${OIDC_ISSUER_URL}/token`);
    console.log('Request body:', tokenParams.toString());

    const tokenResponse = await fetch(`${OIDC_ISSUER_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });
    
    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokens: any = await tokenResponse.json();
    console.log('Token exchange successful');
    
    // Decode the ID token to get user info
    const idToken = tokens.id_token;
    if (!idToken) {
      throw new Error('No ID token received');
    }

    // Decode JWT (without verification for now, since we got it directly from the provider)
    const claims = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    console.log('User claims:', claims);
    
    const userInfo = {
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
      preferred_username: claims.preferred_username,
    };

    const jwtToken = jwt.sign(userInfo, JWT_SECRET, { expiresIn: '1h' });

    // Redirect to frontend with token
    const redirectUrl = `${FRONTEND_URL}/auth-landing?token=${jwtToken}`;
    console.log('Redirecting to frontend with token:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Callback error details:', error);
    res.status(500).json({ 
      error: 'Authentication callback failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Logout endpoint
app.post('/auth/logout', (req: Request, res: Response) => {
  // In a real app, you might want to revoke tokens or clear sessions
  res.json({ message: 'Logged out successfully' });
});

// Protected route middleware helper
const requireAuth = (req: Request, res: Response, next: Function) => {
  jwtMiddleware(req, res, (err: any) => {
    if (err) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });
};

// API Routes

// Health check endpoint (public)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'week1-api'
  });
});

// Hello world endpoint (now protected)
app.get('/', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).auth; // JWT payload
  res.json({
    message: `Hello ${user?.name || 'User'} from Week 1 MindX API!`,
    user: user,
    timestamp: new Date().toISOString()
  });
});

// Hello endpoint with optional name parameter (now protected)
app.get('/hello/:name?', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).auth; // JWT payload
  const name = req.params.name || user?.name || 'World';
  res.json({
    message: `Hello ${name} from Week 1 MindX API!`,
    user: user,
    timestamp: new Date().toISOString()
  });
});

// User profile endpoint (protected)
app.get('/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).auth;
  res.json({
    user: user,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, async () => {
  await initializeOIDC();
  console.log(`🚀 Week 1 API server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/auth/login`);
  console.log(`👋 Protected hello world: http://localhost:${PORT}/`);
});