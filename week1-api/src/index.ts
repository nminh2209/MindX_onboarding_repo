import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { expressjwt } from 'express-jwt';
import * as openid from 'openid-client';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// OpenID Connect Configuration
const OIDC_ISSUER_URL = 'https://id-dev.mindx.edu.vn';
const OIDC_CLIENT_ID = 'mindx-onboarding';
const OIDC_CLIENT_SECRET = 'cHJldmVudGJvdW5kYmF0dHJlZWV4cGxvcmVjZWxsbmVydm91c3ZhcG9ydGhhbnN0ZWU';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';

// JWT Secret for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// OpenID Client instance (Configuration object)
let oidcConfig: any;
let authorizationEndpoint: string = '';

// Middleware
app.use(express.json());

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
    if (!oidcConfig) {
      return res.status(500).json({ error: 'OpenID client not initialized' });
    }

    const params = oidcConfig.callbackParams(req);
    const tokenSet = await oidcConfig.callback(REDIRECT_URI, params, {
      expectedState: req.query.state as string,
    });

    // Create JWT token with user info
    const claims = tokenSet.claims();
    const userInfo = {
      sub: claims?.sub,
      email: claims?.email,
      name: claims?.name,
      preferred_username: claims?.preferred_username,
    };

    const jwtToken = jwt.sign(userInfo, JWT_SECRET, { expiresIn: '1h' });

    // Redirect to frontend with token
    res.redirect(`https://mindx-minhnh.135.171.192.18.nip.io/?token=${jwtToken}`);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: 'Authentication callback failed' });
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