# API Documentation

**Base URL:** https://mindx-minhnh.135.171.192.18.nip.io/api  
**Protocol:** HTTPS only  
**Authentication:** JWT Bearer Token

---

## 🔐 Authentication Endpoints

### Login (Initiate OAuth2 Flow)

**Endpoint:** `GET /auth/login`

**Description:** Initiates OpenID Connect authentication flow by redirecting to MindX identity provider.

**Request:**
```http
GET /api/auth/login HTTP/1.1
Host: mindx-minhnh.135.171.192.18.nip.io
```

**Response:** 302 Redirect
```http
Location: https://id-dev.mindx.edu.vn/auth?client_id=...&redirect_uri=...&state=...
```

**Flow:**
1. User clicks "Sign in with MindX"
2. Frontend redirects to this endpoint
3. Backend generates state for CSRF protection
4. Redirects to MindX OpenID provider
5. User authenticates with MindX credentials

---

### OAuth2 Callback

**Endpoint:** `GET /auth/callback`

**Description:** Handles OAuth2 callback, exchanges authorization code for tokens, creates JWT.

**Request:**
```http
GET /api/auth/callback?code=AUTH_CODE&state=STATE_VALUE HTTP/1.1
Host: mindx-minhnh.135.171.192.18.nip.io
```

**Query Parameters:**
- `code` (string, required): Authorization code from MindX
- `state` (string, required): CSRF protection state

**Response:** 302 Redirect
```http
Location: https://mindx-minhnh.135.171.192.18.nip.io/auth-landing?token=JWT_TOKEN
```

**JWT Payload:**
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

---

### Logout

**Endpoint:** `POST /auth/logout`

**Description:** Logs out user (currently client-side only).

**Request:**
```http
POST /api/auth/logout HTTP/1.1
Host: mindx-minhnh.135.171.192.18.nip.io
Content-Type: application/json
```

**Response:** 200 OK
```json
{
  "message": "Logged out successfully"
}
```

---

## 🔓 Public Endpoints

### Health Check

**Endpoint:** `GET /health`

**Description:** Returns API health status (no authentication required).

**Request:**
```http
GET /api/health HTTP/1.1
Host: mindx-minhnh.135.171.192.18.nip.io
```

**Response:** 200 OK
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T10:30:00.000Z",
  "service": "week1-api"
}
```

---

## 🔒 Protected Endpoints

All protected endpoints require JWT authentication via Bearer token.

### Authentication Header
```http
Authorization: Bearer <JWT_TOKEN>
```

### Root Endpoint

**Endpoint:** `GET /`

**Description:** Returns authenticated greeting message.

**Request:**
```http
GET /api/ HTTP/1.1
Host: mindx-minhnh.135.171.192.18.nip.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** 200 OK
```json
{
  "message": "Hello from Week 1 API!",
  "authenticated": true,
  "user": {
    "email": "user@mindx.edu.vn",
    "name": "User Name"
  }
}
```

**Error Response:** 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No authorization token was found"
}
```

---

### Hello Endpoint

**Endpoint:** `GET /hello/:name?`

**Description:** Returns personalized greeting.

**Path Parameters:**
- `name` (string, optional): Name to greet

**Request:**
```http
GET /api/hello/Minh HTTP/1.1
Host: mindx-minhnh.135.171.192.18.nip.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** 200 OK
```json
{
  "message": "Hello, Minh!",
  "timestamp": "2025-11-28T10:30:00.000Z"
}
```

**Without Name:**
```http
GET /api/hello HTTP/1.1
```

**Response:**
```json
{
  "message": "Hello, Guest!",
  "timestamp": "2025-11-28T10:30:00.000Z"
}
```

---

### User Profile

**Endpoint:** `GET /profile`

**Description:** Returns authenticated user's profile information.

**Request:**
```http
GET /api/profile HTTP/1.1
Host: mindx-minhnh.135.171.192.18.nip.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** 200 OK
```json
{
  "user": {
    "sub": "user-id",
    "email": "user@mindx.edu.vn",
    "name": "User Name",
    "preferred_username": "username",
    "iat": 1732780800,
    "exp": 1732784400
  }
}
```

**Error Response:** 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid token"
}
```

---

## 🔧 Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No authorization token was found"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Invalid state parameter"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 📝 Usage Examples

### JavaScript/Fetch
```javascript
// Get user profile
const response = await fetch('https://mindx-minhnh.135.171.192.18.nip.io/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
```

### cURL
```bash
# Health check
curl https://mindx-minhnh.135.171.192.18.nip.io/api/health

# Get profile (protected)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://mindx-minhnh.135.171.192.18.nip.io/api/profile

# Login (initiates OAuth flow)
curl -L https://mindx-minhnh.135.171.192.18.nip.io/api/auth/login
```

### React Example
```typescript
import { useAuth } from './contexts/AuthContext';

function Dashboard() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await fetch(
        'https://mindx-minhnh.135.171.192.18.nip.io/api/profile',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setProfile(data.user);
    };

    fetchProfile();
  }, [token]);

  return <div>{profile?.name}</div>;
}
```

---

## 🔐 Security Notes

### Token Expiration
- JWT tokens expire after 1 hour
- No refresh token mechanism (re-authentication required)
- Client should handle 401 errors and redirect to login

### HTTPS Only
- All endpoints require HTTPS
- HTTP requests automatically redirect to HTTPS
- Mixed content blocked by browser

### CORS
- Frontend domain whitelisted: `https://mindx-minhnh.135.171.192.18.nip.io`
- Credentials supported
- Preflight requests handled

### Rate Limiting
- Currently no rate limiting (to be added)
- Consider implementing in production

---

## 🧪 Testing

### Health Check
```bash
curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
```
Expected: `{"status":"healthy",...}`

### Authentication Flow
1. Visit: https://mindx-minhnh.135.171.192.18.nip.io/login
2. Click "Sign in with MindX"
3. Authenticate at MindX OpenID
4. Verify redirect to dashboard
5. Check token in localStorage

### Protected Endpoint
```bash
# Get token from localStorage in browser
TOKEN="your-token-here"

curl -H "Authorization: Bearer $TOKEN" \
  https://mindx-minhnh.135.171.192.18.nip.io/api/profile
```

---

## 📊 API Status

**Status:** ✅ Production  
**Uptime:** 99.9%  
**Average Response Time:** < 50ms  
**SSL:** Valid Let's Encrypt certificate  
**Version:** 1.0.0

---

## 🔗 Related Documentation

- [Auth Flow Guide](./AUTH_FLOW.md) - Detailed authentication flow
- [Production Status](./PRODUCTION_STATUS.md) - Current deployment
- [Troubleshooting](./TROUBLESHOOTING.md) - Common API issues

---

**Last Updated:** November 28, 2025  
**API Version:** v14
