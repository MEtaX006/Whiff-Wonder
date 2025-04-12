async function isAuthenticated() {
    try {
        const response = await fetch('/api/verify-session', {
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Session verification failed');
        }

        const data = await response.json();
        return data.authenticated;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

async function updateNavigation() {
    try {
        const loginIcon = document.querySelector('.login-icon');
        if (loginIcon) {
            const authenticated = await isAuthenticated();
            loginIcon.href = authenticated ? '/profile' : '/login';
            loginIcon.innerHTML = authenticated ? '👤' : '🔑';
            
            // Add tooltip
            loginIcon.title = authenticated ? 'My Profile' : 'Login';
        }
    } catch (error) {
        console.error('Navigation update error:', error);
    }
}

function redirectIfNotAuthenticated(protectedPages = ['/profile']) {
    const currentPath = window.location.pathname;
    
    if (protectedPages.includes(currentPath)) {
        isAuthenticated().then(authenticated => {
            if (!authenticated) {
                const returnTo = encodeURIComponent(window.location.pathname);
                window.location.href = `/login?returnTo=${returnTo}`;
            }
        }).catch(error => {
            console.error('Authentication check failed:', error);
            window.location.href = '/login';
        });
    }
}

// Handle returnTo parameter after successful login
function handleLoginRedirect() {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo) {
        // Validate returnTo to prevent open redirect
        if (returnTo.startsWith('/') && !returnTo.includes('//')) {
            window.location.href = returnTo;
            return true;
        }
    }
    return false;
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await updateNavigation();
        redirectIfNotAuthenticated();

        // Add event listener for auth state changes
        document.addEventListener('authStateChanged', async () => {
            await updateNavigation();
        });

    } catch (error) {
        console.error('Auth check initialization error:', error);
    }
});
