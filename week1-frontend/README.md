# Week 1 Frontend - React App

This is the React frontend application for Week 1 MindX Engineer Onboarding.

## Features

- React TypeScript application
- Connects to API via ingress routing
- Displays API health, root, and hello endpoints
- Responsive UI with modern styling

## API Integration

The frontend connects to the API at `http://135.171.192.18/api` (via ingress).

## Development

```bash
npm install
npm start
```

## Production Build

```bash
npm run build
```

## Docker

Build and run with Docker:

```bash
docker build -t week1-frontend .
docker run -p 3000:80 week1-frontend
```

## Kubernetes Deployment

The frontend is deployed to AKS with the following configuration:

- **Image**: `mindxweek1minhnhacr.azurecr.io/week1-frontend:v3`
- **Replicas**: 2
- **Service**: ClusterIP on port 80
- **Ingress**: Routes `/` to frontend, `/api/*` to API

## External Access

- **Frontend**: `http://135.171.192.18/`
- **API**: `http://135.171.192.18/api/*`