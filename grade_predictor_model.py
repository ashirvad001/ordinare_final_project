# grade_predictor_model.py - Grade Prediction Module

import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from datetime import datetime

class GradePredictor:
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
        """Generate realistic synthetic training data based on academic patterns"""
        np.random.seed(42)
        
        # Generate features with realistic correlations
        attendance = np.random.beta(8, 2, n_samples) * 100
        study_hours = np.random.gamma(3, 2, n_samples) * 5
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
                
                # Assignments improvement
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
                    'suggestions': suggestions[:3]
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
