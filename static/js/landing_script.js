// Initialize AOS
AOS.init({ duration: 800, once: true });

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
    const username = document.getElementById('modalSignupUsername').value;
    const password = document.getElementById('modalSignupPassword').value;
    
    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
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
