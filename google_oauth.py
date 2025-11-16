# google_oauth.py - Google OAuth Integration

import os
import json
from google.oauth2 import id_token
from google.auth.transport import requests
from werkzeug.security import generate_password_hash
import secrets

class GoogleOAuth:
    def __init__(self, client_id):
        self.client_id = client_id
    
    def verify_token(self, token):
        """Verify Google OAuth token and return user info"""
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                self.client_id
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return {
                'success': True,
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'google_id': idinfo['sub'],
                'email_verified': idinfo.get('email_verified', False)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_user_from_google(self, user_info, data_dir='user_data'):
        """Create user account from Google OAuth data"""
        email = user_info['email']
        google_id = user_info['google_id']
        name = user_info['name']
        
        # Generate username from email
        username = email.split('@')[0]
        base_username = username
        counter = 1
        
        # Check if username exists, add number if needed
        while os.path.exists(os.path.join(data_dir, f"{username}.json")):
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create user data
        user_data = {
            'email': email,
            'password': generate_password_hash(secrets.token_urlsafe(32)),  # Random password
            'google_id': google_id,
            'name': name,
            'picture': user_info.get('picture', ''),
            'email_verified': True,
            'oauth_provider': 'google',
            'premium': False,
            'premium_expiry': None,
            'app_data': {
                'subjects': [],
                'timetable': {},
                'attendanceData': {},
                'timeSlots': ['9:00 AM-10:00 AM', '10:00 AM-11:00 AM', '11:00 AM-12:00 PM', 
                             '12:00 PM-1:00 PM', '1:00 PM-2:00 PM', '2:00 PM-3:00 PM', 
                             '3:00 PM-4:00 PM', '4:00 PM-5:00 PM'],
                'studentName': name,
                'universityRollNo': '',
                'studySessions': [],
                'studyGoals': {'daily': 2, 'weekly': 14}
            }
        }
        
        # Save user file
        user_file = os.path.join(data_dir, f"{username}.json")
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=4)
        
        return username
    
    def find_user_by_google_id(self, google_id, data_dir='user_data'):
        """Find existing user by Google ID"""
        if not os.path.exists(data_dir):
            return None
        
        for filename in os.listdir(data_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(data_dir, filename)
                try:
                    with open(filepath, 'r') as f:
                        user_data = json.load(f)
                        if user_data.get('google_id') == google_id:
                            return filename.replace('.json', '')
                except:
                    continue
        return None
