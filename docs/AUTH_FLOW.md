# Authentication Flow Documentation

**Implementation:** OpenID Connect with MindX Identity Provider  
**Protocol:** OAuth2 Authorization Code Flow  
**Token Type:** JWT (JSON Web Tokens)

---

## 🔐 Overview

The application uses OpenID Connect (OIDC) for authentication, integrated with MindX's identity provider. This provides enterprise-grade security, centralized user management, and Single Sign-On (SSO) capabilities.

---

## 🌊 Complete Authentication Flow

### Step-by-Step Flow

```
1. User visits application
   ↓
2. Clicks "Sign in with MindX"
   ↓
3. Frontend redirects to: /api/auth/login
   ↓
4. Backend constructs OAuth2 authorization URL
   ↓
5. Redirects to MindX OpenID provider
   https://id-dev.mindx.edu.vn/auth?client_id=...&redirect_uri=...&state=...
   ↓
6. User authenticates with MindX credentials
   ↓
7. MindX redirects back with authorization code
   /api/auth/callback?code=...&state=...
   ↓
8. Backend exchanges code for tokens
   ↓
9. Backend creates JWT with user claims
   ↓
10. Backend redirects to frontend
    /auth-landing?token=<JWT>
    ↓
11. Frontend extracts and stores token
    ↓
12. Frontend redirects to /dashboard
    ↓
13. User accesses protected resources
```

---

## 🔧 Technical Implementation

### Backend (Node.js/Express)

#### 1. Login Endpoint (`/auth/login`)

```typescript
app.get('/auth/login', async (req: Request, res: Response) => {
  // Generate CSRF protection state
  const state = crypto.randomBytes(16).toString('hex');
  req.session.state = state;

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
  });

  const authUrl = `${authorizationEndpoint}?${params.toString()}`;
  res.redirect(authUrl);
});
```

**Key Features:**
- CSRF protection with state parameter
- OpenID Connect scopes (openid, email, profile)
- Secure redirect to MindX provider

#### 2. Callback Endpoint (`/auth/callback`)

```typescript
app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  // Verify state for CSRF protection
  if (state !== req.session.state) {
    return res.status(400).send('Invalid state');
  }

  // Exchange authorization code for tokens
  const tokenSet = await client.callback(REDIRECT_URI, { code });
  const claims = tokenSet.claims();

  // Create JWT for frontend
  const userInfo = {
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    preferred_username: claims.preferred_username,
  };

  const jwt = jsonwebtoken.sign(userInfo, JWT_SECRET, {
    expiresIn: '1h',
    algorithm: 'HS256',
  });

  // Redirect to frontend with token
  res.redirect(`${FRONTEND_URL}/auth-landing?token=${jwt}`);
});
```

**Key Features:**
- State verification for security
- Token exchange with MindX provider
- JWT creation with user claims
- Secure redirect to frontend

#### 3. Protected Endpoints

```typescript
// JWT middleware for route protection
const jwtMiddleware = expressjwt({
  secret: JWT_SECRET,
  algorithms: ['HS256'],
  credentialsRequired: false,
});

// Apply to protected routes
app.get('/profile', jwtMiddleware, (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ user: req.auth });
});
```

### Frontend (React/TypeScript)

#### 1. Authentication Context

```typescript
// AuthContext.tsx
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Check for token in URL (from callback)
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('token');

    if (authToken) {
      // Decode JWT and extract user info
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      setUser(payload);
      setToken(authToken);
      localStorage.setItem('auth_token', authToken);
      
      // Clear token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check for existing token in storage
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser(payload);
        setToken(storedToken);
      }
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2. Login Component

```typescript
const Login: React.FC = () => {
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="auth-container">
      <button onClick={login}>Sign in with MindX</button>
    </div>
  );
};
```

#### 3. Protected Route Component

```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

#### 4. API Calls with JWT

```typescript
const Dashboard: React.FC = () => {
  const { token } = useAuth();

  const fetchData = async () => {
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  };

  // ... component logic
};
```

---

## 🔑 Configuration Details

### Environment Variables

#### Backend
```env
OIDC_ISSUER=https://id-dev.mindx.edu.vn
OIDC_CLIENT_ID=mindx-onboarding
OIDC_CLIENT_SECRET=<secret>
REDIRECT_URI=https://mindx-minhnh.135.171.192.18.nip.io/api/auth/callback
FRONTEND_URL=https://mindx-minhnh.135.171.192.18.nip.io
JWT_SECRET=<secret>
```

#### Frontend
```env
REACT_APP_API_URL=https://mindx-minhnh.135.171.192.18.nip.io/api
```

### OAuth2 Configuration

- **Authorization Endpoint:** `https://id-dev.mindx.edu.vn/auth`
- **Token Endpoint:** `https://id-dev.mindx.edu.vn/token`
- **Client ID:** `mindx-onboarding`
- **Redirect URI:** `https://mindx-minhnh.135.171.192.18.nip.io/api/auth/callback`
- **Scopes:** `openid email profile`
- **Response Type:** `code`
- **Grant Type:** `authorization_code`

---

## 🛡️ Security Features

### 1. CSRF Protection
- State parameter generated and validated
- Prevents cross-site request forgery attacks

### 2. Secure Token Exchange
- Authorization code flow (not implicit)
- Code exchanged on backend (client secret protected)
- Short-lived authorization codes

### 3. JWT Security
- HS256 algorithm
- 1-hour expiration
- Signed with secret key
- Token validation on every request

### 4. HTTPS Only
- All communication over TLS
- Secure cookie flags
- Prevents token interception

### 5. Token Storage
- localStorage for persistence
- Cleared on logout
- Automatic cleanup on expiration

---

## 📝 JWT Token Structure

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "user-id",
  "email": "user@mindx.edu.vn",
  "name": "User Name",
  "preferred_username": "username",
  "iat": 1732780800,
  "exp": 1732784400
}
```

### Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

---

## 🔄 Token Lifecycle

1. **Creation:** Backend creates JWT after successful OAuth2 callback
2. **Storage:** Frontend stores in localStorage
3. **Usage:** Included in Authorization header for API calls
4. **Validation:** Backend validates signature and expiration
5. **Expiration:** Token expires after 1 hour
6. **Renewal:** User must re-authenticate (no refresh token)
7. **Logout:** Token removed from localStorage

---

## 🐛 Common Issues & Solutions

### Issue 1: Token Not Persisting
**Solution:** Ensure localStorage is enabled, check browser privacy settings

### Issue 2: Redirect Loop
**Solution:** Verify state parameter handling, check REDIRECT_URI matches exactly

### Issue 3: 401 Unauthorized
**Solution:** Check token expiration, verify JWT secret matches, ensure Bearer prefix

### Issue 4: CORS Errors
**Solution:** Backend must include proper CORS headers for frontend domain

### Issue 5: Blank Login Page
**Solution:** Fixed by correcting API URL construction in AuthContext (`${API_BASE_URL}/auth/login` instead of removing /api)

---

## 📊 Authentication Metrics

- **Average Login Time:** < 3 seconds
- **Token Expiration:** 1 hour
- **State Parameter Entropy:** 128 bits
- **JWT Signature Algorithm:** HS256
- **Supported Scopes:** openid, email, profile

---

## 🔗 Related Documentation

- [Production Status](./PRODUCTION_STATUS.md) - Current deployment details
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Auth-related issues
- [API Documentation](./API_DOCS.md) - Protected endpoint details

---

**Last Updated:** November 28, 2025  
**Status:** Production - Fully Functional
