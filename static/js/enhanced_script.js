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
            updateLoginState(false);
            showTab('login');
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        updateLoginState(false);
        showTab('login');
    }
}

function updateLoginState(isLoggedIn) {
    const authSection = document.getElementById('authNavSection');
    const appSection = document.getElementById('appNavSection');
    const headerUserInfo = document.getElementById('headerUserInfo');
    const headerUsername = document.getElementById('headerUsername');

    if (isLoggedIn) {
        authSection.classList.add('d-none');
        appSection.classList.remove('d-none');
        headerUserInfo.classList.remove('d-none');
        headerUsername.textContent = `Welcome, ${currentUsername}!`;
    } else {
        authSection.classList.remove('d-none');
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
    else if (tabName === 'studyTracker') populateStudyTrackerSubjects();
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
        updateLoginState(false);
        showTab('login');
        showAlert('Logged out successfully', 'info');
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
function populateStudyTrackerSubjects() {
    const select = document.getElementById('studySubjectSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select Subject --</option>';
    subjects.forEach(subject => {
        select.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
    });
    loadStudyData();
}

let timerInterval = null;
let timerSeconds = 0;
let studyData = { sessions: [], totalMinutes: 0, streak: 0, lastStudyDate: null };
let sessionStartTime = 0;
let currentSubject = null;

function startTimer() {
    const subject = document.getElementById('studySubjectSelect').value;
    if (!subject) {
        showAlert('Please select a subject', 'warning');
        return;
    }
    
    currentSubject = subject;
    const customTime = document.getElementById('customTimerInput').value;
    const selectedMode = document.querySelector('input[name="timerMode"]:checked').value;
    const minutes = customTime || selectedMode;
    
    timerSeconds = minutes * 60;
    sessionStartTime = Date.now();
    document.getElementById('startTimerBtn').classList.add('d-none');
    document.getElementById('timerControls').classList.remove('d-none');
    
    timerInterval = setInterval(() => {
        timerSeconds--;
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        document.getElementById('timerDisplay').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        if (timerSeconds <= 0) {
            stopTimer(true);
            showAlert('Study session completed!', 'success');
        }
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById('pauseTimerBtn').innerHTML = '<i class="bi bi-play-fill me-2"></i>Resume';
    } else {
        timerInterval = setInterval(() => {
            timerSeconds--;
            const mins = Math.floor(timerSeconds / 60);
            const secs = timerSeconds % 60;
            document.getElementById('timerDisplay').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            if (timerSeconds <= 0) {
                stopTimer(true);
                showAlert('Study session completed!', 'success');
            }
        }, 1000);
        document.getElementById('pauseTimerBtn').innerHTML = '<i class="bi bi-pause-fill me-2"></i>Pause';
    }
}

function stopTimer(completed = false) {
    clearInterval(timerInterval);
    timerInterval = null;
    
    if (completed && sessionStartTime) {
        const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
        const today = new Date().toISOString().split('T')[0];
        
        studyData.sessions.push({
            subject: currentSubject,
            date: today,
            duration: duration,
            notes: document.getElementById('sessionNotes').value
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
    
    timerSeconds = 0;
    sessionStartTime = 0;
    document.getElementById('timerDisplay').textContent = '25:00';
    document.getElementById('startTimerBtn').classList.remove('d-none');
    document.getElementById('timerControls').classList.add('d-none');
    document.getElementById('sessionNotes').value = '';
}

function saveStudyData() {
    localStorage.setItem(`studyData_${currentUsername}`, JSON.stringify(studyData));
}

function loadStudyData() {
    const saved = localStorage.getItem(`studyData_${currentUsername}`);
    if (saved) {
        studyData = JSON.parse(saved);
        if (studyData.dailyGoal) document.getElementById('dailyGoalSlider').value = studyData.dailyGoal;
        if (studyData.weeklyGoal) document.getElementById('weeklyGoalSlider').value = studyData.weeklyGoal;
        updateGoalDisplay('daily');
        updateGoalDisplay('weekly');
    }
    updateStudyStats();
}

function updateStudyStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayMinutes = studyData.sessions.filter(s => s.date === today).reduce((sum, s) => sum + s.duration, 0);
    const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    const weekMinutes = studyData.sessions.filter(s => s.date >= weekStart).reduce((sum, s) => sum + s.duration, 0);
    
    document.getElementById('todayStudyTime').textContent = `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`;
    document.getElementById('weekStudyTime').textContent = `${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`;
    document.getElementById('totalSessions').textContent = studyData.sessions.length;
    document.getElementById('studyStreak').textContent = `${studyData.streak} days`;
    
    updateGoalProgress(todayMinutes, weekMinutes);
    updateSubjectWiseStudyTime();
    updateRecentSessions();
    updateWeeklyChart();
}

function updateGoalDisplay(type) {
    if (type === 'daily') {
        const val = document.getElementById('dailyGoalSlider').value;
        document.getElementById('dailyGoalDisplay').textContent = `${val} hours`;
    } else {
        const val = document.getElementById('weeklyGoalSlider').value;
        document.getElementById('weeklyGoalDisplay').textContent = `${val} hours`;
    }
}

function updateSubjectWiseStudyTime() {
    const container = document.getElementById('subjectStudyTimeContainer');
    if (!container || !studyData.sessions.length) return;
    
    const subjectTimes = {};
    studyData.sessions.forEach(session => {
        subjectTimes[session.subject] = (subjectTimes[session.subject] || 0) + session.duration;
    });
    
    let html = '';
    Object.entries(subjectTimes).forEach(([subjectId, minutes]) => {
        const subject = subjects.find(s => s.id == subjectId);
        if (!subject) return;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        html += `
            <div class="glass-card p-3 mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="fw-bold">${subject.name}</div>
                    <div class="text-primary-custom fw-bold">${hours}h ${mins}m</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html || '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No study sessions recorded yet</div>';
}

function updateRecentSessions() {
    const container = document.getElementById('recentSessionsContainer');
    if (!container || !studyData.sessions.length) return;
    
    const recent = studyData.sessions.slice(-5).reverse();
    let html = '';
    recent.forEach(session => {
        const subject = subjects.find(s => s.id == session.subject);
        if (!subject) return;
        html += `
            <div class="glass-card p-3 mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${subject.name}</div>
                        <small class="text-muted">${session.date} • ${session.duration} min</small>
                        ${session.notes ? `<div class="small mt-1">${session.notes}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateGoalProgress(todayMinutes, weekMinutes) {
    const dailyGoal = parseFloat(document.getElementById('dailyGoalSlider').value) * 60;
    const weeklyGoal = parseFloat(document.getElementById('weeklyGoalSlider').value) * 60;
    
    const dailyPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);
    const weeklyPercent = Math.min((weekMinutes / weeklyGoal) * 100, 100);
    
    document.getElementById('dailyGoalProgress').style.width = `${dailyPercent}%`;
    document.getElementById('weeklyGoalProgress').style.width = `${weeklyPercent}%`;
    
    const dailyHours = (todayMinutes / 60).toFixed(1);
    const weeklyHours = (weekMinutes / 60).toFixed(1);
    document.getElementById('dailyGoalStatus').textContent = `${dailyHours} of ${document.getElementById('dailyGoalSlider').value} hours completed`;
    document.getElementById('weeklyGoalStatus').textContent = `${weeklyHours} of ${document.getElementById('weeklyGoalSlider').value} hours completed`;
}

function saveStudyGoals() {
    studyData.dailyGoal = document.getElementById('dailyGoalSlider').value;
    studyData.weeklyGoal = document.getElementById('weeklyGoalSlider').value;
    saveStudyData();
    showAlert('Goals saved!', 'success');
}
function showStudyHistory() {
    if (!studyData.sessions.length) {
        showAlert('No study history available', 'info');
        return;
    }
    let html = '<div class="modal-body"><h5>Study History</h5>';
    studyData.sessions.slice().reverse().forEach(session => {
        const subject = subjects.find(s => s.id == session.subject);
        html += `<div class="border-bottom py-2"><strong>${subject?.name || 'Unknown'}</strong> - ${session.date} (${session.duration} min)${session.notes ? '<br><small>' + session.notes + '</small>' : ''}</div>`;
    });
    html += '</div>';
    showAlert(html, 'info');
}
function exportStudyData() { showAlert('Study tracker feature coming soon!', 'info'); }
function updateWeeklyChart() {
    const canvas = document.getElementById('studyAnalyticsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = Array(7).fill(0);
    
    studyData.sessions.forEach(session => {
        const date = new Date(session.date);
        const daysDiff = Math.floor((Date.now() - date.getTime()) / 86400000);
        if (daysDiff < 7) {
            const dayIndex = date.getDay();
            weekData[dayIndex] += session.duration;
        }
    });
    
    if (window.studyChart) window.studyChart.destroy();
    
    window.studyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Study Time (minutes)',
                data: weekData,
                backgroundColor: '#2c3e50',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function clearStudyData() {
    if (confirm('Clear all study data?')) {
        studyData = { sessions: [], totalMinutes: 0, streak: 0, lastStudyDate: null };
        saveStudyData();
        updateStudyStats();
        showAlert('Study data cleared', 'success');
    }
}