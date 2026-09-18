# Backend Configuration Guide

## Current Configuration

**Live Backend URL:** `https://onehealth-api-nsmh.onrender.com`

The frontend is now configured to use the live backend hosted on Render.

## How to Switch Between Local and Live Backend

### Currently Using: LIVE BACKEND ✅

Your `.env.local` is set to:
```env
VITE_API_BASE_URL=https://onehealth-api-nsmh.onrender.com
VITE_ENV=production
```

### To Switch Back to Local Backend:

Edit `.env.local`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_ENV=development
```

Then restart the dev server:
```bash
npm run dev
```

## Important Notes

1. **CORS Configuration**: The live backend must be configured to accept requests from `http://localhost:5173` during development.

2. **Environment Variables**: 
   - `.env.local` is git-ignored and safe for local configuration
   - `.env.example` is committed and shows the structure
   - Never commit API keys or sensitive data

3. **Proxy Setup**: The Vite dev server proxies all `/api` requests to the configured backend URL.

4. **API Endpoints**: All API calls use `/api/v1` as the base path, which gets proxied to your backend.

## Troubleshooting

### CORS Errors
If you see CORS errors, the backend needs to allow your frontend origin:
- Development: `http://localhost:5173`
- Production: Your deployed frontend URL

### Connection Refused
- Check if the backend URL is correct
- Verify the backend is running
- Check your network/firewall settings
