@echo off
echo ========================================
echo Starting Ordinare with Google Login
echo ========================================
echo.

REM Set Google Client ID
set GOOGLE_CLIENT_ID=540990111942-snh6c98dmjsoi2bhmtup3oubbsgvg7rs.apps.googleusercontent.com

echo Installing google-auth package...
pip install google-auth --quiet

echo.
echo Google Login: ENABLED
echo Client ID: %GOOGLE_CLIENT_ID%
echo.
echo Starting application...
echo Open: http://127.0.0.1:5000
echo.

python app.py
