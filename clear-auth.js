// Run this in the browser console to clear authentication
console.log('Clearing authentication data...');
localStorage.removeItem('token');
sessionStorage.removeItem('clearAuthOnStart');
console.log('Token and session data removed from storage');
console.log('Please refresh the page to see the changes');
console.log('You should now see the logged-out state with Sign Up and Log In buttons'); 