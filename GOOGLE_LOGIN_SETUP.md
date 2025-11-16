# Google Login Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Install Required Package
```bash
pip install google-auth
```

### Step 2: Get Google Client ID

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "Ordinare" → Create

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Ordinare Web Client"
   
5. **Configure Authorized Origins**
   - Authorized JavaScript origins:
     ```
     http://localhost:5000
     http://127.0.0.1:5000
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5000
     http://127.0.0.1:5000
     ```

6. **Copy Client ID**
   - Copy the Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)

### Step 3: Set Environment Variable

**Windows Command Prompt:**
```cmd
set GOOGLE_CLIENT_ID=your_client_id_here
python app.py
```

**Windows PowerShell:**
```powershell
$env:GOOGLE_CLIENT_ID="your_client_id_here"
python app.py
```

**Linux/Mac:**
```bash
export GOOGLE_CLIENT_ID=your_client_id_here
python app.py
```

### Step 4: Test Google Login

1. Open: http://127.0.0.1:5000
2. Click "Login" or "Sign Up"
3. Click "Continue with Google"
4. Select your Google account
5. You're logged in! ✓

## How It Works

### User Flow

1. **User clicks "Continue with Google"**
2. **Google popup appears** for account selection
3. **User selects account** and grants permission
4. **Google returns token** to your app
5. **Backend verifies token** with Google
6. **User info extracted** (email, name, picture)
7. **Account created/logged in** automatically

### First-Time Users
- Username generated from email (e.g., `john` from `john@gmail.com`)
- Random secure password assigned
- Email marked as verified
- Profile auto-filled with Google name

### Returning Users
- Recognized by Google ID
- Instant login
- No password needed

## Features

✅ **One-Click Login** - No password to remember
✅ **Auto Account Creation** - New users signed up automatically
✅ **Email Verified** - Google accounts are pre-verified
✅ **Secure** - Token verified with Google servers
✅ **Profile Picture** - Google avatar imported
✅ **Fast** - Login in 2 seconds

## API Endpoint

### POST /google_login
```json
{
  "credential": "google_jwt_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "username": "john"
}
```

## Security

- ✅ Token verified with Google servers
- ✅ No password stored for OAuth users
- ✅ Email automatically verified
- ✅ Secure session management
- ✅ HTTPS recommended for production

## Troubleshooting

### "Google login not configured"
**Solution:** Set `GOOGLE_CLIENT_ID` environment variable

### "Invalid token"
**Causes:**
- Wrong Client ID
- Token expired
- Network issues

**Solution:**
- Verify Client ID is correct
- Try again
- Check internet connection

### "Redirect URI mismatch"
**Solution:** Add your URL to authorized origins in Google Console:
- http://localhost:5000
- http://127.0.0.1:5000

### Google popup blocked
**Solution:** Allow popups for localhost in browser settings

## Production Deployment

### 1. Add Production URLs
In Google Cloud Console, add:
```
https://yourdomain.com
https://www.yourdomain.com
```

### 2. Use HTTPS
Google OAuth requires HTTPS in production

### 3. Environment Variable
```bash
export GOOGLE_CLIENT_ID=your_production_client_id
```

### 4. Update Consent Screen
- Add logo
- Add privacy policy URL
- Add terms of service URL
- Submit for verification (optional)

## Disable Google Login

To disable Google login:
```bash
# Don't set GOOGLE_CLIENT_ID
python app.py
```

Buttons will show "not configured" message.

## Testing

### Test Without Google (Default)
```bash
python app.py
# Google login shows "not configured" message
```

### Test With Google
```bash
set GOOGLE_CLIENT_ID=your_client_id
python app.py
# Google login works
```

## Files Modified

1. **`google_oauth.py`** (NEW)
   - GoogleOAuth class
   - Token verification
   - User creation from Google data

2. **`app.py`**
   - `/google_login` endpoint
   - Google OAuth initialization
   - Client ID configuration

3. **`templates/landing.html`**
   - Google Sign-In script
   - OAuth callback handler
   - Updated buttons

4. **`requirements.txt`**
   - Added `google-auth>=2.23.0`

## Quick Enable Script

Create `enable_google_login.bat`:
```batch
@echo off
set /p GOOGLE_CLIENT_ID="Enter Google Client ID: "
python app.py
```

Double-click to run!

## Support

**Need help?**
- Check Google Cloud Console for errors
- Verify Client ID is correct
- Ensure authorized origins are set
- Test with incognito mode

---

**Made with 🔐 for secure authentication**
