<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Smart Home</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .login-box {
      background: white;
      padding: 40px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      color: #667eea;
      text-align: center;
      margin-bottom: 30px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      color: #333;
      font-weight: bold;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 15px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover {
      background: #5568d3;
    }
    .message {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: none;
    }
    .success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .info {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 14px;
      color: #1565c0;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>🏠 Smart Home Login</h1>
    
    <div id="message" class="message"></div>
    
    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" value="230589.ec@rmkec.ac.in" required>
      </div>
      
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" value="keerthi123" required>
      </div>
      
      <button type="submit">Sign In</button>
    </form>
    
    <div class="info">
      <strong>Your Credentials:</strong><br>
      Email: 230589.ec@rmkec.ac.in<br>
      Password: keerthi123
    </div>
  </div>
  
  <script>
    console.log('Login page loaded');
    
    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted');
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      console.log('Email:', email);
      console.log('Password length:', password.length);
      
      showMessage('Logging in...', 'info');
      
      try {
        console.log('Sending request to: http://localhost:3000/api/auth/signin');
        
        const response = await fetch('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.token) {
          console.log('Login successful!');
          
          // Save to localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          showMessage('✅ Login Successful! Redirecting...', 'success');
          
          // Redirect to main app
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
          
        } else {
          console.error('Login failed:', data.message);
          showMessage('❌ Login Failed: ' + data.message, 'error');
        }
        
      } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Error: ' + error.message, 'error');
      }
    });
    
    function showMessage(text, type) {
      messageDiv.textContent = text;
      messageDiv.className = 'message ' + type;
      messageDiv.style.display = 'block';
    }
  </script>
</body>
</html>
