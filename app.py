# app.py

# app.py

import os
import json
import base64
from io import BytesIO
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# --- App Configuration ---
app = Flask(__name__)
# IMPORTANT: Change this secret key for production
app.secret_key = 'your_very_secret_key_for_sessions'
# Directory to store user data files (our simple JSON database)
DATA_DIR = 'user_data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# --- Helper Functions ---
def get_user_filepath(username):
    """Returns the path to a user's JSON data file."""
    return os.path.join(DATA_DIR, f"{username}.json")

# --- Main Route ---
@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

# --- Authentication Routes ---
@app.route('/signup', methods=['POST'])
def signup():
    """Handles new user registration with password hashing."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'})

    user_file = get_user_filepath(username)
    if os.path.exists(user_file):
        return jsonify({'success': False, 'message': 'Username already exists.'})

    # Create a new user file with hashed password
    default_data = {
        'password': generate_password_hash(password),
        'app_data': {}
    }
    with open(user_file, 'w') as f:
        json.dump(default_data, f)
    
    return jsonify({'success': True})

@app.route('/login', methods=['POST'])
def login():
    """Handles user login by checking the hashed password."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user_file = get_user_filepath(username)
    if not os.path.exists(user_file):
        return jsonify({'success': False, 'message': 'Username not found.'})

    with open(user_file, 'r') as f:
        user_data = json.load(f)
    
    if check_password_hash(user_data.get('password', ''), password):
        session['username'] = username
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Incorrect password.'})

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'success': True})

@app.route('/check_auth')
def check_auth():
    if 'username' in session:
        return jsonify({'authenticated': True, 'username': session['username']})
    return jsonify({'authenticated': False})

# --- Data Handling Routes ---
@app.route('/save_data', methods=['POST'])
def save_data():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user_file = get_user_filepath(username)
    
    # Read existing data first
    try:
        with open(user_file, 'r') as f:
            user_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # If file doesn't exist or is corrupt, start fresh but keep password
        user_data = {'password': ''} # This should be handled better in a real app

    user_data['app_data'] = request.json
    
    with open(user_file, 'w') as f:
        json.dump(user_data, f, indent=4)
        
    return jsonify({'success': True})

@app.route('/get_data')
def get_data():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    username = session['username']
    user_file = get_user_filepath(username)

    if not os.path.exists(user_file):
        return jsonify({'success': False, 'message': 'No data found for user.'}), 404

    with open(user_file, 'r') as f:
        user_data = json.load(f)
        
    return jsonify({'success': True, 'data': user_data.get('app_data', {})})

@app.route('/clear_data', methods=['POST'])
def clear_data():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user_file = get_user_filepath(username)

    if os.path.exists(user_file):
        with open(user_file, 'r') as f:
            user_data = json.load(f)
        
        user_data['app_data'] = {}  # Clear the app_data field
        
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=4)
            
    return jsonify({'success': True})

@app.route('/upload_attendance', methods=['POST'])
def upload_attendance():
    """Handles Excel file upload and updates attendance data."""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    if 'file' not in request.files or request.files['file'].filename == '':
        return jsonify({'success': False, 'message': 'No file selected'})

    file = request.files['file']
    try:
        df = pd.read_excel(file)
        
        # Get current user data
        username = session['username']
        user_file = get_user_filepath(username)
        with open(user_file, 'r') as f:
            user_data = json.load(f)
        
        app_data = user_data.get('app_data', {})
        subjects = app_data.get('subjects', [])
        attendance_data = app_data.get('attendanceData', {})
        
        # Create a map of subject name to subject ID for easy lookup
        subject_name_to_id = {subj['name'].lower(): str(subj['id']) for subj in subjects}
        
        records_added = 0
        for index, row in df.iterrows():
            subject_name = str(row.get('Subject', '')).lower()
            date_obj = pd.to_datetime(row.get('Date'))
            date_str = date_obj.strftime('%Y-%m-%d') if pd.notnull(date_obj) else None
            time_slot = str(row.get('Time Slot', ''))
            status = str(row.get('Status', '')).lower()
            
            if not all([subject_name, date_str, time_slot, status in ['present', 'absent']]):
                continue # Skip rows with incomplete data

            subject_id = subject_name_to_id.get(subject_name)
            if not subject_id:
                continue # Skip if subject from Excel isn't in user's subject list

            # Ensure attendance data structure exists for the subject
            if subject_id not in attendance_data:
                attendance_data[subject_id] = {'total': 0, 'attended': 0, 'records': []}

            # Create a unique key to prevent duplicate entries
            record_key = f"{subject_id}-{date_str}-{time_slot}"
            existing_keys = [rec['key'] for rec in attendance_data[subject_id].get('records', [])]

            if record_key not in existing_keys:
                attendance_data[subject_id]['total'] += 1
                if status == 'present':
                    attendance_data[subject_id]['attended'] += 1
                
                attendance_data[subject_id]['records'].append({'key': record_key, 'status': status})
                records_added += 1

        # Save the updated data
        user_data['app_data']['attendanceData'] = attendance_data
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=4)
            
        return jsonify({'success': True, 'message': f'Successfully added {records_added} new attendance records.'})

    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {str(e)}'})


@app.route('/get_attendance_plot')
def get_attendance_plot():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user_file = get_user_filepath(username)
    if not os.path.exists(user_file):
        return jsonify({'success': False, 'message': 'No data found for user.'})

    with open(user_file, 'r') as f:
        user_data = json.load(f)
    
    app_data = user_data.get('app_data', {})
    subjects = app_data.get('subjects', [])
    attendance_data = app_data.get('attendanceData', {})

    if not subjects or not attendance_data:
        return jsonify({'success': False, 'message': 'No attendance data to plot.'})

    subject_names = [s['name'] for s in subjects]
    percentages = []
    for subject in subjects:
        subject_id = str(subject['id'])
        data = attendance_data.get(subject_id, {'total': 0, 'attended': 0})
        total = data.get('total', 0)
        attended = data.get('attended', 0)
        percentage = (attended / total * 100) if total > 0 else 0
        percentages.append(percentage)

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(subject_names, percentages, color='#006b2f')
    ax.set_ylabel('Attendance Percentage (%)')
    ax.set_title('Subject-wise Attendance Percentage')
    ax.set_ylim(0, 105)
    plt.xticks(rotation=45, ha='right')

    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2.0, yval + 1, f'{yval:.1f}%', ha='center', va='bottom')

    plt.tight_layout()

    buf = BytesIO()
    fig.savefig(buf, format="png")
    image_data = base64.b64encode(buf.getbuffer()).decode("ascii")
    
    return jsonify({'success': True, 'image': image_data})

# --- Run the App ---
if __name__ == '__main__':
    app.run(debug=True)

# Requirements:
# pandas
# matplotlib
# flask
# werkzeug