# Ordinare - Smart Student Management System

![Ordinare Logo](static/ordinare-icon.png)

Ordinare is a comprehensive web-based student management system designed to help students track attendance, manage study time, organize timetables, and optimize their academic performance.

## 🌟 Features

### Active Features

#### 1. **Smart Attendance Tracking**
- Track daily attendance for all subjects
- Calculate attendance percentages in real-time
- Subject-wise attendance breakdown
- Visual analytics with charts and graphs
- Excel file upload support for bulk attendance import

#### 2. **Bunk Calculator**
- Calculate safe bunks based on target attendance percentage
- Know exactly how many classes you can miss
- Subject-wise bunk calculation
- Intelligent recommendations to maintain attendance goals

#### 3. **Weekly Timetable Management**
- Create and manage your weekly class schedule
- Drag-and-drop interface for easy scheduling
- Multiple time slots (9:00 AM - 5:00 PM)
- Monday to Friday schedule support
- Visual timetable grid

#### 4. **Study Session Tracker**
- Built-in Pomodoro timer with customizable durations (5, 15, 25, 30 minutes)
- Custom timer option (1-180 minutes)
- Subject-wise study time tracking
- Real-time statistics:
  - Today's study time
  - Weekly study time
  - Total sessions count
  - Current study streak
- Goal setting (daily and weekly hours)
- Progress tracking with visual progress bars
- Weekly analytics chart
- Subject-wise study time breakdown (doughnut chart)
- Complete study history with date and duration

#### 5. **Profile Management**
- Personal information storage
- Student name and university roll number
- Semester details
- Overall attendance summary
- Data export and clear options

#### 6. **Data Upload**
- Excel file upload for attendance data
- Bulk import functionality
- Expected format guide included
- Automatic data validation

#### 7. **Dark/Light Mode**
- System-adaptive theme detection
- Manual toggle between dark and light modes
- Persistent theme preference
- Smooth transitions
- Available on both landing page and dashboard

#### 8. **User Authentication**
- Secure signup with email, username, and password
- Password hashing for security
- Session-based authentication
- Google and Facebook OAuth buttons (UI ready)
- Separate landing page and dashboard

### Coming Soon Features

- **Score Prediction System**: AI-powered grade predictions
- **Visual Analytics Dashboard**: Advanced charts and insights
- **CGPA Calculator**: Track semester and cumulative GPA
- **Grade Predictor**: Estimate final grades based on current performance

## 🚀 Getting Started

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ashirvad001/ordinare_final_project.git
   cd ordinare_final_project
   ```

2. **Install required dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the application**
   - Open your browser and navigate to `http://127.0.0.1:5000`
   - You'll see the landing page
   - Click "Get Started" or "Login" to access the dashboard

## 📋 Requirements

```
flask
pandas
matplotlib
werkzeug
openpyxl
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
├── requirements.txt                # Python dependencies
├── README.md                       # Project documentation
│
├── static/                         # Static files
│   ├── css/
│   │   ├── enhanced_style.css     # Dashboard styles
│   │   └── landing_style.css      # Landing page styles
│   ├── js/
│   │   ├── enhanced_script.js     # Dashboard JavaScript
│   │   └── landing_script.js      # Landing page JavaScript
│   ├── ordinare-icon.png          # Logo (transparent)
│   └── Ordinare Video.mp4         # Demo video
│
├── templates/                      # HTML templates
│   ├── landing.html               # Landing page
│   └── dashboard.html             # Main dashboard
│
└── user_data/                      # User data storage (auto-created)
    └── [username].json            # Individual user data files
```

## 🎨 Features Breakdown

### Attendance Management
- **Mark Attendance**: Quick daily attendance marking
- **Subject-wise View**: Detailed breakdown per subject
- **Percentage Calculation**: Automatic calculation with color-coded indicators
- **Bunk Calculator**: Smart recommendations for safe bunks
- **Visual Charts**: Bar charts showing attendance percentages
- **Excel Upload**: Bulk import from Excel files

### Study Tracker
- **Timer Modes**: 5, 15, 25, 30 minutes + custom duration
- **Subject Selection**: Track time per subject
- **Statistics Dashboard**: 
  - Today's time
  - Weekly time
  - Total sessions
  - Study streak
- **Goal Management**: Set daily and weekly goals
- **Progress Tracking**: Visual progress bars
- **Analytics**: 
  - Weekly bar chart (study time per day)
  - Subject-wise doughnut chart
- **History**: Complete session history table

### Timetable
- **Grid View**: Visual weekly schedule
- **Time Slots**: 8 slots from 9 AM to 5 PM
- **Subject Assignment**: Dropdown selection per slot
- **Persistent Storage**: Saves automatically

## 🔐 Security Features

- Password hashing using Werkzeug security
- Session-based authentication
- User-specific data isolation
- Secure file storage
- CSRF protection ready

## 💾 Data Storage

- JSON-based user data storage
- Individual files per user in `user_data/` directory
- Automatic backup on save
- Data persistence across sessions
- Study tracker data in browser localStorage

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

## 👥 Authors

- **Ashirvad Singh** - [GitHub](https://github.com/ashirvad001)

## 🙏 Acknowledgments

- Bootstrap 5 for UI components
- Chart.js for data visualization
- AOS library for scroll animations
- Flask framework for backend
- Unsplash for stock images

## 📞 Support

For support, email support@ordinare.com or open an issue in the GitHub repository.

## 🔄 Version History

- **v2.0** (Current)
  - Added Study Tracker with full analytics
  - Implemented Dark/Light mode
  - Added email field to signup
  - Enhanced UI/UX across all sections
  - Added favicon and logo updates
  - Improved theme consistency

- **v1.0**
  - Initial release
  - Basic attendance tracking
  - Timetable management
  - Bunk calculator
  - User authentication

## 🚧 Roadmap

- [ ] Implement Google OAuth
- [ ] Implement Facebook OAuth
- [ ] Add Score Prediction System
- [ ] Create Advanced Analytics Dashboard
- [ ] Add CGPA Calculator
- [ ] Mobile app development
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Export reports as PDF
- [ ] Multi-language support

---

**Made with ❤️ for students, by students**
