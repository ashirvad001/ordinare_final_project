# Ordinare - AI-Powered Smart Student Management System

![Ordinare Logo](static/ordinare-icon.png)

Ordinare is a comprehensive web-based student management system with **AI/ML-powered features** designed to help students track attendance, predict grades, optimize study time, and maximize academic performance.

## 🌟 Features

### 🎯 Active Features

#### 1. **Smart Attendance Tracking**
- Track daily attendance for all subjects
- Real-time attendance percentage calculation
- Subject-wise attendance breakdown with visual charts
- Excel file upload for bulk attendance import
- Customizable time slots with AM/PM format

#### 2. **🤖 AI-Powered Grade Predictor** ⭐ NEW
- **ML Models**: Ensemble (Random Forest + Gradient Boosting + Ridge Regression)
- **Accuracy**: 70-74% CV Score
- Predict final grades based on:
  - Attendance percentage
  - Study hours per week
  - Midterm scores
  - Assignment averages
  - Quiz scores
- **Custom Marking Scheme**: Support for different grading systems (score/max format)
- **Subject-wise Analysis**: Identify weak and strong subjects
- Confidence score for predictions
- Improvement suggestions for target grades (A, B, C)
- Model comparison visualization

#### 3. **🚨 Attendance Risk Alert** ⭐ NEW
- **ML Model**: Logistic Regression
- **Accuracy**: 93%
- Predict risk of falling below attendance threshold
- Risk levels: High, Medium, Low
- Factors analyzed:
  - Current attendance percentage
  - Recent attendance trend
  - Days left in semester
  - Recent absences pattern
- Projected attendance calculation
- Actionable recommendations
- Visual risk indicators

#### 4. **📚 Study Time Optimizer** ⭐ NEW
- **ML Model**: Random Forest Regressor
- **Accuracy**: R² Score 0.82
- AI-powered study plan recommendations
- Personalized study hours per subject
- Factors considered:
  - Subject difficulty
  - Current performance
  - Days to exam
  - Attendance percentage
- Weekly study schedule generation
- Priority-based subject recommendations
- Daily and weekly hour breakdown

#### 5. **Bunk Calculator**
- Calculate safe bunks based on target attendance
- Subject-wise bunk calculation
- Intelligent recommendations

#### 6. **Study Session Tracker**
- Pomodoro timer (5, 15, 25, 30 min + custom)
- Subject-wise time tracking
- AI-powered insights and recommendations
- Statistics: Today, Weekly, Total sessions, Streak
- Goal setting with progress bars
- Weekly analytics chart with dates
- Subject-wise doughnut chart
- Study history with date filters

#### 7. **Weekly Timetable Management**
- Customizable time slots
- Editable class schedule
- Monday to Friday support
- Visual timetable grid

#### 8. **💳 Premium Features & Payment Gateway** ⭐ NEW
- Mock payment system (₹99/year)
- Multiple payment methods:
  - UPI with QR code
  - Credit/Debit card
  - Digital wallets
- Premium activation/deactivation toggle
- Expiry date tracking
- Demo mode for testing

#### 9. **Profile Management**
- Personal information (name, roll number, email)
- Semester details
- Overall attendance summary
- Premium status display
- Data export and clear options

#### 10. **Dark/Light Mode**
- System-adaptive theme
- Manual toggle
- Persistent preference
- Smooth transitions

#### 11. **User Authentication**
- Secure signup with email verification
- Password hashing (Werkzeug scrypt)
- Session-based authentication
- OAuth UI ready (Google, Facebook)

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ashirvad001/ordinare_final_project.git
   cd ordinare_final_project
   ```

2. **Install dependencies**
   
   **Windows:**
   ```bash
   install_dependencies.bat
   ```
   
   **Linux/Mac:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Train ML Models** (Optional - Pre-trained models included)
   ```bash
   python train_models.py
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Open browser: `http://127.0.0.1:5000`
   - Demo credentials: `username: demo`, `password: demo123`

## 📋 Requirements

```
Flask>=2.3.0
pandas>=2.0.0
matplotlib>=3.7.0
openpyxl>=3.1.0
Werkzeug>=2.3.0
scikit-learn>=1.3.0
numpy>=1.24.0
```

## 🎯 How It Works

### Step 1: Create Account
- Sign up with your email, username, and password
- Secure authentication with password hashing
- Automatic user data file creation

### Step 2: Initial Setup
- Add your personal information (name, roll number, semester)
- Define your subjects
- Create your weekly timetable

### Step 3: Daily Tracking
- Mark attendance for today's classes
- Start study sessions with the timer
- Track your progress in real-time

### Step 4: Analyze & Improve
- View attendance statistics and charts
- Calculate safe bunks
- Review study analytics
- Set and track goals
- Optimize your academic performance

## 📁 Project Structure

```
ordinare_final_project/
│
├── app.py                          # Main Flask application
├── grade_predictor_model.py        # Grade prediction ML module
├── attendance_risk.py              # Attendance risk ML module
├── study_optimizer.py              # Study optimization ML module
├── train_models.py                 # ML model training pipeline
├── requirements.txt                # Python dependencies
├── install_dependencies.bat        # Windows installer
├── README.md                       # Documentation
│
├── static/                         # Static files
│   ├── css/
│   │   ├── enhanced_style.css     # Dashboard styles
│   │   └── landing_style.css      # Landing page styles
│   ├── js/
│   │   ├── enhanced_script.js     # Dashboard JavaScript
│   │   └── landing_script.js      # Landing page JavaScript
│   ├── ordinare-icon.png          # Logo
│   └── Ordinare Video.mp4         # Demo video
│
├── templates/                      # HTML templates
│   ├── landing.html               # Landing page
│   ├── dashboard.html             # Main dashboard
│   ├── grade_predictor.html       # Grade prediction page
│   ├── attendance_risk.html       # Risk alert page
│   └── study_optimizer.html       # Study optimizer page
│
├── trained_models/                 # Pre-trained ML models
│   ├── grade_predictor.pkl        # Ensemble model
│   ├── attendance_risk.pkl        # Logistic Regression
│   └── study_optimizer.pkl        # Random Forest
│
└── user_data/                      # User data storage
    ├── demo.json                  # Demo user data
    └── [username].json            # User data files
```

## 🎨 AI/ML Features Breakdown

### 🤖 Grade Predictor
- **ML Architecture**: Ensemble Learning
  - Random Forest (40% weight)
  - Gradient Boosting (40% weight)
  - Ridge Regression (20% weight)
- **Training Data**: 5000 realistic samples
- **Features**: Attendance, Study Hours, Midterm, Assignment, Quiz
- **Output**: Predicted score, Grade letter, Confidence score
- **Custom Inputs**: Support for different marking schemes
- **Subject Analysis**: Weak vs Strong subject identification

### 🚨 Attendance Risk Alert
- **ML Model**: Logistic Regression
- **Training Data**: 3000 samples with realistic patterns
- **Features**: Current attendance, Trend, Days left, Recent absences
- **Output**: Risk level (High/Medium/Low), Projected attendance
- **Accuracy**: 93% on test data
- **Recommendations**: Actionable steps to improve

### 📚 Study Time Optimizer
- **ML Model**: Random Forest Regressor
- **Training Data**: 4000 samples
- **Features**: Difficulty, Current grade, Days to exam, Attendance
- **Output**: Recommended hours (total, weekly, daily)
- **R² Score**: 0.82
- **Weekly Schedule**: Auto-generated study plan
- **Priority System**: High/Medium/Low priority subjects

### 📊 Study Tracker
- **AI Insights**: Productivity score, Best study time
- **Smart Recommendations**: Subject to study next
- **Analytics**: Weekly trends, Subject-wise breakdown
- **Goal Tracking**: Daily and weekly progress

## 🔐 Security & Performance

### Security
- Password hashing (Werkzeug scrypt algorithm)
- Session-based authentication
- User-specific data isolation
- Secure file storage
- Input validation

### ML Model Performance
- **Grade Predictor**: 70-74% CV Score
- **Attendance Risk**: 93% Accuracy
- **Study Optimizer**: 0.82 R² Score
- Cross-validation with 5 folds
- Hyperparameter optimization

## 💾 Data Storage

- **User Data**: JSON files in `user_data/` directory
- **ML Models**: Pickle files in `trained_models/` directory
- **Study Sessions**: Browser localStorage + server sync
- **Automatic Backup**: On every save operation
- **Data Persistence**: Across sessions

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: System-adaptive with manual toggle
- **Smooth Animations**: AOS (Animate On Scroll) library
- **Modern UI**: Clean, minimal design with Bootstrap 5
- **Icon Library**: Bootstrap Icons
- **Color Scheme**: 
  - Light mode: Clean whites and grays
  - Dark mode: Deep blacks and grays
- **Glassmorphism Effects**: Modern card designs

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## 📊 Data Format for Excel Upload

For bulk attendance upload, use this format:

| Date       | Subject     | Time Slot   | Status  |
|------------|-------------|-------------|---------|
| 2024-01-15 | Mathematics | 9:00-10:00  | present |
| 2024-01-15 | Physics     | 10:00-11:00 | absent  |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

© 2024 Ordinare. All rights reserved.

## 👥 Author

- **Ashirvad Kumar Singh** - [GitHub](https://github.com/ashirvad001)
  - Roll No: 2301430120042
  - Full-stack Developer & ML Engineer

## 🙏 Acknowledgments

- Bootstrap 5 for UI components
- Chart.js for data visualization
- AOS library for scroll animations
- Flask framework for backend
- Unsplash for stock images

## 📞 Support

For support, email support@ordinare.com or open an issue in the GitHub repository.

## 🔄 Version History

- **v2.0** (Current) - AI-Powered Release
  - ✅ **Grade Predictor**: Ensemble ML model (RF + GB + Ridge)
  - ✅ **Attendance Risk Alert**: Logistic Regression (93% accuracy)
  - ✅ **Study Time Optimizer**: Random Forest (R² 0.82)
  - ✅ **Payment Gateway**: Mock system with QR code, UPI, Card
  - ✅ **Custom Marking Scheme**: Support for different grading systems
  - ✅ **Subject-wise Analysis**: Weak/Strong subject identification
  - ✅ **ML Model Training Pipeline**: Automated training with real datasets
  - ✅ **Study Tracker**: AI insights and recommendations
  - ✅ **Dark/Light Mode**: System-adaptive theme
  - ✅ **Enhanced UI/UX**: Modern glassmorphism design
  - ✅ **Modular Architecture**: Separated ML modules

- **v1.0**
  - Initial release
  - Basic attendance tracking
  - Timetable management
  - Bunk calculator
  - User authentication

## 🚧 Roadmap

- [x] Grade Prediction System (ML-powered)
- [x] Attendance Risk Alert (ML-powered)
- [x] Study Time Optimizer (ML-powered)
- [x] Payment Gateway Integration
- [ ] Real Razorpay Payment Integration
- [ ] Google OAuth Implementation
- [ ] Facebook OAuth Implementation
- [ ] CGPA Calculator
- [ ] Advanced Analytics Dashboard
- [ ] Mobile App (React Native)
- [ ] Email Notifications
- [ ] Calendar Integration (Google Calendar)
- [ ] PDF Report Export
- [ ] Multi-language Support
- [ ] Real-time Collaboration
- [ ] Teacher/Parent Portal

## 🤖 ML Models Training

To retrain models with your own data:

```bash
python train_models.py
```

This will:
1. Generate realistic training datasets
2. Train all 3 ML models
3. Perform cross-validation
4. Save models to `trained_models/`
5. Display performance metrics

## 🎓 Demo Account

```
Username: demo
Password: demo123
```

Demo account includes:
- 6 subjects with full data
- 90 attendance records (88.9% overall)
- 14 study sessions
- Complete timetable
- All features unlocked

## 📊 Model Performance Metrics

| Model | Algorithm | Accuracy/Score | Training Samples |
|-------|-----------|----------------|------------------|
| Grade Predictor | Ensemble (RF+GB+Ridge) | 70-74% CV | 5000 |
| Attendance Risk | Logistic Regression | 93% | 3000 |
| Study Optimizer | Random Forest | R² 0.82 | 4000 |

## 🛠️ Tech Stack

**Backend:**
- Flask 2.3.0
- scikit-learn 1.3.0
- NumPy 1.24.0
- Pandas 2.0.0

**Frontend:**
- Bootstrap 5.3.3
- Chart.js 4.4.0
- Vanilla JavaScript

**ML/AI:**
- Random Forest
- Gradient Boosting
- Logistic Regression
- Ridge Regression
- Ensemble Learning

---

**Made with ❤️ and 🤖 AI for students, by students**
