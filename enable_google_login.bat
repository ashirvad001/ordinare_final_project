@echo off
echo ========================================
echo Google Login Setup
echo ========================================
echo.
echo Get your Google Client ID from:
echo https://console.cloud.google.com/
echo.
echo Instructions:
echo 1. Create OAuth 2.0 Client ID
echo 2. Add http://localhost:5000 to authorized origins
echo 3. Copy the Client ID
echo.

set /p GOOGLE_CLIENT_ID="Enter Google Client ID: "

echo.
echo Installing required package...
pip install google-auth

echo.
echo ========================================
echo Google Login ENABLED
echo ========================================
echo.
echo Client ID: %GOOGLE_CLIENT_ID%
echo.
echo Starting Ordinare...
echo.

python app.py

pause
