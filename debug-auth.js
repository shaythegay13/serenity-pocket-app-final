// Debug authentication - run this in console
const token = localStorage.getItem('sb-wlutkohnrwpfakxwazlj-auth-token');

console.log('Token found:', !!token);
console.log('Token length:', token?.length);
console.log('Token starts with:', token?.substring(0, 20) + '...');

if (token) {
  // Test debug endpoint
  fetch('/api/admin/debug', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(data => {
    console.log('🔍 Debug Result:', data);
    
    if (data.user) {
      console.log('✅ User authenticated:', data.user.email);
      console.log('🔐 Admin status:', data.user.isAdmin);
      
      if (data.user.isAdmin) {
        console.log('🎉 You should have admin access! Trying admin endpoint...');
        
        // Now try the real admin endpoint
        return fetch('/api/admin/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        console.log('❌ User not admin. Email:', data.user.email);
        console.log('Expected: playmindlabsllc@gmail.com or info@playmindlabs.com');
      }
    }
  })
  .then(r => r.json())
  .then(adminData => {
    if (adminData) {
      console.log('📊 Admin Dashboard Data:', adminData);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
} else {
  console.log('❌ No token found in localStorage');
}
