// MyAuthApp/utils/validation.js
// Email validation
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };
  
  // Password validation
  export const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return '';
  };
  
  // Name validation
  export const validateName = (name) => {
    if (!name) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters long';
    return '';
  };
  
  // Form validation for login
  export const validateLoginForm = (email, password) => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    return {
      isValid: !emailError && !passwordError,
      emailError,
      passwordError,
    };
  };
  
  // Form validation for signup
  export const validateSignupForm = (name, email, password, confirmPassword) => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    let confirmPasswordError = '';
    if (!confirmPassword) {
      confirmPasswordError = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      confirmPasswordError = 'Passwords do not match';
    }
    
    return {
      isValid: !nameError && !emailError && !passwordError && !confirmPasswordError,
      nameError,
      emailError,
      passwordError,
      confirmPasswordError,
    };
  };