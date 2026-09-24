import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../../stores/user_slice';

// Custom hook for form validation
const useFormValidation = (initialState) => {
  const [errors, setErrors] = useState({});
  
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };
  
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };
  
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };
  
  const validateForm = (formData) => {
    const newErrors = {};
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };
  
  return { errors, setErrors, validateField, validateForm };
};

// Loading spinner component
const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Input field component
const InputField = ({ label, type, name, value, onChange, error, placeholder, required = true }) => (
  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-semibold mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200
        ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// Alert component
const Alert = ({ type, message, onClose }) => {
  const alertStyles = {
    success: 'bg-green-50 border-green-400 text-green-700',
    error: 'bg-red-50 border-red-400 text-red-700',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
    info: 'bg-blue-50 border-blue-400 text-blue-700'
  };
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  return (
    <div className={`${alertStyles[type]} border-l-4 p-4 rounded-md mb-4 animate-slideDown`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-lg mr-2">{icons[type]}</span>
          <span className="text-sm">{message}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Main Login Component
const LoginComponent = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState('');
  const [touched, setTouched] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  
  const { errors, setErrors, validateField, validateForm } = useFormValidation(formData);

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Handle navigation after successful login
  useEffect(() => {
    if (isSuccess && user) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      navigate('/dashboard', { replace: true });
    }
    
    if (isError && message) {
      setLocalError(message);
      const timer = setTimeout(() => setLocalError(''), 5000);
      return () => clearTimeout(timer);
    }
    
    return () => {
      dispatch(reset());
    };
  }, [user, isSuccess, isError, message, navigate, dispatch, rememberMe, formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate form before submission
    if (validateForm(formData)) {
      try {
        await dispatch(login(formData)).unwrap();
      } catch (error) {
        // Error is handled by Redux state
        console.error('Login failed:', error);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <h2 className="text-3xl font-bold text-white text-center">
            Welcome Back
          </h2>
          <p className="text-blue-100 text-center mt-2 text-sm">
            Sign in to continue to your account
          </p>
        </div>
        
        {/* Form Container */}
        <div className="px-8 py-6">
          {/* Error Alerts */}
          {(isError || localError) && (
            <Alert 
              type="error" 
              message={localError || message} 
              onClose={() => setLocalError('')}
            />
          )}
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <InputField
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              placeholder="john@example.com"
            />
            
            <div className="relative">
              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg 
                       hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition duration-300 transform hover:scale-105 font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/auth?mode=register" 
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
      
      
    </div>
  );
};

export default LoginComponent;