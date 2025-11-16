# Test Google Login

## Your Configuration

**Google Client ID:** `540990111942-snh6c98dmjsoi2bhmtup3oubbsgvg7rs.apps.googleusercontent.com`

## Quick Start

### Option 1: Use Startup Script (Easiest)
```bash
# Double-click this file:
start_with_google.bat
```

### Option 2: Manual Start
```bash
set GOOGLE_CLIENT_ID=540990111942-snh6c98dmjsoi2bhmtup3oubbsgvg7rs.apps.googleusercontent.com
python app.py
```

## Test Steps

1. **Start the app** (use one of the options above)

2. **Open browser**: http://127.0.0.1:5000

3. **Click "Login" or "Sign Up"**

4. **Look for Google button**:
   - Should see "Continue with Google" button
   - Button should have Google logo

5. **Click the Google button**:
   - Google account selection popup appears
   - Select your Google account
   - Grant permissions

6. **You should be logged in!**
   - Redirected to dashboard
   - Username created from your email

## Troubleshooting

### Issue: "Google login not configured"
**Fix:** Make sure you set the environment variable:
```bash
set GOOGLE_CLIENT_ID=540990111942-snh6c98dmjsoi2bhmtup3oubbsgvg7rs.apps.googleusercontent.com
```

### Issue: "Redirect URI mismatch"
**Fix:** Add these to Google Cloud Console:
- Authorized JavaScript origins:
  - `http://localhost:5000`
  - `http://127.0.0.1:5000`

### Issue: Google button not showing
**Possible causes:**
1. Environment variable not set
2. Internet connection issue
3. Google script blocked

**Fix:**
- Restart app with environment variable
- Check internet connection
- Disable ad blockers

### Issue: "Invalid token"
**Fix:**
- Verify Client ID is correct
- Check Google Cloud Console settings
- Try in incognito mode

## Verify Setup

### Check if Google OAuth is enabled:
```bash
# Start app and check console output
python app.py
```

Look for: "Google OAuth: ENABLED" or similar message

### Check in browser console:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any errors related to Google

## Expected Behavior

### When Working:
✅ Google button appears with logo
✅ Clicking opens Google account selector
✅ After selection, redirects to dashboard
✅ User account created automatically
✅ Email verified automatically

### When Not Working:
❌ Shows "Continue with Google" text button only
❌ Clicking shows "not configured" message
❌ No Google popup appears

## Debug Mode

Add this to check configuration:
```javascript
// In browser console
fetch('/check_auth')
  .then(r => r.json())
  .then(d => console.log('Google OAuth:', d.google_oauth_enabled, 'Client ID:', d.google_client_id))
```

## Production Setup

For production deployment:

1. **Add production URLs** to Google Console:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

2. **Use environment variable**:
   ```bash
   export GOOGLE_CLIENT_ID=540990111942-snh6c98dmjsoi2bhmtup3oubbsgvg7rs.apps.googleusercontent.com
   ```

3. **Enable HTTPS** (required for production)

## Quick Commands

### Start with Google Login:
```bash
start_with_google.bat
```

### Start without Google Login:
```bash
python app.py
```

### Check if package installed:
```bash
pip show google-auth
```

### Reinstall package:
```bash
pip install --upgrade google-auth
```

## Support

If Google login still doesn't work:

1. **Check Google Cloud Console**:
   - Verify Client ID is active
   - Check authorized origins
   - Ensure OAuth consent screen is configured

2. **Check browser console** for errors

3. **Try incognito mode** to rule out cache issues

4. **Verify internet connection**

5. **Check if popup is blocked** by browser

---

**Your Client ID is already configured in `start_with_google.bat`**

**Just double-click the file to start!** 🚀
