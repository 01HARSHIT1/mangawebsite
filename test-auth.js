// Test script to verify authentication flow
console.log('=== AUTHENTICATION TEST ===');

// Step 1: Clear authentication
console.log('Step 1: Clearing authentication...');
localStorage.removeItem('token');
sessionStorage.removeItem('clearAuthOnStart');
console.log('✅ Authentication cleared');

// Step 2: Check initial state
console.log('Step 2: Checking initial state...');
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Should show login/signup buttons');

// Step 3: Test login API
console.log('Step 3: Testing login API...');
fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'testuser@example.com',
        password: '123456'
    })
})
    .then(res => res.json())
    .then(data => {
        console.log('Login API response:', data);
        if (data.success) {
            console.log('✅ Login successful');
            console.log('Token received:', !!data.token);
            console.log('User data:', data.user);

            // Step 4: Test AuthContext login
            console.log('Step 4: Testing AuthContext login...');
            // This would be called by the login page
            console.log('Should call login(data.token, data.user)');
        } else {
            console.log('❌ Login failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Login API error:', error);
    });

console.log('Check browser console for detailed logs'); 