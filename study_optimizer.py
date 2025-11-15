# study_optimizer.py - Study Time Optimizer Module

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class StudyTimeOptimizer:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.train_model()
    
    def train_model(self):
        """Train model with synthetic data"""
        X = []
        y = []
        
        # Generate training data
        for _ in range(3000):
            difficulty = np.random.choice([3, 4, 5, 6, 7, 8], p=[0.1, 0.2, 0.3, 0.2, 0.15, 0.05])
            current_grade = np.random.beta(6, 2) * 60 + 40
            days_to_exam = np.random.gamma(3, 10)
            days_to_exam = min(90, max(1, days_to_exam))
            attendance = np.random.beta(8, 2) * 100
            
            base_hours = difficulty * 0.6
            grade_factor = max(0, (85 - current_grade) / 15)
            urgency_factor = max(0.5, min(3, 40 / days_to_exam))
            attendance_factor = max(0, (85 - attendance) / 40)
            
            recommended = base_hours + grade_factor + urgency_factor + attendance_factor
            recommended = max(2, min(25, recommended))
            recommended += np.random.normal(0, 0.5)
            recommended = max(1, min(25, recommended))
            
            X.append([difficulty, current_grade, days_to_exam, attendance])
            y.append(recommended)
        
        X = np.array(X)
        y = np.array(y)
        
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled, y)
        
        from sklearn.model_selection import cross_val_score
        scores = cross_val_score(self.model, X_scaled, y, cv=5, scoring='r2')
        print(f"Study Optimizer Model - CV R² Score: {scores.mean():.4f} (+/- {scores.std():.4f})")
        
        self.is_trained = True
    
    def optimize_study_plan(self, subjects_data, attendance_data, study_sessions, days_to_exam=30):
        """Generate optimized study plan for all subjects"""
        recommendations = []
        
        for subject in subjects_data:
            subject_id = str(subject['id'])
            
            # Get attendance
            att_data = attendance_data.get(subject_id, {'total': 0, 'attended': 0})
            attendance_pct = (att_data['attended'] / att_data['total'] * 100) if att_data['total'] > 0 else 75
            
            # Get study time
            subject_sessions = [s for s in study_sessions if str(s.get('subject')) == subject_id]
            total_study_mins = sum(s.get('duration', 0) for s in subject_sessions)
            total_study_hours = total_study_mins / 60
            
            # Calculate current performance estimate
            current_grade = (attendance_pct * 0.4) + 50  # Simplified estimate
            
            # Estimate difficulty based on study time vs attendance
            if total_study_hours > 0:
                difficulty = min(10, max(1, (total_study_hours / max(1, att_data['total'])) * 5))
            else:
                difficulty = 5  # Default medium difficulty
            
            # Predict recommended hours
            features = [[difficulty, current_grade, days_to_exam, attendance_pct]]
            features_scaled = self.scaler.transform(features)
            recommended_hours = self.model.predict(features_scaled)[0]
            
            # Calculate weekly breakdown
            weekly_hours = (recommended_hours / days_to_exam) * 7
            daily_hours = recommended_hours / days_to_exam
            
            # Determine priority
            if attendance_pct < 75 or current_grade < 60:
                priority = 'High'
                priority_color = 'danger'
            elif attendance_pct < 85 or current_grade < 75:
                priority = 'Medium'
                priority_color = 'warning'
            else:
                priority = 'Low'
                priority_color = 'success'
            
            # Generate insights
            insights = self.generate_insights(
                subject['name'], difficulty, current_grade, 
                attendance_pct, total_study_hours, recommended_hours
            )
            
            recommendations.append({
                'subject_name': subject['name'],
                'subject_id': subject_id,
                'difficulty': round(difficulty, 1),
                'current_grade_estimate': round(current_grade, 1),
                'attendance_pct': round(attendance_pct, 1),
                'total_study_hours': round(total_study_hours, 1),
                'recommended_total_hours': round(recommended_hours, 1),
                'weekly_hours': round(weekly_hours, 1),
                'daily_hours': round(daily_hours, 2),
                'priority': priority,
                'priority_color': priority_color,
                'insights': insights
            })
        
        # Sort by priority
        priority_order = {'High': 0, 'Medium': 1, 'Low': 2}
        recommendations.sort(key=lambda x: priority_order[x['priority']])
        
        return recommendations
    
    def generate_insights(self, subject_name, difficulty, current_grade, 
                         attendance, total_hours, recommended_hours):
        """Generate actionable insights"""
        insights = []
        
        if total_hours < recommended_hours * 0.5:
            insights.append({
                'type': 'warning',
                'icon': 'clock-history',
                'text': f'Significantly under-studied. Increase study time by {round(recommended_hours - total_hours, 1)} hours'
            })
        
        if attendance < 75:
            insights.append({
                'type': 'danger',
                'icon': 'exclamation-triangle',
                'text': 'Low attendance detected. Attend classes regularly to reduce study burden'
            })
        
        if difficulty > 7:
            insights.append({
                'type': 'info',
                'icon': 'book',
                'text': 'High difficulty subject. Consider group study or tutoring'
            })
        
        if current_grade < 60:
            insights.append({
                'type': 'danger',
                'icon': 'graph-down',
                'text': 'Critical: Immediate intensive study required'
            })
        elif current_grade >= 85:
            insights.append({
                'type': 'success',
                'icon': 'trophy',
                'text': 'Excellent performance! Maintain current study routine'
            })
        
        if not insights:
            insights.append({
                'type': 'success',
                'icon': 'check-circle',
                'text': 'On track. Continue with recommended study plan'
            })
        
        return insights
    
    def generate_weekly_schedule(self, recommendations, available_hours_per_day=4):
        """Generate a weekly study schedule"""
        schedule = {day: [] for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
        days = list(schedule.keys())
        
        # Distribute study time across week
        for rec in recommendations:
            daily_hours = rec['daily_hours']
            subject_name = rec['subject_name']
            
            # Spread across multiple days
            sessions_per_week = min(7, max(2, int(rec['weekly_hours'] / 1.5)))
            hours_per_session = rec['weekly_hours'] / sessions_per_week
            
            # Assign to days
            for i in range(sessions_per_week):
                day = days[i % 7]
                schedule[day].append({
                    'subject': subject_name,
                    'hours': round(hours_per_session, 1),
                    'priority': rec['priority']
                })
        
        return schedule
