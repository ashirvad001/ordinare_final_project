# attendance_risk.py - Attendance Risk Prediction Module

import numpy as np
from sklearn.linear_model import LogisticRegression
from datetime import datetime, timedelta

class AttendanceRiskPredictor:
    def __init__(self):
        self.model = LogisticRegression(random_state=42)
        self.threshold = 75  # Default attendance threshold
        self.train_model()
    
    def train_model(self):
        """Train model with synthetic data"""
        np.random.seed(42)
        X = []
        y = []
        
        # Generate more diverse training data
        for _ in range(2000):
            current_att = np.random.beta(7, 2) * 100
            trend = np.random.normal(0, 3)
            days_left = np.random.randint(5, 90)
            recent_absences = np.random.poisson(2)
            
            projected = current_att + (trend * (days_left / 30))
            risk_score = 0
            
            if projected < 70:
                risk_score = 1
            elif projected < 75 and trend < -1:
                risk_score = 1
            elif current_att < 75 and recent_absences > 3:
                risk_score = 1
            
            X.append([current_att, trend, days_left, recent_absences])
            y.append(risk_score)
        
        self.model = LogisticRegression(random_state=42, max_iter=1000, C=1.0, solver='lbfgs')
        self.model.fit(X, y)
        
        from sklearn.model_selection import cross_val_score
        scores = cross_val_score(self.model, X, y, cv=5)
        print(f"Attendance Risk Model - CV Accuracy: {scores.mean():.4f} (+/- {scores.std():.4f})")
    
    def analyze_risk(self, subjects_data, attendance_data):
        """Analyze attendance risk for all subjects"""
        results = []
        
        for subject in subjects_data:
            subject_id = str(subject['id'])
            data = attendance_data.get(subject_id, {'total': 0, 'attended': 0, 'records': []})
            
            if data['total'] == 0:
                continue
            
            current_percentage = (data['attended'] / data['total']) * 100
            
            # Calculate trend from recent records
            recent_records = data.get('records', [])[-10:]
            if len(recent_records) >= 3:
                recent_attended = sum(1 for r in recent_records if r['status'] == 'present')
                trend = (recent_attended / len(recent_records) * 100) - current_percentage
            else:
                trend = 0
            
            # Estimate days left in semester (assume 90 days)
            days_left = 60
            
            # Count recent absences
            recent_absences = sum(1 for r in recent_records if r['status'] == 'absent')
            
            # Predict risk
            features = [[current_percentage, trend, days_left, recent_absences]]
            risk_prob = self.model.predict_proba(features)[0][1]
            
            # Calculate projections
            projected_percentage = self.calculate_projection(
                current_percentage, data['total'], trend, days_left
            )
            
            # Determine risk level
            if current_percentage < 70:
                risk_level = 'High'
                color = 'danger'
            elif current_percentage < 75:
                risk_level = 'Medium'
                color = 'warning'
            elif risk_prob > 0.3:
                risk_level = 'Medium'
                color = 'warning'
            else:
                risk_level = 'Low'
                color = 'success'
            
            # Generate recommendations
            recommendations = self.generate_recommendations(
                current_percentage, projected_percentage, data['total'], trend
            )
            
            results.append({
                'subject_name': subject['name'],
                'current_percentage': round(current_percentage, 1),
                'projected_percentage': round(projected_percentage, 1),
                'risk_level': risk_level,
                'risk_probability': round(risk_prob * 100, 1),
                'color': color,
                'trend': round(trend, 1),
                'total_classes': data['total'],
                'attended': data['attended'],
                'recommendations': recommendations
            })
        
        return sorted(results, key=lambda x: x['risk_probability'], reverse=True)
    
    def calculate_projection(self, current_pct, total_classes, trend, days_left):
        """Project future attendance percentage"""
        # Estimate future classes (assume 1 class per 3 days)
        future_classes = days_left // 3
        
        # Project based on trend
        if trend >= 0:
            # Positive trend - assume 90% attendance
            future_attended = future_classes * 0.9
        else:
            # Negative trend - assume 70% attendance
            future_attended = future_classes * 0.7
        
        current_attended = (current_pct / 100) * total_classes
        total_future = total_classes + future_classes
        projected = ((current_attended + future_attended) / total_future) * 100
        
        return projected
    
    def generate_recommendations(self, current_pct, projected_pct, total_classes, trend):
        """Generate actionable recommendations"""
        recommendations = []
        
        if current_pct < 75:
            classes_needed = self.calculate_classes_needed(current_pct, total_classes, 75)
            recommendations.append({
                'type': 'urgent',
                'icon': 'exclamation-triangle',
                'text': f'Attend next {classes_needed} classes without fail to reach 75%'
            })
        
        if projected_pct < 75:
            recommendations.append({
                'type': 'warning',
                'icon': 'calendar-x',
                'text': 'Projected to fall below 75% - avoid further absences'
            })
        
        if trend < -2:
            recommendations.append({
                'type': 'warning',
                'icon': 'graph-down',
                'text': 'Declining trend detected - improve attendance immediately'
            })
        
        if current_pct >= 75 and projected_pct >= 75:
            safe_bunks = self.calculate_safe_bunks(current_pct, total_classes, 75)
            if safe_bunks > 0:
                recommendations.append({
                    'type': 'success',
                    'icon': 'check-circle',
                    'text': f'You can safely miss {safe_bunks} more class(es)'
                })
            else:
                recommendations.append({
                    'type': 'info',
                    'icon': 'info-circle',
                    'text': 'Maintain current attendance to stay above threshold'
                })
        
        return recommendations
    
    def calculate_classes_needed(self, current_pct, total_classes, target_pct):
        """Calculate classes needed to reach target"""
        current_attended = (current_pct / 100) * total_classes
        classes_needed = 0
        
        while classes_needed < 100:
            new_total = total_classes + classes_needed
            new_attended = current_attended + classes_needed
            new_pct = (new_attended / new_total) * 100
            
            if new_pct >= target_pct:
                return classes_needed
            classes_needed += 1
        
        return classes_needed
    
    def calculate_safe_bunks(self, current_pct, total_classes, target_pct):
        """Calculate safe bunks without falling below target"""
        current_attended = (current_pct / 100) * total_classes
        bunks = 0
        
        while bunks < 50:
            new_total = total_classes + bunks + 1
            new_pct = (current_attended / new_total) * 100
            
            if new_pct < target_pct:
                return bunks
            bunks += 1
        
        return bunks
