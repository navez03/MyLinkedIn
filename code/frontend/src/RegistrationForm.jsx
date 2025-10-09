import React, { useState } from 'react';
import { Mail, Lock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { authAPI } from './services/api';

export default function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password is too weak. Must be at least 8 characters';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password is too weak. Must include uppercase, lowercase, and numbers';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setApiError('');
    setIsSubmitting(true);

    // Validate email
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setIsSubmitting(false);
      return;
    }

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      setIsSubmitting(false);
      return;
    }

    // Call API to register user
    try {
      const result = await authAPI.register(email, password);

      if (result.success) {
        setIsRegistered(true);
      } else {
        setApiError(result.error);
      }
    } catch (error) {
      setApiError('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return { text: 'Weak', color: 'text-red-500' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { text: 'Weak', color: 'text-red-500' };
    if (password.length >= 12) return { text: 'Strong', color: 'text-green-500' };
    return { text: 'Good', color: 'text-yellow-500' };
  };

  const passwordStrength = getPasswordStrength();

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Account Registered!
          </h2>
          <p className="text-gray-600 mb-6">
            Your account has been successfully created. Welcome aboard!
          </p>
          <button
            onClick={() => {
              setIsRegistered(false);
              setEmail('');
              setPassword('');
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Register Another Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Sign up to get started</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border ${emailError ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                placeholder="you@example.com"
              />
            </div>
            {emailError && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <XCircle className="h-4 w-4 mr-1" />
                {emailError}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border ${passwordError ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                placeholder="Enter your password"
              />
            </div>
            {passwordStrength && (
              <div className="mt-2 flex items-center text-sm">
                <span className="text-gray-600 mr-2">Strength:</span>
                <span className={`font-medium ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </span>
              </div>
            )}
            {passwordError && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {passwordError}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Password must be at least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="text-red-600 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {apiError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${isSubmitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
