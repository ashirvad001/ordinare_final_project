# Fix Google Error 401: invalid_client

## The Problem

**Error:** `Error 401: invalid_client`

**Cause:** The OAuth Client ID is not properly configured in Google Cloud Console.

## Quick Fix (5 Minutes)

### Step 1: Go to Google Cloud Console
https://console.cloud.google.com/

### Step 2: Select/Create Project
- If you have a project: Select it
- If not: Click "New Project" → Name it "Ordinare" → Create

### Step 3: Enable Google+ API (IMPORTANT!)
1. Go to: **APIs & Services** → **Library**
2. Search: **"Google+ API"**
3. Click on it
4. Click **"ENABLE"**
5. Wait for it to enable

### Step 4: Create OAuth Client ID
1. Go to: **APIs & Services** → **Credentials**
2. Click: **"+ CREATE CREDENTIALS"**
3. Select: **"OAuth client ID"**

### Step 5: Configure OAuth Consent Screen (If Asked)
1. Click **"CONFIGURE CONSENT SCREEN"**
2. Select: **"External"** → Click **"CREATE"**
3. Fill in:
   - App name: **Ordinare**
   - User support email: **Your email**
   - Developer contact: **Your email**
4. Click **"SAVE AND CONTINUE"**
5. Skip "Scopes" → Click **"SAVE AND CONTINUE"**
6. Skip "Test users" → Click **"SAVE AND CONTINUE"**
7. Click **"BACK TO DASHBOARD"**

### Step 6: Create OAuth Client ID (Again)
1. Go to: **APIs & Services** → **Credentials**
2. Click: **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: **"Ordinare Web Client"**

### Step 7: Add Authorized Origins (CRITICAL!)
In **"Authorized JavaScript origins"**, click **"+ ADD URI"** and add:

```
http://localhost:5000
```

Click **"+ ADD URI"** again and add:

```
http://127.0.0.1:5000
```

### Step 8: Add Authorized Redirect URIs
In **"Authorized redirect URIs"**, click **"+ ADD URI"** and add:

```
http://localhost:5000
```

Click **"+ ADD URI"** again and add:

```
http://127.0.0.1:5000
```

### Step 9: Create & Copy Client ID
1. Click **"CREATE"**
2. A popup shows your credentials
3. **COPY the Client ID** (looks like: `123456-abc.apps.googleusercontent.com`)
4. Click **"OK"**

### Step 10: Update Your App

**Option A - Use the new Client ID:**

Edit `start_with_google.bat` and replace the Client ID:
```batch
set GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
```

**Option B - Use environment variable:**
```cmd
set GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
python app.py
```

### Step 11: Test Again
1. Start the app
2. Open: http://127.0.0.1:5000
3. Click "Login" → "Continue with Google"
4. Should work now! ✓

## Common Mistakes

### ❌ Mistake 1: Wrong Application Type
**Fix:** Must be "Web application", not "Desktop app" or "Mobile app"

### ❌ Mistake 2: Missing Authorized Origins
**Fix:** Must add BOTH:
- `http://localhost:5000`
- `http://127.0.0.1:5000`

### ❌ Mistake 3: Google+ API Not Enabled
**Fix:** Go to APIs & Services → Library → Enable "Google+ API"

### ❌ Mistake 4: Using Old Client ID
**Fix:** Create a NEW OAuth Client ID following steps above

### ❌ Mistake 5: OAuth Consent Screen Not Configured
**Fix:** Configure it in Step 5 above

## Verify Your Setup

### Check 1: Client ID Format
Should look like: `123456789-abc123xyz.apps.googleusercontent.com`

### Check 2: Authorized Origins
Should have:
- ✅ `http://localhost:5000`
- ✅ `http://127.0.0.1:5000`

### Check 3: Google+ API
Should be: ✅ ENABLED

### Check 4: OAuth Consent Screen
Should be: ✅ CONFIGURED

## Alternative: Disable Google Login

If you want to skip Google login for now:

**Just run:**
```bash
python app.py
```

Without setting `GOOGLE_CLIENT_ID`, the app will work fine with regular email/password login.

## Still Not Working?

### Try These:

1. **Create a BRAND NEW OAuth Client ID**
   - Delete the old one
   - Follow steps 1-9 again
   - Use the new Client ID

2. **Use Incognito Mode**
   - Clear browser cache
   - Try in incognito/private window

3. **Check Project**
   - Make sure you're in the correct Google Cloud project
   - Verify the project is active

4. **Wait 5 Minutes**
   - Sometimes changes take a few minutes to propagate
   - Restart your app after waiting

5. **Check Console Errors**
   - Open browser DevTools (F12)
   - Look for specific error messages
   - Share them for more help

## Quick Checklist

Before testing, verify:
- [ ] Google+ API is ENABLED
- [ ] OAuth Consent Screen is CONFIGURED
- [ ] OAuth Client ID is created (Web application)
- [ ] Authorized origins include `http://localhost:5000`
- [ ] Authorized origins include `http://127.0.0.1:5000`
- [ ] Client ID is copied correctly
- [ ] Client ID is set in environment variable
- [ ] App is restarted after setting Client ID

## Need Help?

If still getting Error 401:
1. Double-check ALL steps above
2. Create a NEW OAuth Client ID from scratch
3. Make sure you're using "Web application" type
4. Verify authorized origins are EXACTLY as shown

---

**Most Common Fix:** Create a NEW OAuth Client ID with correct settings!
