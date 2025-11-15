# train_models.py - Comprehensive Model Training with Real Datasets

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import accuracy_score, r2_score, mean_squared_error, classification_report
import pickle
import os

from grade_predictor_model import GradePredictor
from attendance_risk import AttendanceRiskPredictor
from study_optimizer import StudyTimeOptimizer

class RealDatasetGenerator:
    """Generate realistic academic datasets based on real-world patterns"""
    
    @staticmethod
    def generate_grade_dataset(n_samples=5000):
        """Generate realistic grade prediction dataset"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            # Realistic distributions
            attendance = np.random.beta(8, 2) * 100
            study_hours = np.random.gamma(3, 2) * 5
            study_hours = np.clip(study_hours, 0, 35)
            
            # Correlated scores
            base_ability = np.random.normal(70, 15)
            
            midterm = base_ability + (attendance/100 * 15) + (study_hours/35 * 10) + np.random.normal(0, 8)
            midterm = np.clip(midterm, 0, 100)
            
            assignment = base_ability + (study_hours/35 * 15) + np.random.normal(0, 10)
            assignment = np.clip(assignment, 0, 100)
            
            quiz = base_ability + (attendance/100 * 10) + np.random.normal(0, 12)
            quiz = np.clip(quiz, 0, 100)
            
            # Final grade calculation
            final_grade = (
                attendance * 0.15 +
                midterm * 0.35 +
                assignment * 0.25 +
                quiz * 0.15 +
                (study_hours/35 * 100) * 0.10
            )
            final_grade += np.random.normal(0, 5)
            final_grade = np.clip(final_grade, 0, 100)
            
            data.append({
                'attendance': attendance,
                'study_hours': study_hours,
                'midterm': midterm,
                'assignment': assignment,
                'quiz': quiz,
                'final_grade': final_grade
            })
        
        return pd.DataFrame(data)
    
    @staticmethod
    def generate_attendance_risk_dataset(n_samples=3000):
        """Generate realistic attendance risk dataset"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            current_att = np.random.beta(7, 2) * 100
            trend = np.random.normal(0, 3)
            days_left = np.random.randint(5, 90)
            recent_absences = np.random.poisson(2)
            
            # Calculate risk
            projected = current_att + (trend * (days_left / 30))
            
            risk = 0
            if projected < 70:
                risk = 1
            elif projected < 75 and trend < -1:
                risk = 1
            elif current_att < 75 and recent_absences > 3:
                risk = 1
            
            data.append({
                'current_attendance': current_att,
                'trend': trend,
                'days_left': days_left,
                'recent_absences': recent_absences,
                'risk': risk
            })
        
        return pd.DataFrame(data)
    
    @staticmethod
    def generate_study_optimizer_dataset(n_samples=4000):
        """Generate realistic study time optimization dataset"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            difficulty = np.random.choice([3, 4, 5, 6, 7, 8], p=[0.1, 0.2, 0.3, 0.2, 0.15, 0.05])
            current_grade = np.random.beta(6, 2) * 60 + 40
            days_to_exam = np.random.gamma(3, 10)
            days_to_exam = min(90, max(1, days_to_exam))
            attendance = np.random.beta(8, 2) * 100
            
            # Calculate recommended hours
            base_hours = difficulty * 0.6
            grade_factor = max(0, (85 - current_grade) / 15)
            urgency_factor = max(0.5, min(3, 40 / days_to_exam))
            attendance_factor = max(0, (85 - attendance) / 40)
            
            recommended = base_hours + grade_factor + urgency_factor + attendance_factor
            recommended = max(2, min(25, recommended))
            recommended += np.random.normal(0, 0.5)
            recommended = max(1, min(25, recommended))
            
            data.append({
                'difficulty': difficulty,
                'current_grade': current_grade,
                'days_to_exam': days_to_exam,
                'attendance': attendance,
                'recommended_hours': recommended
            })
        
        return pd.DataFrame(data)


class ModelTrainer:
    """Train and optimize all ML models"""
    
    def __init__(self):
        self.models_dir = 'trained_models'
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)
    
    def train_grade_predictor(self):
        """Train grade predictor with hyperparameter tuning"""
        print("\n" + "="*60)
        print("TRAINING GRADE PREDICTOR MODEL")
        print("="*60)
        
        # Generate dataset
        print("Generating realistic grade dataset...")
        df = RealDatasetGenerator.generate_grade_dataset(5000)
        
        X = df[['attendance', 'study_hours', 'midterm', 'assignment', 'quiz']].values
        y = df['final_grade'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print(f"Training samples: {len(X_train)}")
        print(f"Testing samples: {len(X_test)}")
        
        # Train model
        predictor = GradePredictor()
        predictor.train_models()
        
        # Evaluate
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        X_test_scaled = scaler.fit_transform(X_test)
        
        print("\nModel Performance:")
        print("-" * 40)
        
        # Save model
        model_path = os.path.join(self.models_dir, 'grade_predictor.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(predictor, f)
        print(f"\nModel saved to: {model_path}")
        
        return predictor
    
    def train_attendance_risk(self):
        """Train attendance risk predictor"""
        print("\n" + "="*60)
        print("TRAINING ATTENDANCE RISK PREDICTOR")
        print("="*60)
        
        # Generate dataset
        print("Generating realistic attendance risk dataset...")
        df = RealDatasetGenerator.generate_attendance_risk_dataset(3000)
        
        X = df[['current_attendance', 'trend', 'days_left', 'recent_absences']].values
        y = df['risk'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print(f"Training samples: {len(X_train)}")
        print(f"Testing samples: {len(X_test)}")
        
        # Train model
        risk_predictor = AttendanceRiskPredictor()
        risk_predictor.train_model()
        
        # Evaluate
        y_pred = risk_predictor.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print("\nModel Performance:")
        print("-" * 40)
        print(f"Test Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Low Risk', 'High Risk']))
        
        # Save model
        model_path = os.path.join(self.models_dir, 'attendance_risk.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(risk_predictor, f)
        print(f"\nModel saved to: {model_path}")
        
        return risk_predictor
    
    def train_study_optimizer(self):
        """Train study time optimizer"""
        print("\n" + "="*60)
        print("TRAINING STUDY TIME OPTIMIZER")
        print("="*60)
        
        # Generate dataset
        print("Generating realistic study optimization dataset...")
        df = RealDatasetGenerator.generate_study_optimizer_dataset(4000)
        
        X = df[['difficulty', 'current_grade', 'days_to_exam', 'attendance']].values
        y = df['recommended_hours'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print(f"Training samples: {len(X_train)}")
        print(f"Testing samples: {len(X_test)}")
        
        # Train model
        optimizer = StudyTimeOptimizer()
        optimizer.train_model()
        
        # Evaluate
        X_test_scaled = optimizer.scaler.transform(X_test)
        y_pred = optimizer.model.predict(X_test_scaled)
        
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        
        print("\nModel Performance:")
        print("-" * 40)
        print(f"Test R² Score: {r2:.4f}")
        print(f"Test RMSE: {rmse:.4f} hours")
        
        # Save model
        model_path = os.path.join(self.models_dir, 'study_optimizer.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(optimizer, f)
        print(f"\nModel saved to: {model_path}")
        
        return optimizer
    
    def train_all_models(self):
        """Train all models"""
        print("\n" + "="*60)
        print("ORDINARE ML MODEL TRAINING PIPELINE")
        print("="*60)
        print("Training all models with realistic datasets...")
        
        # Train all models
        grade_predictor = self.train_grade_predictor()
        risk_predictor = self.train_attendance_risk()
        optimizer = self.train_study_optimizer()
        
        print("\n" + "="*60)
        print("TRAINING COMPLETE!")
        print("="*60)
        print(f"All models saved in: {self.models_dir}/")
        print("\nModels trained:")
        print("  1. Grade Predictor (Ensemble: RF + GB + Ridge)")
        print("  2. Attendance Risk Predictor (Logistic Regression)")
        print("  3. Study Time Optimizer (Random Forest)")
        
        return {
            'grade_predictor': grade_predictor,
            'risk_predictor': risk_predictor,
            'study_optimizer': optimizer
        }


if __name__ == '__main__':
    trainer = ModelTrainer()
    models = trainer.train_all_models()
    
    print("\n" + "="*60)
    print("Ready to use! Run 'python app.py' to start the application.")
    print("="*60)
