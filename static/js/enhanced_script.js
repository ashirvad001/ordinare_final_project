// Enhanced JavaScript for Ordinare V2
let subjects = [];
let timetable = {};
let attendanceData = {};
let timeSlots = [
    '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-1:00',
    '1:00-2:00', '2:00-3:00', '3:00-4:00', '4:00-5:00'
];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

let currentUsername = null;
let studentName = '';
let universityRollNo = '';
let attendanceChart = null;

// Initialize on page load
window.onload = function() {
    checkAuthAndLoadData();
    initializeMobileNav();
};

// Authentication and Data Loading
async function checkAuthAndLoadData() {
    try {
        const response = await fetch('/check_auth');
        const result = await response.json();
        if (result.authenticated) {
            currentUsername = result.username;
            updateLoginState(true);
            await loadData();
            updateAllDisplays();
            showTab('dashboard');
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = '/';
    }
}

function updateLoginState(isLoggedIn) {
    const appSection = document.getElementById('appNavSection');
    const headerUserInfo = document.getElementById('headerUserInfo');
    const headerUsername = document.getElementById('headerUsername');

    if (isLoggedIn) {
        appSection.classList.remove('d-none');
        headerUserInfo.classList.remove('d-none');
        headerUsername.textContent = 'Welcome, ' + currentUsername + '!';
    } else {
        appSection.classList.add('d-none');
        headerUserInfo.classList.add('d-none');
    }
}

// Tab Navigation
function showTab(tabName) {
    // Remove active from all tabs and nav items
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Activate selected tab
    const tabPanel = document.getElementById(tabName);
    if (tabPanel) {
        tabPanel.classList.add('active');
    }

    // Activate corresponding nav items (both sidebar and mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.textContent.toLowerCase().includes(tabName.toLowerCase()) ||
            item.onclick?.toString().includes(`'${tabName}'`)) {
            item.classList.add('active');
        }
    });

    // Load specific tab content
    if (tabName === 'attendance') generateAttendanceUI();
    else if (tabName === 'analytics') updateAnalyticsDisplay();
    else if (tabName === 'subjectwise') updateSubjectWiseDisplay();
    else if (tabName === 'profile') updateProfileDisplay();
    else if (tabName === 'timetable') generateTimetableGrid();
    else if (tabName === 'setup') populateSetupTab();
    else if (tabName === 'studyTracker') { 
        populateStudyTrackerSubjects(); 
        setTimeout(() => {
            updateWeeklyStudyChart();
        }, 100);
    }
}

// Mobile Navigation
function initializeMobileNav() {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function() {
            mobileNavItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// User Authentication Functions
async function signupUser() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!username || !password) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        
        if (result.success) {
            showAlert('Signup successful! Please log in.', 'success');
            showTab('login');
        } else {
            showAlert('Signup failed: ' + result.message, 'danger');
        }
    } catch (error) {
        showAlert('Error during signup. Please try again.', 'danger');
    }
}

async function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        
        if (result.success) {
            await checkAuthAndLoadData();
            showAlert('Login successful!', 'success');
        } else {
            showAlert('Login failed: ' + result.message, 'danger');
        }
    } catch (error) {
        showAlert('Error during login. Please try again.', 'danger');
    }
}

async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
        currentUsername = null;
        subjects = [];
        timetable = {};
        attendanceData = {};
        window.location.href = '/';
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Data Management
async function saveData() {
    if (!currentUsername) return;
    
    const dataToSave = { 
        subjects, 
        timetable, 
        attendanceData, 
        timeSlots, 
        studentName, 
        universityRollNo 
    };
    
    try {
        await fetch('/save_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave)
        });
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

async function loadData() {
    if (!currentUsername) return;
    
    try {
        const response = await fetch('/get_data');
        const result = await response.json();
        
        if (result.success && result.data) {
            subjects = result.data.subjects || [];
            timetable = result.data.timetable || {};
            attendanceData = result.data.attendanceData || {};
            timeSlots = result.data.timeSlots || timeSlots;
            studentName = result.data.studentName || '';
            universityRollNo = result.data.universityRollNo || '';
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Setup Functions
function generateSubjectInputs() {
    const numSubjects = parseInt(document.getElementById('numSubjects').value);
    const container = document.getElementById('subjectInputs');
    const subjectContainer = document.getElementById('subjectInputsContainer');
    
    if (!numSubjects || numSubjects < 1 || numSubjects > 10) {
        showAlert('Please enter a valid number of subjects (1-10)', 'warning');
        return;
    }
    
    let html = '';
    for (let i = 0; i < numSubjects; i++) {
        html += `
            <div class="mb-3">
                <label class="form-label fw-semibold">
                    <i class="bi bi-book me-1"></i>
                    Subject ${i + 1}
                </label>
                <input type="text" 
                       id="subject${i}" 
                       class="form-control" 
                       placeholder="Enter subject name">
            </div>
        `;
    }
    
    container.innerHTML = html;
    subjectContainer.classList.remove('d-none');
}

function saveSubjects() {
    const numSubjects = parseInt(document.getElementById('numSubjects').value);
    studentName = document.getElementById('studentName').value.trim();
    universityRollNo = document.getElementById('universityRollNo').value.trim();
    
    if (!studentName || !universityRollNo) {
        showAlert('Please fill in all personal information', 'warning');
        return;
    }
    
    subjects = [];
    for (let i = 0; i < numSubjects; i++) {
        const name = document.getElementById(`subject${i}`).value.trim();
        if (name) {
            subjects.push({ id: i, name });
        }
    }
    
    if (subjects.length !== numSubjects) {
        showAlert('Please fill in all subject names', 'warning');
        return;
    }
    
    document.getElementById('setupComplete').classList.remove('d-none');
    saveData();
    updateAllDisplays();
    showAlert('Setup completed successfully!', 'success');
}

function populateSetupTab() {
    document.getElementById('studentName').value = studentName;
    document.getElementById('universityRollNo').value = universityRollNo;
    
    if (subjects.length > 0) {
        document.getElementById('numSubjects').value = subjects.length;
        generateSubjectInputs();
        
        subjects.forEach((s, i) => {
            const input = document.getElementById(`subject${i}`);
            if (input) {
                input.value = s.name;
            }
        });
        
        document.getElementById('setupComplete').classList.remove('d-none');
    }
}

// Timetable Functions
function generateTimetableGrid() {
    const container = document.getElementById('timetableContainer');
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Please complete the setup first to create your timetable
            </div>
        `;
        return;
    }
    
    let html = '<div class="timetable-grid">';
    html += '<div class="timetable-header">Time</div>';
    days.forEach(day => html += `<div class="timetable-header">${day}</div>`);
    
    timeSlots.forEach(timeSlot => {
        html += `<div class="timetable-cell time-slot">${timeSlot}</div>`;
        days.forEach(day => {
            const id = `${day}-${timeSlot}`;
            const selectedSubjectId = timetable[id] || "";
            
            let options = '<option value="">Free</option>';
            subjects.forEach(s => {
                options += `<option value="${s.id}" ${selectedSubjectId == s.id ? 'selected' : ''}>${s.name}</option>`;
            });
            
            html += `
                <div class="timetable-cell">
                    <select id="${id}" 
                            class="form-select form-select-sm" 
                            onchange="updateTimetable('${id}')">
                        ${options}
                    </select>
                </div>
            `;
        });
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function updateTimetable(id) {
    const val = document.getElementById(id).value;
    if (val) {
        timetable[id] = parseInt(val);
    } else {
        delete timetable[id];
    }
}

async function saveTimetable() {
    await saveData();
    showAlert('Timetable saved successfully!', 'success');
}

// Attendance Functions
function generateAttendanceUI() {
    const container = document.getElementById('attendanceContainer');
    
    if (!subjects.length || Object.keys(timetable).length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Please set up subjects and timetable first
            </div>
        `;
        return;
    }

    const today = new Date();
    const dayIndex = today.getDay() - 1;
    const dayName = days[dayIndex];
    
    if (dayIndex < 0 || dayIndex > 4) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-calendar-x me-2"></i>
                No classes today (weekend). Enjoy your day off!
            </div>
        `;
        return;
    }

    const todayStr = today.toISOString().split('T')[0];
    let classesToday = [];

    timeSlots.forEach(slot => {
        const key = `${dayName}-${slot}`;
        const subjectId = timetable[key];
        
        if (subjectId !== undefined) {
            const subject = subjects.find(s => s.id == subjectId);
            if (subject) {
                const subjectData = attendanceData[subjectId] || { records: [] };
                const recordKey = `${subjectId}-${todayStr}-${slot}`;
                const existingRecord = subjectData.records.find(r => r.key === recordKey);
                
                classesToday.push({
                    slot,
                    subject,
                    subjectId,
                    existingRecord
                });
            }
        }
    });

    if (classesToday.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                No classes scheduled for today (${dayName}).
            </div>
        `;
        return;
    }

    let html = `
        <div class="glass-card p-3 mb-3">
            <h5 class="mb-0">
                <i class="bi bi-calendar-check me-2 text-primary-custom"></i>
                ${dayName}'s Classes
            </h5>
        </div>
    `;

    classesToday.forEach(classInfo => {
        const { slot, subject, subjectId, existingRecord } = classInfo;
        
        let statusBadge = '';
        let buttons = '';
        
        if (existingRecord) {
            const badgeClass = existingRecord.status === 'present' ? 'success' : 'danger';
            statusBadge = `<span class="badge bg-${badgeClass}">
                <i class="bi bi-${existingRecord.status === 'present' ? 'check' : 'x'}-circle me-1"></i>
                ${existingRecord.status.toUpperCase()}
            </span>`;
        } else {
            buttons = `
                <button class="btn btn-sm btn-success me-2" 
                        onclick="markAttendance(${subjectId}, 'present', '${slot}')">
                    <i class="bi bi-check-circle me-1"></i>
                    Present
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="markAttendance(${subjectId}, 'absent', '${slot}')">
                    <i class="bi bi-x-circle me-1"></i>
                    Absent
                </button>
            `;
        }
        
        html += `
            <div class="attendance-item glass-card mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold text-primary-custom">${subject.name}</div>
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${slot}
                        </small>
                    </div>
                    <div>
                        ${statusBadge}
                        ${buttons}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function markAttendance(subjectId, status, timeSlot) {
    const todayStr = new Date().toISOString().split('T')[0];
    const recordKey = `${subjectId}-${todayStr}-${timeSlot}`;
    const subjectIdStr = String(subjectId);
    
    if (!attendanceData[subjectIdStr]) {
        attendanceData[subjectIdStr] = { total: 0, attended: 0, records: [] };
    }

    if (attendanceData[subjectIdStr].records.some(r => r.key === recordKey)) {
        showAlert('This class has already been marked.', 'warning');
        return;
    }

    attendanceData[subjectIdStr].total++;
    if (status === 'present') {
        attendanceData[subjectIdStr].attended++;
    }
    attendanceData[subjectIdStr].records.push({ key: recordKey, status: status });

    await saveData();
    generateAttendanceUI();
    updateAnalyticsDisplay();
    updateSubjectWiseDisplay();
    
    const statusText = status === 'present' ? 'Present' : 'Absent';
    showAlert(`Marked as ${statusText}`, 'success');
}

// Subject-wise Display
function updateSubjectWiseDisplay() {
    const container = document.getElementById('subjectWiseAttendanceContent');
    
    if (!subjects.length) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                No subject data available. Please complete setup.
            </div>
        `;
        return;
    }
    
    let html = '';
    subjects.forEach(subject => {
        const data = attendanceData[String(subject.id)] || { total: 0, attended: 0 };
        const percentage = data.total > 0 ? ((data.attended / data.total) * 100).toFixed(2) : "0.00";
        const badgeClass = parseFloat(percentage) >= 75 ? 'success' : (parseFloat(percentage) >= 60 ? 'warning' : 'danger');
        
        html += `
            <div class="glass-card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="mb-0 fw-bold">${subject.name}</h5>
                    <span class="badge bg-${badgeClass} fs-6">
                        ${percentage}%
                    </span>
                </div>
                <div class="d-flex justify-content-between text-muted small">
                    <span>
                        <i class="bi bi-check-circle me-1"></i>
                        Attended: ${data.attended}
                    </span>
                    <span>
                        <i class="bi bi-calendar-event me-1"></i>
                        Total: ${data.total}
                    </span>
                </div>
                <div class="progress-custom mt-2">
                    <div class="progress-bar-custom" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Analytics Display
function updateAnalyticsDisplay() {
    let totalClasses = 0;
    let attendedClasses = 0;
    
    for (const subjectId in attendanceData) {
        totalClasses += attendanceData[subjectId].total;
        attendedClasses += attendanceData[subjectId].attended;
    }
    
    const overallPercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : "0.00";
    
    const displayElem = document.getElementById('overallAttendanceDisplay');
    if (displayElem) {
        displayElem.innerHTML = `
            <div class="text-center">
                <div class="display-4 fw-bold text-primary-custom mb-2">${overallPercentage}%</div>
                <div class="text-muted">${attendedClasses} / ${totalClasses} classes attended</div>
            </div>
        `;
    }
    
    fetchAttendancePlot();
}

async function fetchAttendancePlot() {
    const plotContainer = document.getElementById('attendancePlotDisplay');
    
    if (!plotContainer) return;
    
    try {
        const response = await fetch('/get_attendance_plot');
        const result = await response.json();
        
        if (result.success && result.image) {
            plotContainer.innerHTML = `
                <img src="data:image/png;base64,${result.image}" 
                     class="img-fluid rounded" 
                     alt="Attendance Plot"
                     style="max-height: 400px;">
            `;
        } else {
            plotContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    ${result.message || 'No attendance data to display.'}
                </div>
            `;
        }
    } catch (error) {
        plotContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error loading attendance plot.
            </div>
        `;
    }
}

// Bunk Calculator
function calculateBunks() {
    const targetPercentage = parseInt(document.getElementById('targetPercentage').value);
    const resultsContainer = document.getElementById('bunkResults');
    
    if (!targetPercentage || targetPercentage < 0 || targetPercentage > 100) {
        showAlert('Please enter a valid target percentage (0-100)', 'warning');
        return;
    }
    
    let html = '';
    
    subjects.forEach(subject => {
        const data = attendanceData[String(subject.id)] || { total: 0, attended: 0 };
        let { total, attended } = data;
        const currentPercentage = total > 0 ? (attended / total) * 100 : 100;
        
        let resultMessage = '';
        let iconClass = '';
        let cardClass = '';
        
        if (currentPercentage >= targetPercentage) {
            let bunksAllowed = 0;
            let tempAttended = attended;
            let tempTotal = total;
            
            while (((tempAttended / (tempTotal + 1)) * 100) >= targetPercentage && bunksAllowed < 100) {
                bunksAllowed++;
                tempTotal++;
            }
            
            if (bunksAllowed > 0) {
                resultMessage = `You can safely bunk <strong>${bunksAllowed}</strong> more class(es)`;
                iconClass = 'bi-emoji-smile text-success';
                cardClass = 'border-success';
            } else {
                resultMessage = `You cannot bunk without dropping below ${targetPercentage}%`;
                iconClass = 'bi-emoji-neutral text-warning';
                cardClass = 'border-warning';
            }
        } else {
            let classesNeeded = 0;
            let tempAttended = attended;
            let tempTotal = total;
            
            while (((tempAttended / tempTotal) * 100) < targetPercentage && classesNeeded < 1000) {
                classesNeeded++;
                tempAttended++;
                tempTotal++;
            }
            
            resultMessage = classesNeeded >= 1000 
                ? `You need to attend <strong>many</strong> more classes`
                : `You need to attend <strong>${classesNeeded}</strong> more class(es)`;
            iconClass = 'bi-emoji-frown text-danger';
            cardClass = 'border-danger';
        }
        
        html += `
            <div class="glass-card p-3 mb-3 border-start border-4 ${cardClass}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1 fw-bold">${subject.name}</h6>
                        <small class="text-muted">Current: ${currentPercentage.toFixed(1)}%</small>
                    </div>
                    <i class="bi ${iconClass} fs-2"></i>
                </div>
                <div class="mt-2">${resultMessage}</div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Profile Display
function updateProfileDisplay() {
    document.getElementById('profileUsername').textContent = currentUsername || '-';
    document.getElementById('profileStudentName').textContent = studentName || '-';
    document.getElementById('profileRollNo').textContent = universityRollNo || '-';
    document.getElementById('profileSemester').textContent = document.getElementById('semesterName')?.value || '-';
    document.getElementById('profileSubjects').textContent = subjects.length;

    let totalClasses = 0;
    let attendedClasses = 0;
    
    for (const subjectId in attendanceData) {
        totalClasses += attendanceData[subjectId].total;
        attendedClasses += attendanceData[subjectId].attended;
    }
    
    const overallPercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : "0.00";
    document.getElementById('profileAttendance').textContent = `${attendedClasses} / ${totalClasses} (${overallPercentage}%)`;
}

// File Upload
async function uploadAttendanceFile() {
    const fileInput = document.getElementById('attendanceFile');
    const messageDiv = document.getElementById('uploadMessage');
    
    if (!fileInput.files.length) {
        showAlert('Please select a file', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/upload_attendance', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        
        if (result.success) {
            messageDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    ${result.message}
                </div>
            `;
            await loadData();
            updateAllDisplays();
        } else {
            messageDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${result.message}
                </div>
            `;
        }
    } catch (error) {
        messageDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error uploading file. Please try again.
            </div>
        `;
    }
}

// Utility Functions
function updateAllDisplays() {
    populateSetupTab();
    generateTimetableGrid();
    updateSubjectWiseDisplay();
    updateAnalyticsDisplay();
    updateProfileDisplay();
}

async function clearAllData() {
    if (confirm("⚠️ Are you sure you want to clear ALL your data? This cannot be undone.")) {
        try {
            await fetch('/clear_data', { method: 'POST' });
            await checkAuthAndLoadData();
            showAlert('All data has been cleared successfully.', 'success');
        } catch (error) {
            showAlert('Error clearing data. Please try again.', 'danger');
        }
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Study Tracker Functions
let timerInterval = null;
let timerSeconds = 1500;
let timerDuration = 25;
let studyData = { sessions: [], totalMinutes: 0, streak: 0, lastStudyDate: null, dailyGoal: 2, weeklyGoal: 14 };
let sessionStartTime = 0;
let currentSubject = null;
let isTimerRunning = false;

function setTimerDuration(minutes) {
    if (isTimerRunning) {
        showAlert('Please stop the current timer first', 'warning');
        return;
    }
    timerDuration = minutes;
    timerSeconds = minutes * 60;
    updateTimerDisplay();
}

function setCustomTimer() {
    const customMinutes = parseInt(document.getElementById('customTimer').value);
    if (!customMinutes || customMinutes < 1 || customMinutes > 180) {
        showAlert('Please enter a valid time between 1-180 minutes', 'warning');
        return;
    }
    setTimerDuration(customMinutes);
    document.getElementById('customTimer').value = '';
}

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    document.getElementById('timerDisplay').textContent = mins + ':' + secs.toString().padStart(2, '0');
}

function populateStudyTrackerSubjects() {
    const select = document.getElementById('studySubject');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(subject => {
        select.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
    });
    loadStudyData();
    updateStudyStats();
    
    if (!studyData.sessions || studyData.sessions.length === 0) {
        const errorDiv = document.getElementById('chartError');
        if (errorDiv) errorDiv.style.display = 'block';
    }
}

function startTimer() {
    const subject = document.getElementById('studySubject').value;
    if (!subject) {
        showAlert('Please select a subject', 'warning');
        return;
    }
    
    currentSubject = subject;
    sessionStartTime = Date.now();
    isTimerRunning = true;
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        
        if (timerSeconds <= 0) {
            stopTimer();
            showAlert('Study session completed!', 'success');
        }
    }, 1000);
}

function pauseTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('pauseBtn').innerHTML = '<i class="bi bi-play-fill"></i> Resume';
    } else {
        isTimerRunning = true;
        document.getElementById('pauseBtn').innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            if (timerSeconds <= 0) {
                stopTimer();
                showAlert('Study session completed!', 'success');
            }
        }, 1000);
    }
}

function stopTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    
    if (sessionStartTime) {
        const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
        const today = new Date().toISOString().split('T')[0];
        
        if (duration > 0) {
            studyData.sessions.push({
                subject: currentSubject,
                date: today,
                duration: duration
            });
            studyData.totalMinutes += duration;
            
            if (studyData.lastStudyDate !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                studyData.streak = studyData.lastStudyDate === yesterday ? studyData.streak + 1 : 1;
                studyData.lastStudyDate = today;
            }
            
            saveStudyData();
            updateStudyStats();
        }
    }
    
    timerSeconds = timerDuration * 60;
    sessionStartTime = 0;
    updateTimerDisplay();
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
    document.getElementById('stopBtn').disabled = true;
}

function saveStudyData() {
    localStorage.setItem(`studyData_${currentUsername}`, JSON.stringify(studyData));
}

function loadStudyData() {
    const saved = localStorage.getItem(`studyData_${currentUsername}`);
    if (saved) {
        studyData = JSON.parse(saved);
        if (!studyData.dailyGoal) studyData.dailyGoal = 2;
        if (!studyData.weeklyGoal) studyData.weeklyGoal = 14;
    }
    document.getElementById('dailyGoal').value = studyData.dailyGoal;
    document.getElementById('weeklyGoal').value = studyData.weeklyGoal;
}

function updateStudyStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayMinutes = studyData.sessions.filter(s => s.date === today).reduce((sum, s) => sum + s.duration, 0);
    const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    const weekMinutes = studyData.sessions.filter(s => s.date >= weekStart).reduce((sum, s) => sum + s.duration, 0);
    
    document.getElementById('todayTime').textContent = Math.floor(todayMinutes / 60) + 'h ' + (todayMinutes % 60) + 'm';
    document.getElementById('weekTime').textContent = Math.floor(weekMinutes / 60) + 'h ' + (weekMinutes % 60) + 'm';
    document.getElementById('totalSessions').textContent = studyData.sessions.length;
    document.getElementById('studyStreak').textContent = studyData.streak + ' days';
    
    updateGoalProgress(todayMinutes, weekMinutes);
    updateWeeklyStudyChart();
    updateSubjectStudyChart();
    updateStudyHistory();
}

function updateGoalProgress(todayMinutes, weekMinutes) {
    const dailyGoal = parseFloat(document.getElementById('dailyGoal').value) * 60;
    const weeklyGoal = parseFloat(document.getElementById('weeklyGoal').value) * 60;
    
    const dailyPercent = Math.min((todayMinutes / dailyGoal) * 100, 100).toFixed(0);
    const weeklyPercent = Math.min((weekMinutes / weeklyGoal) * 100, 100).toFixed(0);
    
    document.getElementById('dailyProgress').style.width = `${dailyPercent}%`;
    document.getElementById('dailyProgress').textContent = `${dailyPercent}%`;
    document.getElementById('weeklyProgress').style.width = `${weeklyPercent}%`;
    document.getElementById('weeklyProgress').textContent = `${weeklyPercent}%`;
}

function saveStudyGoals() {
    studyData.dailyGoal = parseFloat(document.getElementById('dailyGoal').value);
    studyData.weeklyGoal = parseFloat(document.getElementById('weeklyGoal').value);
    saveStudyData();
    updateStudyStats();
    showAlert('Goals saved successfully!', 'success');
}

function updateWeeklyStudyChart() {
    const canvas = document.getElementById('weeklyStudyChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Cannot get canvas context');
        return;
    }
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [0, 0, 0, 0, 0, 0, 0];
    
    const today = new Date();
    if (studyData.sessions && studyData.sessions.length > 0) {
        studyData.sessions.forEach(session => {
            try {
                const sessionDate = new Date(session.date);
                const daysDiff = Math.floor((today - sessionDate) / 86400000);
                if (daysDiff >= 0 && daysDiff < 7) {
                    const dayIndex = sessionDate.getDay();
                    weekData[dayIndex] += session.duration;
                }
            } catch (e) {
                console.error('Error processing session:', e);
            }
        });
    }
    
    if (window.weeklyStudyChart) {
        try {
            window.weeklyStudyChart.destroy();
        } catch (e) {
            console.error('Error destroying chart:', e);
        }
    }
    
    try {
        window.weeklyStudyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Study Time (minutes)',
                    data: weekData,
                    backgroundColor: 'rgba(44, 62, 80, 0.8)',
                    borderColor: '#2c3e50',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const minutes = context.parsed.y;
                                const hours = Math.floor(minutes / 60);
                                const mins = minutes % 60;
                                return 'Study Time: ' + hours + 'h ' + mins + 'm';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 15,
                            callback: function(value) {
                                return value + ' min';
                            }
                        },
                        min: 0,
                        suggestedMax: 120
                    }
                }
            }
        });
        console.log('Chart created successfully with data:', weekData);
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

function updateSubjectStudyChart() {
    const canvas = document.getElementById('subjectStudyChart');
    if (!canvas) return;
    
    if (typeof Chart === 'undefined') return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const subjectTimes = {};
    const subjectNames = [];
    const subjectMinutes = [];
    const colors = [
        'rgba(44, 62, 80, 0.8)',
        'rgba(52, 152, 219, 0.8)',
        'rgba(46, 204, 113, 0.8)',
        'rgba(241, 196, 15, 0.8)',
        'rgba(231, 76, 60, 0.8)',
        'rgba(155, 89, 182, 0.8)',
        'rgba(26, 188, 156, 0.8)',
        'rgba(230, 126, 34, 0.8)'
    ];
    
    if (studyData.sessions && studyData.sessions.length > 0) {
        studyData.sessions.forEach(session => {
            if (!subjectTimes[session.subject]) {
                subjectTimes[session.subject] = 0;
            }
            subjectTimes[session.subject] += session.duration;
        });
        
        Object.entries(subjectTimes).forEach(([subjectId, minutes]) => {
            const subject = subjects.find(s => s.id == subjectId);
            if (subject) {
                subjectNames.push(subject.name);
                subjectMinutes.push(minutes);
            }
        });
    }
    
    if (subjectNames.length === 0) {
        document.getElementById('subjectChartError').style.display = 'block';
        return;
    } else {
        document.getElementById('subjectChartError').style.display = 'none';
    }
    
    if (window.subjectStudyChart) {
        try {
            window.subjectStudyChart.destroy();
        } catch (e) {}
    }
    
    try {
        window.subjectStudyChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: subjectNames,
                datasets: [{
                    label: 'Study Time (minutes)',
                    data: subjectMinutes,
                    backgroundColor: colors.slice(0, subjectNames.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const minutes = context.parsed;
                                const hours = Math.floor(minutes / 60);
                                const mins = minutes % 60;
                                return context.label + ': ' + hours + 'h ' + mins + 'm';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating subject chart:', error);
    }
}

function updateStudyHistory() {
    const container = document.getElementById('studyHistoryContainer');
    if (!container) return;
    
    if (!studyData.sessions || studyData.sessions.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                No study sessions recorded yet. Start a timer to track your study time!
            </div>
        `;
        return;
    }
    
    const recentSessions = studyData.sessions.slice().reverse().slice(0, 10);
    let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Date</th><th>Subject</th><th>Duration</th></tr></thead><tbody>';
    
    recentSessions.forEach(session => {
        const subject = subjects.find(s => s.id == session.subject);
        const subjectName = subject ? subject.name : 'Unknown';
        const hours = Math.floor(session.duration / 60);
        const mins = session.duration % 60;
        const duration = hours > 0 ? hours + 'h ' + mins + 'm' : mins + 'm';
        
        html += `
            <tr>
                <td><i class="bi bi-calendar3 me-2"></i>${session.date}</td>
                <td><span class="badge bg-primary">${subjectName}</span></td>
                <td><i class="bi bi-clock me-2"></i>${duration}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    
    if (studyData.sessions.length > 10) {
        html += '<div class="text-center mt-2"><small class="text-muted">Showing 10 most recent sessions out of ' + studyData.sessions.length + ' total</small></div>';
    }
    
    container.innerHTML = html;
}