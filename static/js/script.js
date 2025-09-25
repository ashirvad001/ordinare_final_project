// static/js/script.js
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

window.onload = function() {
    checkAuthAndLoadData();
};

async function checkAuthAndLoadData() {
    try {
        const response = await fetch('/check_auth');
        const result = await response.json();
        if (result.authenticated) {
            currentUsername = result.username;
            updateLoginState(true);
            await loadData();
            updateAllDisplays();
            showTab('setup');
        } else {
            updateLoginState(false);
            showTab('login');
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        updateLoginState(false);
    }
}

function updateLoginState(isLoggedIn) {
    const appTabs = ['setupTab', 'timetableTab', 'attendanceTab', 'subjectwiseTab', 'analyticsTab', 'profileTab', 'uploadTab'];
    const authTabs = ['loginTab', 'signupTab'];

    appTabs.forEach(tabId => document.getElementById(tabId).style.display = isLoggedIn ? 'block' : 'none');
    authTabs.forEach(tabId => document.getElementById(tabId).style.display = isLoggedIn ? 'none' : 'block');

    if (!isLoggedIn) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById('login').classList.add('active');
        document.querySelector('.tab-button.active')?.classList.remove('active');
        document.getElementById('loginTab').classList.add('active');
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));

    const tabContent = document.getElementById(tabName);
    const tabButton = document.getElementById(tabName + 'Tab');

    if (tabContent) tabContent.classList.add('active');
    if (tabButton) tabButton.classList.add('active');

    if (tabName === 'attendance') generateAttendanceUI();
    if (tabName === 'analytics') updateAnalyticsDisplay();
    if (tabName === 'subjectwise') updateSubjectWiseDisplay();
    if (tabName === 'profile') updateProfileDisplay();

    updateTimetableLockState();
    updateUploadLockState();
    updateAnalyticsLockState();
}


async function signupUser() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const result = await response.json();
    if (result.success) {
        alert('Signup successful! Please log in.');
        showTab('login');
    } else {
        alert('Signup failed: ' + result.message);
    }
}

async function loginUser() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const result = await response.json();
    if (result.success) {
        await checkAuthAndLoadData();
    } else {
        alert('Login failed: ' + result.message);
    }
}

async function logout() {
    await fetch('/logout', { method: 'POST' });
    currentUsername = null;
    subjects = [];
    timetable = {};
    attendanceData = {};
    updateLoginState(false);
    showTab('login');
}

async function saveData() {
    if (!currentUsername) return;
    const dataToSave = { subjects, timetable, attendanceData, timeSlots, studentName, universityRollNo };
    await fetch('/save_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
    });
}

async function loadData() {
    if (!currentUsername) return;
    const response = await fetch('/get_data');
    const result = await response.json();
    if (result.success && result.data) {
        subjects = result.data.subjects || [];
        timetable = result.data.timetable || {};
        attendanceData = result.data.attendanceData || {};
        timeSlots = result.data.timeSlots || ['9:00-10:00', '10:00-11:00', '12:00-1:00', '1:00-2:00', '2:00-3:00', '3:00-4:00', '4:00-5:00'];
        studentName = result.data.studentName || '';
        universityRollNo = result.data.universityRollNo || '';
    }
}

function updateAllDisplays() {
    populateSetupTab();
    generateTimetableGrid();
    updateSubjectWiseDisplay();
    updateAnalyticsDisplay();
    updateProfileDisplay();
    updateTimetableLockState();
    updateUploadLockState();
    updateAnalyticsLockState();
}

function generateSubjectInputs() {
    const numSubjects = parseInt(document.getElementById('numSubjects').value);
    const container = document.getElementById('subjectInputs');
    let html = '<h3>Enter Subject Details:</h3>';
    for (let i = 0; i < numSubjects; i++) {
        html += `<div class="form-group">
            <label>Subject ${i+1} Name:</label>
            <input type="text" id="subject${i}" class="subject-name-input">
        </div>`;
    }
    html += '<button class="btn" onclick="saveSubjects()">Save Subjects</button>';
    container.innerHTML = html;
}

function saveSubjects() {
    const numSubjects = parseInt(document.getElementById('numSubjects').value);
    studentName = document.getElementById('studentName').value.trim();
    universityRollNo = document.getElementById('universityRollNo').value.trim();
    subjects = [];
    for (let i = 0; i < numSubjects; i++) {
        const name = document.getElementById(`subject${i}`).value.trim();
        if (name) {
            subjects.push({ id: i, name });
        }
    }
    document.getElementById('setupComplete').style.display = 'block';
    saveData();
    updateAllDisplays();
}


function generateTimetableGrid() {
    const container = document.getElementById('timetableContainer');
    if (subjects.length === 0) {
        container.innerHTML = '<div class="no-data">Please complete the setup first</div>';
        return;
    }
    let html = '<div class="timetable-grid">';
    html += '<div class="timetable-header">Time</div>';
    days.forEach(d => html += `<div class="timetable-header">${d}</div>`);
    timeSlots.forEach(timeSlot => {
        html += `<div class="timetable-cell time-slot">${timeSlot}</div>`;
        days.forEach(day => {
            const id = `${day}-${timeSlot}`;
            const selectedSubjectId = timetable[id] || "";
            let options = '<option value="">Free</option>';
            subjects.forEach(s => {
                options += `<option value="${s.id}" ${selectedSubjectId == s.id ? 'selected' : ''}>${s.name}</option>`;
            });
            html += `<div class="timetable-cell">
                <select id="${id}" onchange="updateTimetable('${id}')">${options}</select>
            </div>`;
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
    document.getElementById('timetableComplete').style.display = 'block';
}

function populateSetupTab() {
    document.getElementById('studentName').value = studentName;
    document.getElementById('universityRollNo').value = universityRollNo;
    if (subjects.length > 0) {
        document.getElementById('numSubjects').value = subjects.length;
        generateSubjectInputs();
        subjects.forEach((s, i) => {
            document.getElementById(`subject${i}`).value = s.name;
        });
    }
}

function generateAttendanceUI() {
    const container = document.getElementById('attendanceContainer');
    if (!subjects.length || Object.keys(timetable).length === 0) {
        container.innerHTML = '<div class="no-data">Please set up subjects and timetable first</div>';
        return;
    }

    const today = new Date();
    const dayName = days[today.getDay() - 1];
    if (!dayName) {
        container.innerHTML = '<div class="no-data">No classes today (weekend).</div>';
        return;
    }

    let html = `<h3>${dayName}'s Attendance</h3>`;
    const todayStr = today.toISOString().split('T')[0];
    let classesToday = false;

    timeSlots.forEach(slot => {
        const key = `${dayName}-${slot}`;
        const subjectId = timetable[key];
        if (subjectId !== undefined) {
            classesToday = true;
            const subject = subjects.find(s => s.id == subjectId);
            if (!subject) return;

            const subjectData = attendanceData[subjectId] || { records: [] };
            const recordKey = `${subjectId}-${todayStr}-${slot}`;
            const existingRecord = subjectData.records.find(r => r.key === recordKey);

            let buttons = '';
            if (existingRecord) {
                buttons = `<span>Marked as ${existingRecord.status}</span>`;
            } else {
                buttons = `
                    <button class="btn" onclick="markAttendance(${subjectId}, 'present', '${slot}')">Present</button>
                    <button class="btn" onclick="markAttendance(${subjectId}, 'absent', '${slot}')">Absent</button>
                `;
            }
            html += `<div style="display:flex; justify-content:space-between; align-items:center; padding: 8px; border-bottom: 1px solid #eee;">
                <span>${slot} - ${subject.name}</span>
                <div>${buttons}</div>
            </div>`;
        }
    });

    if (!classesToday) {
        html += '<div class="no-data">No classes scheduled for today.</div>';
    }
    container.innerHTML = html;
}


async function markAttendance(subjectId, status, timeSlot) {
    const todayStr = new Date().toISOString().split('T')[0];
    const recordKey = `${subjectId}-${todayStr}-${timeSlot}`;

    if (!attendanceData[subjectId]) {
        attendanceData[subjectId] = { total: 0, attended: 0, records: [] };
    }

    // Prevent duplicate marking
    if (attendanceData[subjectId].records.some(r => r.key === recordKey)) {
        alert('This class has already been marked.');
        return;
    }

    attendanceData[subjectId].total++;
    if (status === 'present') {
        attendanceData[subjectId].attended++;
    }
    attendanceData[subjectId].records.push({ key: recordKey, status: status });

    await saveData();
    generateAttendanceUI(); // Refresh the UI
    updateAnalyticsLockState();
}

function updateSubjectWiseDisplay() {
    const container = document.getElementById('subjectWiseAttendanceContent');
    if (!subjects.length) {
        container.innerHTML = '<div class="no-data">No subject data available.</div>';
        return;
    }
    let html = '';
    subjects.forEach(subject => {
        const data = attendanceData[subject.id] || { total: 0, attended: 0 };
        const percentage = data.total > 0 ? ((data.attended / data.total) * 100).toFixed(2) : "0.00";
        html += `<p>${subject.name}: ${data.attended} / ${data.total} (${percentage}%)</p>`;
    });
    container.innerHTML = html;
}

function updateAnalyticsDisplay() {
    let totalClasses = 0;
    let attendedClasses = 0;
    for (const subjectId in attendanceData) {
        totalClasses += attendanceData[subjectId].total;
        attendedClasses += attendanceData[subjectId].attended;
    }
    const overallPercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : "0.00";
    document.getElementById('overallAttendanceDisplay').textContent = `Overall: ${attendedClasses} / ${totalClasses} (${overallPercentage}%)`;
    fetchAttendancePlot();
}

async function fetchAttendancePlot() {
    const plotContainer = document.getElementById('attendancePlotDisplay');
    try {
        const response = await fetch('/get_attendance_plot');
        const result = await response.json();
        if (result.success && result.image) {
            plotContainer.innerHTML = `<img src="data:image/png;base64,${result.image}" style="max-width:100%;">`;
        } else {
            plotContainer.innerHTML = `<div class="no-data">${result.message || 'Could not load plot.'}</div>`;
        }
    } catch (error) {
        plotContainer.innerHTML = '<div class="no-data">Error loading plot.</div>';
    }
}


function calculateBunks() {
    const targetPercentage = parseInt(document.getElementById('targetPercentage').value);
    let resultsHtml = '';
    subjects.forEach(subject => {
        const data = attendanceData[subject.id] || { total: 0, attended: 0 };
        let { total, attended } = data;
        const currentPercentage = total > 0 ? (attended / total) * 100 : 100;
        resultsHtml += `<h4>${subject.name} (${currentPercentage.toFixed(1)}%)</h4>`;

        if (currentPercentage >= targetPercentage) {
            let bunksAllowed = 0;
            let tempTotal = total;
            while (((attended / (tempTotal + 1)) * 100) >= targetPercentage) {
                bunksAllowed++;
                tempTotal++;
            }
            resultsHtml += `<p>You can safely bunk ${bunksAllowed} more class(es).</p>`;
        } else {
            let classesNeeded = 0;
            let tempAttended = attended;
            let tempTotal = total;
            while (((tempAttended / tempTotal) * 100) < targetPercentage) {
                classesNeeded++;
                tempAttended++;
                tempTotal++;
                if (classesNeeded > 1000) { // safety break
                    classesNeeded = "many";
                    break;
                }
            }
            resultsHtml += `<p>You need to attend the next ${classesNeeded} class(es) to reach ${targetPercentage}%.</p>`;
        }
    });
    document.getElementById('bunkResults').innerHTML = resultsHtml;
}


async function uploadAttendanceFile() {
    const fileInput = document.getElementById('attendanceFile');
    const messageDiv = document.getElementById('uploadMessage');
    if (fileInput.files.length === 0) {
        messageDiv.textContent = 'Please select a file.';
        return;
    }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const response = await fetch('/upload_attendance', {
        method: 'POST',
        body: formData,
    });
    const result = await response.json();
    messageDiv.textContent = result.message;
    if (result.success) {
        await loadData();
        updateAllDisplays();
    }
}

function updateProfileDisplay() {
    document.getElementById('profileUsername').textContent = currentUsername || '-';
    document.getElementById('profileStudentName').textContent = studentName || '-';
    document.getElementById('profileRollNo').textContent = universityRollNo || '-';
    document.getElementById('profileSemester').textContent = document.getElementById('semesterName').value || '-';
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


function togglePassword(id) {
    const field = document.getElementById(id);
    const button = field.nextElementSibling;
    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = 'Hide';
    } else {
        field.type = 'password';
        button.textContent = 'Show';
    }
}

function updateTimetableLockState() {
    const isSetupDone = subjects && subjects.length > 0;
    document.getElementById('timetableLocked').style.display = isSetupDone ? 'none' : 'flex';
    document.getElementById('timetableUnlocked').style.display = isSetupDone ? 'block' : 'none';
}

function updateUploadLockState() {
    const isSetupDone = subjects && subjects.length > 0;
    document.getElementById('uploadLocked').style.display = isSetupDone ? 'none' : 'flex';
    document.getElementById('uploadUnlocked').style.display = isSetupDone ? 'block' : 'none';
}

function updateAnalyticsLockState() {
    let hasAttendance = false;
    for (const subjectId in attendanceData) {
        if (attendanceData[subjectId].total > 0) {
            hasAttendance = true;
            break;
        }
    }
    document.getElementById('analyticsLocked').style.display = hasAttendance ? 'none' : 'flex';
    document.getElementById('analyticsUnlocked').style.display = hasAttendance ? 'block' : 'none';
}

async function clearAllData() {
    if (confirm("Are you sure you want to clear ALL your data? This cannot be undone.")) {
        await fetch('/clear_data', { method: 'POST' });
        await checkAuthAndLoadData();
        alert('All data has been cleared.');
    }
}