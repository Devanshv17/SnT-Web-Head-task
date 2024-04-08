import React, { useState } from 'react';
import { useRouter } from 'next/router';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username + '@iitk.ac.in', password }),
      });
  
      if (response.ok) {
        setIsRegistering(true); // Show OTP field after successful registration
        alert('OTP sent successfully'); // Set success message
        setError(null); // Clear any previous errors
      } else {
        const errorMessage = await response.text();
        setError(errorMessage || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch('http://localhost:8080/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username + '@iitk.ac.in', otp }),
      });
  
      if (response.ok) {
        alert('OTP verified successfully'); // Set success message
        router.push('/login'); // Redirect to login page after OTP verification
      } else {
        const errorMessage = await response.text();
        setError(errorMessage || 'OTP verification failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  
    setLoading(false);
  };
  

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username + '@iitk.ac.in', password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token); // Set JWT token in localStorage
        router.push('/main');
      } else {
        const errorMessage = await response.text();
        setError(errorMessage || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl text-white font-bold mb-4">EduWise</h1>
      <div className="bg-gray-300 rounded-2xl p-6 mb-4">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl mb-4">Login/Register Page</h1>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Roll Number "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border text-black rounded-md px-4 py-2 w-72"
            />
          </div>
          <div className="mb-2">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border text-black rounded-md px-4 py-2 w-72"
            />
          </div>
          {!isRegistering && (
            <div className="mb-2">
              <button onClick={handleLogin} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                Login
              </button>
            </div>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!isRegistering && (
            <p onClick={() => setIsRegistering(true)} className="text-blue-500 cursor-pointer mt-2">
              Don't have an account? Register here
            </p>
          )}
          {isRegistering && (
            <>
              <div className="mb-2">
                <button onClick={handleRegister} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                  Send OTP
                </button>
              </div>
              <p onClick={() => setIsRegistering(false)} className="text-blue-500 cursor-pointer mt-2">
                Already registered? Login here
              </p>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border text-black rounded-md px-4 py-2 w-72 mb-2"
              />
              <button onClick={handleVerifyOTP} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                Verify OTP
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
