# app.py - Updated with Landing Page Support

import os
import json
import base64
from io import BytesIO
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import numpy as np
from attendance_risk import AttendanceRiskPredictor
from study_optimizer import StudyTimeOptimizer
from grade_predictor_model import GradePredictor
from google_oauth import GoogleOAuth

# --- App Configuration ---
app = Flask(__name__)
# IMPORTANT: Use environment variable in production
app.secret_key = os.environ.get('SECRET_KEY', 'your_very_secret_key_for_sessions')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
USE_GOOGLE_OAUTH = bool(GOOGLE_CLIENT_ID)

# Payment Configuration (Mock for demo)
PREMIUM_PRICE = 99  # ₹99/year
USE_MOCK_PAYMENT = True  # Set to False when Razorpay is ready

# Directory to store user data files
DATA_DIR = 'user_data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# --- Helper Functions ---
def get_user_filepath(username):
    """Returns the path to a user's JSON data file."""
    return os.path.join(DATA_DIR, f"{username}.json")

# --- Main Routes ---
@app.route('/')
def landing():
    """Serves the main page."""
    return render_template('landing.html')

@app.route('/dashboard')
def dashboard():
    """Serves the dashboard if authenticated, otherwise redirects to landing."""
    return render_template('dashboard.html')

@app.route('/grade_predictor')
def grade_predictor():
    """Serves the grade predictor page."""
    return render_template('grade_predictor.html')

@app.route('/attendance_risk')
def attendance_risk():
    """Serves the attendance risk alert page."""
    return render_template('attendance_risk.html')

@app.route('/study_optimizer')
def study_optimizer():
    """Serves the study time optimizer page."""
    return render_template('study_optimizer.html')

# Initialize Google OAuth
google_oauth = GoogleOAuth(GOOGLE_CLIENT_ID) if USE_GOOGLE_OAUTH else None

# --- Authentication Routes ---
@app.route('/signup', methods=['POST'])
def signup():
    """Handles new user registration with password hashing."""
    data = request.json
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if not username or not password or not email:
        return jsonify({'success': False, 'message': 'Email, username and password are required.'})

    user_file = get_user_filepath(username)
    if os.path.exists(user_file):
        return jsonify({'success': False, 'message': 'Username already exists.'})

    # Create a new user file with hashed password
    default_data = {
        'email': email,
        'password': generate_password_hash(password),
        'premium': False,
        'premium_expiry': None,
        'app_data': {
            'subjects': [],
            'timetable': {},
            'attendanceData': {},
            'timeSlots': ['9:00 AM-10:00 AM', '10:00 AM-11:00 AM', '11:00 AM-12:00 PM', '12:00 PM-1:00 PM',
                         '1:00 PM-2:00 PM', '2:00 PM-3:00 PM', '3:00 PM-4:00 PM', '4:00 PM-5:00 PM'],
            'studentName': '',
            'universityRollNo': '',
            'studySessions': [],
            'studyGoals': {'daily': 2, 'weekly': 14}
        }
    }
    with open(user_file, 'w') as f:
        json.dump(default_data, f, indent=4)
    
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

@app.route('/google_login', methods=['POST'])
def google_login():
    """Handle Google OAuth login"""
    if not USE_GOOGLE_OAUTH:
        return jsonify({'success': False, 'message': 'Google OAuth not configured'}), 400
    
    data = request.json
    token = data.get('credential')
    
    if not token:
        return jsonify({'success': False, 'message': 'No token provided'}), 400
    
    # Verify token
    result = google_oauth.verify_token(token)
    
    if not result['success']:
        return jsonify({'success': False, 'message': 'Invalid token'}), 401
    
    # Check if user exists
    username = google_oauth.find_user_by_google_id(result['google_id'], DATA_DIR)
    
    if not username:
        # Create new user
        username = google_oauth.create_user_from_google(result, DATA_DIR)
    
    # Log user in
    session['username'] = username
    return jsonify({'success': True, 'username': username})

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'success': True})

@app.route('/check_auth')
def check_auth():
    if 'username' in session:
        return jsonify({
            'authenticated': True, 
            'username': session['username'],
            'google_oauth_enabled': USE_GOOGLE_OAUTH,
            'google_client_id': GOOGLE_CLIENT_ID if USE_GOOGLE_OAUTH else None
        })
    return jsonify({
        'authenticated': False,
        'google_oauth_enabled': USE_GOOGLE_OAUTH,
        'google_client_id': GOOGLE_CLIENT_ID if USE_GOOGLE_OAUTH else None
    })

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
        user_data = {'password': ''}

    # Update app_data with the new data
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
    
    # Ensure study tracker fields exist
    app_data = user_data.get('app_data', {})
    if 'studySessions' not in app_data:
        app_data['studySessions'] = []
    if 'studyGoals' not in app_data:
        app_data['studyGoals'] = {'daily': 2, 'weekly': 14}
    
    # Add email and premium status to app_data
    app_data['email'] = user_data.get('email', '')
    app_data['premium'] = user_data.get('premium', False)
    app_data['premium_expiry'] = user_data.get('premium_expiry')
        
    return jsonify({'success': True, 'data': app_data})

@app.route('/clear_data', methods=['POST'])
def clear_data():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user_file = get_user_filepath(username)

    if os.path.exists(user_file):
        with open(user_file, 'r') as f:
            user_data = json.load(f)
        
        # Clear all app_data except password
        user_data['app_data'] = {
            'subjects': [],
            'timetable': {},
            'attendanceData': {},
            'timeSlots': ['9:00 AM-10:00 AM', '10:00 AM-11:00 AM', '11:00 AM-12:00 PM', '12:00 PM-1:00 PM',
                         '1:00 PM-2:00 PM', '2:00 PM-3:00 PM', '3:00 PM-4:00 PM', '4:00 PM-5:00 PM'],
            'studentName': '',
            'universityRollNo': '',
            'studySessions': [],
            'studyGoals': {'daily': 2, 'weekly': 14}
        }
        
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
        
        # Create a map of subject name to subject ID
        subject_name_to_id = {subj['name'].lower(): str(subj['id']) for subj in subjects}
        
        records_added = 0
        for index, row in df.iterrows():
            subject_name = str(row.get('Subject', '')).lower()
            date_obj = pd.to_datetime(row.get('Date'))
            date_str = date_obj.strftime('%Y-%m-%d') if pd.notnull(date_obj) else None
            time_slot = str(row.get('Time Slot', ''))
            status = str(row.get('Status', '')).lower()
            
            if not all([subject_name, date_str, time_slot, status in ['present', 'absent']]):
                continue

            subject_id = subject_name_to_id.get(subject_name)
            if not subject_id:
                continue

            if subject_id not in attendance_data:
                attendance_data[subject_id] = {'total': 0, 'attended': 0, 'records': []}

            record_key = f"{subject_id}-{date_str}-{time_slot}"
            existing_keys = [rec['key'] for rec in attendance_data[subject_id].get('records', [])]

            if record_key not in existing_keys:
                attendance_data[subject_id]['total'] += 1
                if status == 'present':
                    attendance_data[subject_id]['attended'] += 1
                
                attendance_data[subject_id]['records'].append({'key': record_key, 'status': status})
                records_added += 1

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

    # Create the plot
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(subject_names, percentages, color='#2c3e50', edgecolor='#1a252f', linewidth=2)
    
    # Customize the plot
    ax.set_ylabel('Attendance Percentage (%)', fontsize=12, fontweight='bold')
    ax.set_title('Subject-wise Attendance Percentage', fontsize=14, fontweight='bold', pad=20)
    ax.set_ylim(0, 105)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    plt.xticks(rotation=45, ha='right')

    # Add percentage labels on top of bars
    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2.0, yval + 1, 
                f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold')

    plt.tight_layout()

    # Save to buffer
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches='tight')
    plt.close(fig)
    
    image_data = base64.b64encode(buf.getbuffer()).decode("ascii")
    
    return jsonify({'success': True, 'image': image_data})

class StudyAnalytics:
    def __init__(self):
        """Initialize the Grade Predictor with ensemble models"""
        self.rf_model = RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        self.gb_model = GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.ridge_model = Ridge(alpha=1.0)
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Feature importance weights
        self.feature_weights = {
            'attendance': 0.25,
            'study_hours': 0.20,
            'midterm_scores': 0.30,
            'assignment_scores': 0.15,
            'quiz_scores': 0.10
        }
    
    def generate_synthetic_training_data(self, n_samples=1000):
        """
        Generate realistic synthetic training data based on academic patterns
        """
        np.random.seed(42)
        
        # Generate features with realistic correlations
        attendance = np.random.beta(8, 2, n_samples) * 100  # Most students have good attendance
        study_hours = np.random.gamma(3, 2, n_samples) * 5  # 0-30 hours/week, avg 15
        study_hours = np.clip(study_hours, 0, 35)
        
        # Midterm and assignment scores correlate with study habits
        midterm_base = 40 + (attendance/100 * 20) + (study_hours/35 * 20)
        midterm_scores = midterm_base + np.random.normal(0, 8, n_samples)
        midterm_scores = np.clip(midterm_scores, 0, 100)
        
        assignment_base = 50 + (attendance/100 * 25) + (study_hours/35 * 15)
        assignment_scores = assignment_base + np.random.normal(0, 10, n_samples)
        assignment_scores = np.clip(assignment_scores, 0, 100)
        
        quiz_base = 45 + (attendance/100 * 15) + (study_hours/35 * 20)
        quiz_scores = quiz_base + np.random.normal(0, 12, n_samples)
        quiz_scores = np.clip(quiz_scores, 0, 100)
        
        # Calculate final grades with weighted formula
        final_grades = (
            attendance * 0.15 +
            midterm_scores * 0.35 +
            assignment_scores * 0.25 +
            quiz_scores * 0.15 +
            (study_hours/35 * 100) * 0.10
        )
        
        # Add some realistic noise
        final_grades += np.random.normal(0, 5, n_samples)
        final_grades = np.clip(final_grades, 0, 100)
        
        X = np.column_stack([
            attendance,
            study_hours,
            midterm_scores,
            assignment_scores,
            quiz_scores
        ])
        
        return X, final_grades
    
    def train_models(self):
        """Train all models on synthetic data"""
        print("Generating training data...")
        X, y = self.generate_synthetic_training_data(n_samples=2000)
        
        print("Training models...")
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest
        self.rf_model.fit(X_scaled, y)
        rf_score = cross_val_score(self.rf_model, X_scaled, y, cv=5).mean()
        print(f"Random Forest CV Score: {rf_score:.4f}")
        
        # Train Gradient Boosting
        self.gb_model.fit(X_scaled, y)
        gb_score = cross_val_score(self.gb_model, X_scaled, y, cv=5).mean()
        print(f"Gradient Boosting CV Score: {gb_score:.4f}")
        
        # Train Ridge Regression
        self.ridge_model.fit(X_scaled, y)
        ridge_score = cross_val_score(self.ridge_model, X_scaled, y, cv=5).mean()
        print(f"Ridge Regression CV Score: {ridge_score:.4f}")
        
        self.is_trained = True
        print("All models trained successfully!")
        
        return {
            'rf_score': rf_score,
            'gb_score': gb_score,
            'ridge_score': ridge_score
        }
    
    def predict_grade(self, attendance_pct, study_hours_per_week, 
                     midterm_score, assignment_score, quiz_score):
        """
        Predict final grade using ensemble of models
        
        Parameters:
        - attendance_pct: Current attendance percentage (0-100)
        - study_hours_per_week: Average weekly study hours
        - midterm_score: Midterm exam score (0-100)
        - assignment_score: Average assignment score (0-100)
        - quiz_score: Average quiz score (0-100)
        
        Returns:
        - Dictionary with prediction, confidence, and recommendations
        """
        if not self.is_trained:
            self.train_models()
        
        # Prepare input
        X = np.array([[
            attendance_pct,
            study_hours_per_week,
            midterm_score,
            assignment_score,
            quiz_score
        ]])
        
        X_scaled = self.scaler.transform(X)
        
        # Get predictions from all models
        rf_pred = self.rf_model.predict(X_scaled)[0]
        gb_pred = self.gb_model.predict(X_scaled)[0]
        ridge_pred = self.ridge_model.predict(X_scaled)[0]
        
        # Ensemble prediction (weighted average)
        ensemble_pred = (rf_pred * 0.4 + gb_pred * 0.4 + ridge_pred * 0.2)
        ensemble_pred = np.clip(ensemble_pred, 0, 100)
        
        # Calculate confidence based on model agreement
        predictions = [rf_pred, gb_pred, ridge_pred]
        std_dev = np.std(predictions)
        confidence = max(0, min(100, 100 - (std_dev * 5)))
        
        # Generate grade letter
        grade_letter = self._get_grade_letter(ensemble_pred)
        
        # Calculate what's needed for target grades
        improvement_analysis = self._analyze_improvements(
            attendance_pct, study_hours_per_week, midterm_score, 
            assignment_score, quiz_score, ensemble_pred
        )
        
        return {
            'predicted_score': round(ensemble_pred, 2),
            'grade_letter': grade_letter,
            'confidence': round(confidence, 2),
            'model_predictions': {
                'random_forest': round(rf_pred, 2),
                'gradient_boosting': round(gb_pred, 2),
                'ridge_regression': round(ridge_pred, 2)
            },
            'improvement_analysis': improvement_analysis,
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_grade_letter(self, score):
        """Convert numerical score to letter grade"""
        if score >= 90: return 'A'
        elif score >= 80: return 'B'
        elif score >= 70: return 'C'
        elif score >= 60: return 'D'
        else: return 'F'
    
    def _analyze_improvements(self, attendance, study_hours, midterm, 
                             assignment, quiz, current_pred):
        """Analyze what improvements are needed for better grades"""
        improvements = {}
        
        # Target grades to analyze
        targets = [90, 80, 70, 60]  # A, B, C, D
        
        for target in targets:
            if target > current_pred:
                # Calculate needed improvements
                gap = target - current_pred
                
                suggestions = []
                
                # Attendance improvement
                if attendance < 95:
                    att_needed = min(100 - attendance, gap / 0.15)
                    if att_needed > 0:
                        suggestions.append({
                            'area': 'attendance',
                            'current': round(attendance, 1),
                            'needed': round(attendance + att_needed, 1),
                            'impact': round(att_needed * 0.15, 2)
                        })
                
                # Study hours improvement
                if study_hours < 25:
                    hours_increase = min(25 - study_hours, gap / (0.10 * (100/35)))
                    if hours_increase > 1:
                        suggestions.append({
                            'area': 'study_hours',
                            'current': round(study_hours, 1),
                            'needed': round(study_hours + hours_increase, 1),
                            'impact': round(hours_increase * (0.10 * (100/35)), 2)
                        })
                
                # Assignments improvement (if there are remaining assignments)
                if assignment < 95:
                    assign_needed = min(100 - assignment, gap / 0.25)
                    if assign_needed > 0:
                        suggestions.append({
                            'area': 'assignments',
                            'current': round(assignment, 1),
                            'needed': round(assignment + assign_needed, 1),
                            'impact': round(assign_needed * 0.25, 2)
                        })
                
                grade_letter = self._get_grade_letter(target)
                improvements[f'target_{grade_letter}'] = {
                    'target_score': target,
                    'points_needed': round(gap, 2),
                    'suggestions': suggestions[:3]  # Top 3 suggestions
                }
        
        return improvements
    
    def get_feature_importance(self):
        """Get feature importance from Random Forest model"""
        if not self.is_trained:
            self.train_models()
        
        feature_names = [
            'Attendance %',
            'Study Hours/Week',
            'Midterm Score',
            'Assignment Score',
            'Quiz Score'
        ]
        
        importances = self.rf_model.feature_importances_
        
        return {
            name: round(imp * 100, 2) 
            for name, imp in zip(feature_names, importances)
        }


# Flask API endpoints to add to app.py
def add_grade_predictor_routes(app, predictor):
    """
    Add these routes to your Flask app
    """
    
    @app.route('/api/predict_grade', methods=['POST'])
    def api_predict_grade():
        """API endpoint for grade prediction"""
        try:
            data = request.json
            
            # Validate inputs
            required_fields = ['attendance', 'study_hours', 'midterm', 
                             'assignment', 'quiz']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False, 
                        'message': f'Missing required field: {field}'
                    }), 400
            
            # Make prediction
            result = predictor.predict_grade(
                attendance_pct=float(data['attendance']),
                study_hours_per_week=float(data['study_hours']),
                midterm_score=float(data['midterm']),
                assignment_score=float(data['assignment']),
                quiz_score=float(data['quiz'])
            )
            
            return jsonify({'success': True, 'prediction': result})
            
        except Exception as e:
            return jsonify({
                'success': False, 
                'message': f'Error: {str(e)}'
            }), 500
    
    @app.route('/api/feature_importance')
    def api_feature_importance():
        """Get feature importance for understanding predictions"""
        try:
            importance = predictor.get_feature_importance()
            return jsonify({'success': True, 'importance': importance})
        except Exception as e:
            return jsonify({
                'success': False, 
                'message': f'Error: {str(e)}'
            }), 500
    
    @app.route('/api/train_models', methods=['POST'])
    def api_train_models():
        """Retrain models with latest data"""
        try:
            scores = predictor.train_models()
            return jsonify({
                'success': True, 
                'message': 'Models trained successfully',
                'scores': scores
            })
        except Exception as e:
            return jsonify({
                'success': False, 
                'message': f'Error: {str(e)}'
            }), 500


class StudyAnalytics:
    """ML-powered study pattern analysis and recommendations"""
    
    def analyze_productivity(self, study_sessions):
        """Analyze productivity patterns from study sessions"""
        if not study_sessions or len(study_sessions) < 3:
            return {'productivity_score': 0, 'insights': []}
        
        # Calculate metrics
        total_sessions = len(study_sessions)
        total_minutes = sum(s['duration'] for s in study_sessions)
        avg_session = total_minutes / total_sessions if total_sessions > 0 else 0
        
        # Analyze time of day patterns
        hour_performance = {}
        for session in study_sessions:
            # Estimate hour from date (simplified)
            hour = hash(session['date']) % 24
            if hour not in hour_performance:
                hour_performance[hour] = []
            hour_performance[hour].append(session['duration'])
        
        # Find best study time
        best_hour = max(hour_performance.items(), key=lambda x: np.mean(x[1]))[0] if hour_performance else 14
        best_time = f"{best_hour % 12 or 12}:00 {'PM' if best_hour >= 12 else 'AM'}"
        
        # Calculate productivity score (0-100)
        consistency = min(100, (total_sessions / 30) * 100)  # 30 sessions = 100%
        duration_score = min(100, (total_minutes / 1800) * 100)  # 30 hours = 100%
        avg_score = min(100, (avg_session / 45) * 100)  # 45 min avg = 100%
        
        productivity_score = (consistency * 0.4 + duration_score * 0.4 + avg_score * 0.2)
        
        # Generate insights
        insights = []
        if avg_session < 25:
            insights.append({'type': 'warning', 'message': 'Your average session is short. Try 25-30 minute focused sessions.'})
        elif avg_session > 60:
            insights.append({'type': 'info', 'message': 'Long sessions detected. Consider taking breaks every 45-50 minutes.'})
        else:
            insights.append({'type': 'success', 'message': 'Great session length! Keep it up.'})
        
        if total_sessions < 10:
            insights.append({'type': 'warning', 'message': 'Build consistency by studying daily, even for short periods.'})
        
        insights.append({'type': 'info', 'message': f'Your most productive time appears to be around {best_time}.'})
        
        return {
            'productivity_score': round(productivity_score, 1),
            'total_sessions': total_sessions,
            'total_hours': round(total_minutes / 60, 1),
            'avg_session_minutes': round(avg_session, 1),
            'best_study_time': best_time,
            'insights': insights
        }
    
    def recommend_next_subject(self, study_sessions, subjects, attendance_data):
        """ML-based recommendation for which subject to study next"""
        if not subjects:
            return None
        
        subject_scores = {}
        
        for subject in subjects:
            subject_id = str(subject['id'])
            score = 0
            
            # Factor 1: Low attendance (higher priority)
            attendance = attendance_data.get(subject_id, {'total': 0, 'attended': 0})
            if attendance['total'] > 0:
                att_pct = (attendance['attended'] / attendance['total']) * 100
                if att_pct < 75:
                    score += 40
                elif att_pct < 85:
                    score += 20
            
            # Factor 2: Study time (less studied = higher priority)
            subject_study_time = sum(s['duration'] for s in study_sessions if str(s['subject']) == subject_id)
            if subject_study_time == 0:
                score += 30
            elif subject_study_time < 120:  # Less than 2 hours
                score += 15
            
            # Factor 3: Recency (not studied recently = higher priority)
            recent_sessions = [s for s in study_sessions[-10:] if str(s['subject']) == subject_id]
            if not recent_sessions:
                score += 30
            
            subject_scores[subject_id] = score
        
        if not subject_scores:
            return None
        
        # Get top recommendation
        top_subject_id = max(subject_scores.items(), key=lambda x: x[1])[0]
        top_subject = next((s for s in subjects if str(s['id']) == top_subject_id), None)
        
        if top_subject:
            return {
                'subject_id': top_subject_id,
                'subject_name': top_subject['name'],
                'priority_score': subject_scores[top_subject_id],
                'reason': self._get_recommendation_reason(subject_scores[top_subject_id])
            }
        
        return None
    
    def _get_recommendation_reason(self, score):
        """Generate human-readable reason for recommendation"""
        if score >= 70:
            return 'Critical: Low attendance and minimal study time'
        elif score >= 50:
            return 'Important: Needs more attention'
        elif score >= 30:
            return 'Recommended: Balance your study time'
        else:
            return 'Optional: Keep up the good work'
    
    def predict_study_goal(self, study_sessions, target_grade='B'):
        """Predict required weekly study hours for target grade"""
        grade_hours = {'A': 25, 'B': 20, 'C': 15, 'D': 10}
        target_hours = grade_hours.get(target_grade, 20)
        
        if study_sessions:
            recent_avg = np.mean([s['duration'] for s in study_sessions[-7:]]) if len(study_sessions) >= 7 else 0
            current_weekly = (recent_avg / 60) * 7
        else:
            current_weekly = 0
        
        gap = target_hours - current_weekly
        
        return {
            'target_grade': target_grade,
            'required_weekly_hours': target_hours,
            'current_weekly_hours': round(current_weekly, 1),
            'gap_hours': round(gap, 1),
            'recommendation': f"Study {round(gap / 7, 1)} more hours per day" if gap > 0 else "You're on track!"
        }


# Initialize ML models
predictor = GradePredictor()
study_analytics = StudyAnalytics()

# Add grade predictor routes
add_grade_predictor_routes(app, predictor)

# Study Analytics API Routes
@app.route('/api/study_analytics', methods=['POST'])
def api_study_analytics():
    """Get ML-powered study analytics"""
    try:
        data = request.json
        study_sessions = data.get('study_sessions', [])
        
        analytics = study_analytics.analyze_productivity(study_sessions)
        return jsonify({'success': True, 'analytics': analytics})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/recommend_subject', methods=['POST'])
def api_recommend_subject():
    """Get AI recommendation for next subject to study"""
    try:
        data = request.json
        study_sessions = data.get('study_sessions', [])
        subjects = data.get('subjects', [])
        attendance_data = data.get('attendance_data', {})
        
        recommendation = study_analytics.recommend_next_subject(
            study_sessions, subjects, attendance_data
        )
        return jsonify({'success': True, 'recommendation': recommendation})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/study_goal_prediction', methods=['POST'])
def api_study_goal_prediction():
    """Predict required study hours for target grade"""
    try:
        data = request.json
        study_sessions = data.get('study_sessions', [])
        target_grade = data.get('target_grade', 'B')
        
        prediction = study_analytics.predict_study_goal(study_sessions, target_grade)
        return jsonify({'success': True, 'prediction': prediction})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Premium/Payment Routes ---
@app.route('/activate_premium_demo', methods=['POST'])
def activate_premium_demo():
    """Mock payment - Activate premium for demo (Remove in production)"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    try:
        from datetime import timedelta
        
        username = session['username']
        user_file = get_user_filepath(username)
        
        with open(user_file, 'r') as f:
            user_data = json.load(f)
        
        # Set premium status and expiry (1 year from now)
        expiry_date = (datetime.now() + timedelta(days=365)).isoformat()
        user_data['premium'] = True
        user_data['premium_expiry'] = expiry_date
        user_data['payment_id'] = f'DEMO_{datetime.now().strftime("%Y%m%d%H%M%S")}'
        
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=4)
        
        return jsonify({
            'success': True,
            'message': 'Premium activated successfully! (Demo Mode)',
            'expiry': expiry_date
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/check_premium')
def check_premium():
    """Check if user has active premium subscription"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    username = session['username']
    user_file = get_user_filepath(username)
    
    if not os.path.exists(user_file):
        return jsonify({'success': False, 'premium': False})
    
    with open(user_file, 'r') as f:
        user_data = json.load(f)
    
    is_premium = user_data.get('premium', False)
    expiry = user_data.get('premium_expiry')
    
    # Check if premium has expired
    if is_premium and expiry:
        expiry_date = datetime.fromisoformat(expiry)
        if datetime.now() > expiry_date:
            is_premium = False
            user_data['premium'] = False
            with open(user_file, 'w') as f:
                json.dump(user_data, f, indent=4)
    
    return jsonify({
        'success': True,
        'premium': is_premium,
        'expiry': expiry if is_premium else None
    })

@app.route('/deactivate_premium', methods=['POST'])
def deactivate_premium():
    """Deactivate premium subscription (for demo/testing)"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    try:
        username = session['username']
        user_file = get_user_filepath(username)
        
        with open(user_file, 'r') as f:
            user_data = json.load(f)
        
        user_data['premium'] = False
        user_data['premium_expiry'] = None
        
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=4)
        
        return jsonify({
            'success': True,
            'message': 'Premium deactivated successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Attendance Risk API ---
risk_predictor = AttendanceRiskPredictor()

@app.route('/api/attendance_risk')
def api_attendance_risk():
    """Get attendance risk analysis"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    try:
        username = session['username']
        user_file = get_user_filepath(username)
        
        with open(user_file, 'r') as f:
            user_data = json.load(f)
        
        app_data = user_data.get('app_data', {})
        subjects = app_data.get('subjects', [])
        attendance_data = app_data.get('attendanceData', {})
        
        if not subjects:
            return jsonify({'success': False, 'message': 'No subjects found. Please set up your subjects first.'})
        
        risks = risk_predictor.analyze_risk(subjects, attendance_data)
        
        return jsonify({'success': True, 'risks': risks})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Study Optimizer API ---
study_optimizer_model = StudyTimeOptimizer()

@app.route('/api/study_optimizer')
def api_study_optimizer():
    """Get optimized study plan"""
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    try:
        username = session['username']
        user_file = get_user_filepath(username)
        days_to_exam = int(request.args.get('days_to_exam', 30))
        
        with open(user_file, 'r') as f:
            user_data = json.load(f)
        
        app_data = user_data.get('app_data', {})
        subjects = app_data.get('subjects', [])
        attendance_data = app_data.get('attendanceData', {})
        study_sessions = app_data.get('studySessions', [])
        
        if not subjects:
            return jsonify({'success': False, 'message': 'No subjects found. Please set up your subjects first.'})
        
        recommendations = study_optimizer_model.optimize_study_plan(
            subjects, attendance_data, study_sessions, days_to_exam
        )
        
        schedule = study_optimizer_model.generate_weekly_schedule(recommendations)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'schedule': schedule
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Run the App ---
if __name__ == '__main__':
    print("\n=== Initializing Ordinare ===")
    print("Training ML models...")
    predictor.train_models()
    print("Models ready!\n")
    app.run(debug=True)

