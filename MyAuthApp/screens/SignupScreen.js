// MyAuthApp/screens/SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Firebase config
import '../firebase/firebaseConfig'; // Make sure path is correct

// Import components and services
import Input from '../components/Input';
import Button from '../components/Button';
import { signup } from '../services/authService';
import { validateSignupForm } from '../utils/validation';

const SignupScreen = ({ navigation }) => {
  // State for form fields and errors
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle signup
  const handleSignup = async () => {
    // Validate form
    const validation = validateSignupForm(name, email, password, confirmPassword);
    
    // Set validation errors
    setNameError(validation.nameError);
    setEmailError(validation.emailError);
    setPasswordError(validation.passwordError);
    setConfirmPasswordError(validation.confirmPasswordError);
    
    // If form is not valid, return early
    if (!validation.isValid) {
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Call signup service
      const response = await signup(name, email, password);
      
      if (response.success) {
        // Signup successful - store login token to auto-login
        await AsyncStorage.setItem('userToken', response.user.uid);
        // Navigation is handled by the auth state listener in Navigation component
      } else {
        // Signup failed
        Alert.alert('Signup Failed', response.message);
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Text style={styles.logoText}>HT</Text>
            </View>
            <Text style={styles.appName}>Health Track</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Track your health journey with us</Text>
            
            <View style={styles.form}>
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                error={nameError}
              />
              
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />
              
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
                error={passwordError}
              />
              
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                error={confirmPasswordError}
              />
              
              <Text style={styles.termsText}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
              
              <Button
                title={isLoading ? "Creating Account..." : "Sign Up"}
                onPress={handleSignup}
                disabled={isLoading}
                style={styles.signupButton}
              />
              
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2E86C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86C1',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  signupButton: {
    backgroundColor: '#2E86C1',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#2E86C1',
    fontWeight: 'bold',
  },
});

export default SignupScreen;