// authentication functions

// sign up with email and password
async function signUp(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('User signed up:', userCredential.user.uid);
        return userCredential.user;
    } catch (error) {
        console.error('Sign up error:', error.message);
        throw error;
    }
}

// sign in with email and password
async function signIn(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User signed in:', userCredential.user.uid);
        return userCredential.user;
    } catch (error) {
        console.error('Sign in error:', error.message);
        throw error;
    }
}

// sign out
async function signOut() {
    try {
        await auth.signOut();
        console.log('User signed out');
        window.location.href = 'pages/login.html';
    } catch (error) {
        console.error('Sign out error:', error.message);
        throw error;
    }
}

// check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // user is signed in
        console.log('User authenticated:', user.uid);

        // update welcome button with user email
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            const displayName = user.email.split('@')[0];
            settingsBtn.textContent = `Welcome, ${displayName} ▾`;
        }

        // load user data
        if (typeof loadUserData === 'function') {
            loadUserData();
        }
    } else {
        // user is signed out - redirect to login
        if (!window.location.pathname.includes('pages/login.html') &&
            !window.location.pathname.includes('pages/landing.html')) {
            window.location.href = 'pages/login.html';
        }
    }
});
