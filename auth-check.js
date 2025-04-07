function isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

function updateNavigation() {
    const loginIcon = document.querySelector('.login-icon');
    if (loginIcon) {
        if (isAuthenticated()) {
            loginIcon.href = 'profile.html';
            loginIcon.innerHTML = '👤'; // Profile icon
        } else {
            loginIcon.href = 'login.html';
            loginIcon.innerHTML = '👤'; // Login icon
        }
    }
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    
    // Only redirect on protected pages
    const protectedPages = ['profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !isAuthenticated()) {
        window.location.href = 'login.html';
    }
});
