// Enhanced JavaScript for Ordinare V2
let subjects = [];
let timetable = {};
let attendanceData = {};
let timeSlots = [
    '9:00 AM-10:00 AM', '10:00 AM-11:00 AM', '11:00 AM-12:00 PM', '12:00 PM-1:00 PM',
    '1:00 PM-2:00 PM', '2:00 PM-3:00 PM', '3:00 PM-4:00 PM', '4:00 PM-5:00 PM'
];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

let currentUsername = null;
let studentName = '';
let universityRollNo = '';
let userEmail = '';
let attendanceChart = null;

// Initialize on page load
window.onload = function() {
    checkAuthAndLoadData();
    initializeMobileNav();
    initDashboardTheme();
    initSmoothScroll();
    initIntersectionObserver();
};

// Smooth scroll behavior
function initSmoothScroll() {
    document.documentElement.style.scrollBehavior = 'smooth';
}

// Intersection Observer for animations
function initIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe cards when they're added
    const observeCards = () => {
        document.querySelectorAll('.glass-card, .stat-card').forEach(card => {
            if (!card.dataset.observed) {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(card);
                card.dataset.observed = 'true';
            }
        });
    };
    
    // Initial observation
    setTimeout(observeCards, 100);
    
    // Re-observe when tab changes
    const originalShowTab = window.showTab;
    window.showTab = function(tabName) {
        originalShowTab(tabName);
        setTimeout(observeCards, 100);
    };
}

// Dashboard Theme Management
function initDashboardTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setDashboardTheme(savedTheme);
    } else if (systemPrefersDark) {
        setDashboardTheme('dark');
    } else {
        setDashboardTheme('light');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setDashboardTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function toggleDashboardTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setDashboardTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setDashboardTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('dashboardThemeIcon');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'bi bi-moon-fill';
        } else {
            icon.className = 'bi bi-sun-fill';
        }
    }
}

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

// Tab Navigation with smooth transitions
function showTab(tabName) {
    // Fade out current tab
    const currentTab = document.querySelector('.tab-content-panel.active');
    if (currentTab) {
        currentTab.style.opacity = '0';
        setTimeout(() => {
            currentTab.classList.remove('active');
        }, 150);
    }
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Activate selected tab with fade in
    setTimeout(() => {
        const tabPanel = document.getElementById(tabName);
        if (tabPanel) {
            tabPanel.classList.add('active');
            tabPanel.style.opacity = '0';
            setTimeout(() => {
                tabPanel.style.opacity = '1';
            }, 50);
        }
    }, 150);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

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

// Mobile Navigation with haptic feedback
function initializeMobileNav() {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Haptic feedback for mobile
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
            
            mobileNavItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(44, 62, 80, 0.3);
                width: 100px;
                height: 100px;
                margin-top: -50px;
                margin-left: -50px;
                animation: ripple 0.6s;
                pointer-events: none;
            `;
            ripple.style.left = e.clientX - this.getBoundingClientRect().left + 'px';
            ripple.style.top = e.clientY - this.getBoundingClientRect().top + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add ripple animation
    if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
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
// Debounced save function for better performance
let saveDataTimeout = null;
async function saveData() {
    if (!currentUsername) return;
    
    // Clear existing timeout
    if (saveDataTimeout) {
        clearTimeout(saveDataTimeout);
    }
    
    // Debounce save by 500ms
    saveDataTimeout = setTimeout(async () => {
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
    }, 500);
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
            userEmail = result.data.email || '';
            
            // Load study sessions from server if available
            if (result.data.studySessions && result.data.studySessions.length > 0) {
                const localKey = `studyData_${currentUsername}`;
                const localData = localStorage.getItem(localKey);
                
                if (!localData) {
                    // First time loading, use server data
                    studyData.sessions = result.data.studySessions;
                    studyData.dailyGoal = result.data.studyGoals?.daily || 2;
                    studyData.weeklyGoal = result.data.studyGoals?.weekly || 14;
                    localStorage.setItem(localKey, JSON.stringify(studyData));
                }
            }
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
        showAlert('Please enter a valid number between 1 and 10', 'warning');
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
    
    let html = `
        <div class="glass-card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-clock me-2"></i>Time Slot Configuration</h6>
                <button class="btn btn-sm btn-primary" onclick="showTimeSlotEditor()">
                    <i class="bi bi-pencil me-1"></i>Edit Time Slots
                </button>
            </div>
        </div>
        
        <div id="timeSlotEditor" class="glass-card p-3 mb-3" style="display: none;">
            <h6 class="mb-3"><i class="bi bi-gear me-2"></i>Customize Your Time Slots</h6>
            <div id="timeSlotInputs"></div>
            <div class="mt-3">
                <button class="btn btn-sm btn-success me-2" onclick="saveTimeSlots()">
                    <i class="bi bi-check-circle me-1"></i>Save Time Slots
                </button>
                <button class="btn btn-sm btn-secondary" onclick="hideTimeSlotEditor()">
                    <i class="bi bi-x-circle me-1"></i>Cancel
                </button>
            </div>
        </div>
    `;
    
    html += '<div class="timetable-grid">';
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

function showTimeSlotEditor() {
    const editor = document.getElementById('timeSlotEditor');
    const inputs = document.getElementById('timeSlotInputs');
    
    let html = '';
    timeSlots.forEach((slot, index) => {
        const [start, end] = slot.split('-');
        html += `
            <div class="row g-2 mb-2 align-items-center">
                <div class="col-auto">
                    <strong>Slot ${index + 1}:</strong>
                </div>
                <div class="col">
                    <input type="time" 
                           id="slotStart${index}" 
                           class="form-control form-control-sm" 
                           value="${convertTo24Hour(start)}">
                </div>
                <div class="col-auto">to</div>
                <div class="col">
                    <input type="time" 
                           id="slotEnd${index}" 
                           class="form-control form-control-sm" 
                           value="${convertTo24Hour(end)}">
                </div>
                <div class="col-auto">
                    <button class="btn btn-sm btn-danger" onclick="removeTimeSlot(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `
        <button class="btn btn-sm btn-outline-primary mt-2" onclick="addTimeSlot()">
            <i class="bi bi-plus-circle me-1"></i>Add Time Slot
        </button>
    `;
    
    inputs.innerHTML = html;
    editor.style.display = 'block';
}

function hideTimeSlotEditor() {
    document.getElementById('timeSlotEditor').style.display = 'none';
}

function convertTo24Hour(time) {
    // Convert time like "9:00 AM" or "1:00 PM" to 24-hour format "09:00" or "13:00"
    time = time.trim();
    const isPM = time.includes('PM');
    const isAM = time.includes('AM');
    
    // Remove AM/PM
    time = time.replace(/AM|PM/gi, '').trim();
    
    const parts = time.split(':');
    let hour = parseInt(parts[0]);
    const minute = parts[1] || '00';
    
    // Convert to 24-hour format
    if (isPM && hour !== 12) {
        hour += 12;
    } else if (isAM && hour === 12) {
        hour = 0;
    } else if (!isAM && !isPM && hour < 8 && hour !== 12) {
        // If no AM/PM specified and hour is less than 8, assume PM
        hour += 12;
    }
    
    return hour.toString().padStart(2, '0') + ':' + minute;
}

function convertTo12Hour(time24) {
    // Convert 24-hour format to 12-hour format with AM/PM
    const [hour, minute] = time24.split(':');
    let h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    
    if (h === 0) h = 12;
    else if (h > 12) h = h - 12;
    
    return h + ':' + minute + ' ' + ampm;
}

function addTimeSlot() {
    timeSlots.push('9:00 AM-10:00 AM');
    showTimeSlotEditor();
}

function removeTimeSlot(index) {
    if (timeSlots.length <= 1) {
        showAlert('You must have at least one time slot', 'warning');
        return;
    }
    
    // Remove timetable entries for this slot
    const slotToRemove = timeSlots[index];
    days.forEach(day => {
        const key = `${day}-${slotToRemove}`;
        delete timetable[key];
    });
    
    timeSlots.splice(index, 1);
    showTimeSlotEditor();
}

function saveTimeSlots() {
    const newTimeSlots = [];
    const oldTimeSlots = [...timeSlots];
    
    for (let i = 0; i < timeSlots.length; i++) {
        const startInput = document.getElementById(`slotStart${i}`);
        const endInput = document.getElementById(`slotEnd${i}`);
        
        if (!startInput || !endInput) continue;
        
        const start = convertTo12Hour(startInput.value);
        const end = convertTo12Hour(endInput.value);
        const newSlot = `${start}-${end}`;
        
        newTimeSlots.push(newSlot);
        
        // Update timetable keys if slot changed
        if (oldTimeSlots[i] !== newSlot) {
            days.forEach(day => {
                const oldKey = `${day}-${oldTimeSlots[i]}`;
                const newKey = `${day}-${newSlot}`;
                if (timetable[oldKey] !== undefined) {
                    timetable[newKey] = timetable[oldKey];
                    delete timetable[oldKey];
                }
            });
        }
    }
    
    timeSlots = newTimeSlots;
    hideTimeSlotEditor();
    generateTimetableGrid();
    saveData();
    showAlert('Time slots updated successfully!', 'success');
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
    document.getElementById('profileEmail').textContent = userEmail || '-';
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
    
    checkPremiumStatus();
}

// Premium Payment Functions
async function checkPremiumStatus() {
    try {
        const response = await fetch('/check_premium');
        const result = await response.json();
        
        const container = document.getElementById('premiumStatusDisplay');
        if (!container) return;
        
        if (result.success && result.premium) {
            const expiry = new Date(result.expiry);
            const expiryStr = expiry.toLocaleDateString();
            container.innerHTML = `
                <div class="alert alert-success mb-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-check-circle-fill fs-3 me-3"></i>
                            <div>
                                <h6 class="mb-1">Premium Active ✨</h6>
                                <small>Valid until ${expiryStr}</small>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="deactivatePremium()" title="Deactivate Premium">
                            <i class="bi bi-x-circle me-1"></i>Deactivate
                        </button>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="text-center py-3">
                    <i class="bi bi-star fs-1 text-warning mb-3"></i>
                    <h6 class="mb-2">Upgrade to Premium</h6>
                    <p class="text-muted small mb-3">Unlock AI-powered features</p>
                    <ul class="list-unstyled text-start mb-3">
                        <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Grade Predictor</li>
                        <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Advanced Analytics</li>
                        <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>AI Study Insights</li>
                    </ul>
                    <div class="mb-3">
                        <span class="h3 fw-bold text-primary-custom">₹99</span>
                        <span class="text-muted">/year</span>
                    </div>
                    <button class="btn btn-primary-custom w-100" onclick="showPaymentModal()">
                        <i class="bi bi-lightning-fill me-2"></i>Upgrade Now
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error checking premium status:', error);
    }
}

function showPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function selectPaymentMethod(method) {
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('border-primary', 'border-3');
    });
    event.currentTarget.classList.add('border-primary', 'border-3');
    
    const qrSection = document.getElementById('qrCodeSection');
    const cardSection = document.getElementById('cardSection');
    const upiSection = document.getElementById('upiSection');
    
    qrSection.style.display = 'none';
    cardSection.style.display = 'none';
    upiSection.style.display = 'none';
    
    if (method === 'upi') {
        qrSection.style.display = 'block';
        upiSection.style.display = 'block';
    } else if (method === 'card') {
        cardSection.style.display = 'block';
    }
}

async function processPayment() {
    const btn = document.getElementById('payBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    
    setTimeout(async () => {
        try {
            const response = await fetch('/activate_premium_demo', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('paymentForm').style.display = 'none';
                document.getElementById('paymentSuccess').style.display = 'block';
                setTimeout(() => {
                    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
                    checkPremiumStatus();
                    showAlert('Premium activated successfully! 🎉', 'success');
                }, 2000);
            } else {
                showAlert('Payment failed: ' + result.message, 'danger');
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-lock-fill me-2"></i>Pay ₹99';
            }
        } catch (error) {
            showAlert('Error processing payment. Please try again.', 'danger');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock-fill me-2"></i>Pay ₹99';
        }
    }, 2000);
}

async function deactivatePremium() {
    if (!confirm('Are you sure you want to deactivate Premium? You will lose access to all premium features.')) {
        return;
    }
    
    try {
        const response = await fetch('/deactivate_premium', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        const result = await response.json();
        
        if (result.success) {
            showAlert('Premium deactivated successfully', 'info');
            checkPremiumStatus();
        } else {
            showAlert('Failed to deactivate premium: ' + result.message, 'danger');
        }
    } catch (error) {
        showAlert('Error deactivating premium. Please try again.', 'danger');
    }
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

// Enhanced alert with slide-in animation
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.cssText = `
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translate(-50%, -100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    alertDiv.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // Slide in
    setTimeout(() => {
        alertDiv.style.transform = 'translate(-50%, 0)';
        alertDiv.classList.add('show');
    }, 10);
    
    // Slide out and remove
    setTimeout(() => {
        alertDiv.style.transform = 'translate(-50%, -100%)';
        setTimeout(() => alertDiv.remove(), 300);
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
        const today = getLocalDateString();
        
        if (duration > 0) {
            studyData.sessions.push({
                subject: currentSubject,
                date: today,
                duration: duration
            });
            studyData.totalMinutes += duration;
            
            if (studyData.lastStudyDate !== today) {
                const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
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

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

function parseLocalDate(dateStr) {
    // Parse dd/mm/yyyy format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
}

function updateStudyStats() {
    const today = getLocalDateString();
    const todayMinutes = studyData.sessions.filter(s => s.date === today).reduce((sum, s) => sum + s.duration, 0);
    const weekStart = new Date(Date.now() - 6 * 86400000);
    const weekMinutes = studyData.sessions.filter(s => {
        const sessionDate = parseLocalDate(s.date);
        return sessionDate >= weekStart;
    }).reduce((sum, s) => sum + s.duration, 0);
    
    document.getElementById('todayTime').textContent = Math.floor(todayMinutes / 60) + 'h ' + (todayMinutes % 60) + 'm';
    document.getElementById('weekTime').textContent = Math.floor(weekMinutes / 60) + 'h ' + (weekMinutes % 60) + 'm';
    document.getElementById('totalSessions').textContent = studyData.sessions.length;
    document.getElementById('studyStreak').textContent = studyData.streak + ' days';
    
    updateGoalProgress(todayMinutes, weekMinutes);
    updateWeeklyStudyChart();
    updateSubjectStudyChart();
    updateStudyHistory();
    updateAIInsights();
}

async function updateAIInsights() {
    const container = document.getElementById('aiInsights');
    if (!container) return;
    
    if (!studyData.sessions || studyData.sessions.length < 3) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-lightbulb" style="font-size: 2rem; opacity: 0.3;"></i>
                <p class="small mt-2">Complete 3+ study sessions to unlock AI insights</p>
            </div>
        `;
        return;
    }
    
    try {
        // Get productivity analytics
        const analyticsResponse = await fetch('/api/study_analytics', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({study_sessions: studyData.sessions})
        });
        const analyticsResult = await analyticsResponse.json();
        
        // Get subject recommendation
        const recommendResponse = await fetch('/api/recommend_subject', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                study_sessions: studyData.sessions,
                subjects: subjects,
                attendance_data: attendanceData
            })
        });
        const recommendResult = await recommendResponse.json();
        
        if (analyticsResult.success) {
            const analytics = analyticsResult.analytics;
            let html = `
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted">Productivity Score</small>
                        <span class="badge ${analytics.productivity_score >= 70 ? 'bg-success' : analytics.productivity_score >= 40 ? 'bg-warning' : 'bg-danger'}">
                            ${analytics.productivity_score}%
                        </span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${analytics.productivity_score >= 70 ? 'bg-success' : analytics.productivity_score >= 40 ? 'bg-warning' : 'bg-danger'}" 
                             style="width: ${analytics.productivity_score}%"></div>
                    </div>
                </div>
            `;
            
            if (recommendResult.success && recommendResult.recommendation) {
                const rec = recommendResult.recommendation;
                html += `
                    <div class="alert alert-info p-2 mb-2">
                        <small class="fw-bold"><i class="bi bi-star me-1"></i>Recommended:</small><br>
                        <small>${rec.subject_name}</small><br>
                        <small class="text-muted">${rec.reason}</small>
                    </div>
                `;
            }
            
            if (analytics.insights && analytics.insights.length > 0) {
                analytics.insights.slice(0, 2).forEach(insight => {
                    const icon = insight.type === 'success' ? 'check-circle' : insight.type === 'warning' ? 'exclamation-triangle' : 'info-circle';
                    const color = insight.type === 'success' ? 'success' : insight.type === 'warning' ? 'warning' : 'info';
                    html += `
                        <div class="alert alert-${color} p-2 mb-2">
                            <small><i class="bi bi-${icon} me-1"></i>${insight.message}</small>
                        </div>
                    `;
                });
            }
            
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error fetching AI insights:', error);
    }
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
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = [0, 0, 0, 0, 0, 0, 0];
    const weekDates = [];
    const labels = [];
    
    const today = new Date();
    
    // Generate labels with day name and date for last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        weekDates.push(date);
        const dayName = dayNames[date.getDay()];
        const dateStr = (date.getMonth() + 1) + '/' + date.getDate();
        labels.push(dayName + '\n' + dateStr);
    }
    
    if (studyData.sessions && studyData.sessions.length > 0) {
        studyData.sessions.forEach(session => {
            try {
                const sessionDate = parseLocalDate(session.date);
                const daysDiff = Math.floor((today - sessionDate) / 86400000);
                if (daysDiff >= 0 && daysDiff < 7) {
                    const index = 6 - daysDiff;
                    weekData[index] += session.duration;
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
                labels: labels,
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

function updateStudyHistory(filteredSessions = null) {
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
    
    const sessionsToShow = filteredSessions || studyData.sessions.slice().reverse();
    const displaySessions = filteredSessions ? sessionsToShow : sessionsToShow.slice(0, 10);
    
    if (displaySessions.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No sessions found for the selected date range.
            </div>
        `;
        return;
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Date & Day</th><th>Subject</th><th>Duration</th></tr></thead><tbody>';
    
    displaySessions.forEach(session => {
        const subject = subjects.find(s => s.id == session.subject);
        const subjectName = subject ? subject.name : 'Unknown';
        const hours = Math.floor(session.duration / 60);
        const mins = session.duration % 60;
        const duration = hours > 0 ? hours + 'h ' + mins + 'm' : mins + 'm';
        
        const sessionDate = parseLocalDate(session.date);
        const dayName = dayNames[sessionDate.getDay()];
        const dateStr = session.date;
        
        html += `
            <tr>
                <td>
                    <i class="bi bi-calendar3 me-2"></i>${dateStr}<br>
                    <small class="text-muted">${dayName}</small>
                </td>
                <td><span class="badge bg-primary">${subjectName}</span></td>
                <td><i class="bi bi-clock me-2"></i>${duration}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    
    if (!filteredSessions && studyData.sessions.length > 10) {
        html += '<div class="text-center mt-2"><small class="text-muted">Showing 10 most recent sessions out of ' + studyData.sessions.length + ' total</small></div>';
    } else if (filteredSessions) {
        html += '<div class="text-center mt-2"><small class="text-muted">Showing ' + displaySessions.length + ' filtered session(s)</small></div>';
    }
    
    container.innerHTML = html;
}

function filterStudyHistory() {
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    
    if (!fromDate && !toDate) {
        showAlert('Please select at least one date', 'warning');
        return;
    }
    
    let filtered = studyData.sessions.slice();
    
    if (fromDate) {
        const fromDateObj = new Date(fromDate);
        filtered = filtered.filter(s => parseLocalDate(s.date) >= fromDateObj);
    }
    
    if (toDate) {
        const toDateObj = new Date(toDate);
        filtered = filtered.filter(s => parseLocalDate(s.date) <= toDateObj);
    }
    
    filtered.reverse();
    updateStudyHistory(filtered);
}

function clearHistoryFilter() {
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    updateStudyHistory();
}

// Initialize premium check on profile tab
if (document.getElementById('premiumStatusDisplay')) {
    checkPremiumStatus();
}