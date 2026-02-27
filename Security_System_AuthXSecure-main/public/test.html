<!DOCTYPE html>
<html>
<head>
  <title>Login Test</title>
  <style>
    body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
    button { padding: 15px 30px; font-size: 18px; margin: 10px; cursor: pointer; background: #667eea; color: white; border: none; border-radius: 5px; }
    button:hover { background: #5568d3; }
    .log { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; white-space: pre-wrap; }
    .success { background: #d4edda; color: #155724; }
    .error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>🧪 Login Test</h1>
  <p><strong>Your credentials are pre-filled. Just click the button!</strong></p>
  
  <button onclick="testLogin()">🔓 TEST LOGIN NOW</button>
  
  <div id="log"></div>
  
  <script>
    function log(message, type = '') {
      const logDiv = document.getElementById('log');
      const entry = document.createElement('div');
      entry.className = 'log ' + type;
      entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
      logDiv.appendChild(entry);
      console.log(message);
    }
    
    async function testLogin() {
      document.getElementById('log').innerHTML = '';
      
      log('🚀 Starting login test...');
      log('Email: 230589.ec@rmkec.ac.in');
      log('Password: keerthi123');
      
      const email = '230589.ec@rmkec.ac.in';
      const password = 'keerthi123';
      
      try {
        log('📡 Sending request to: http://localhost:3000/api/auth/signin');
        
        const response = await fetch('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        log('📥 Response received');
        log('Status: ' + response.status);
        log('Status Text: ' + response.statusText);
        log('OK: ' + response.ok);
        
        const data = await response.json();
        log('📦 Response data: ' + JSON.stringify(data, null, 2));
        
        if (response.ok && data.token) {
          log('✅ LOGIN SUCCESSFUL!', 'success');
          log('Token: ' + data.token.substring(0, 50) + '...');
          log('User: ' + data.user.nickname + ' (' + data.user.email + ')');
          
          // Save to localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          log('💾 Saved to localStorage');
          
          log('🎉 YOU ARE NOW LOGGED IN!', 'success');
          log('Redirecting to main app in 3 seconds...');
          
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          
        } else {
          log('❌ LOGIN FAILED', 'error');
          log('Message: ' + data.message);
        }
        
      } catch (error) {
        log('❌ ERROR: ' + error.message, 'error');
        log('Error details: ' + error.stack);
      }
    }
    
    log('✅ Page loaded and ready');
    log('Click the button above to test login');
  </script>
</body>
</html>
