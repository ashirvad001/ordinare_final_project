// Initialize AOS
AOS.init({ duration: 800, once: true });

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (systemPrefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'bi bi-moon-fill';
        } else {
            icon.className = 'bi bi-sun-fill';
        }
    }
}

// Initialize theme on page load
initTheme();

function showAuthModal(type) {
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    switchAuthForm(type);
    modal.show();
}

function switchAuthForm(type) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('modalLoginUsername').value;
    const password = document.getElementById('modalLoginPassword').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        
        if (result.success) {
            window.location.href = '/dashboard';
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById('modalSignupEmail').value;
    const username = document.getElementById('modalSignupUsername').value;
    const password = document.getElementById('modalSignupPassword').value;
    
    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Account created successfully! Please login.');
            switchAuthForm('login');
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert('Signup failed. Please try again.');
    }
}

function loginWithGoogle() {
    alert('Google login will be implemented soon! Please use regular login for now.');
    // TODO: Implement Google OAuth
    // window.location.href = '/auth/google';
}

function loginWithFacebook() {
    alert('Facebook login will be implemented soon! Please use regular login for now.');
    // TODO: Implement Facebook OAuth
    // window.location.href = '/auth/facebook';
}

function signupWithGoogle() {
    alert('Google signup will be implemented soon! Please use regular signup for now.');
    // TODO: Implement Google OAuth
    // window.location.href = '/auth/google';
}

function signupWithFacebook() {
    alert('Facebook signup will be implemented soon! Please use regular signup for now.');
    // TODO: Implement Facebook OAuth
    // window.location.href = '/auth/facebook';
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme);
