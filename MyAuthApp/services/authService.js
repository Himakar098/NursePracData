// MyAuthApp/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';

// Storage keys
const TOKEN_STORAGE_KEY = 'userToken';
const CURRENT_USER_KEY = 'currentUser';

// Get Firebase instances directly
const getFirebaseAuth = () => getAuth();
const getFirebaseDb = () => getFirestore();

// Register a new user
export const signup = async (name, email, password) => {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Generate initial user profile data
    const userData = {
      name,
      email,
      createdAt: new Date().toISOString(),
      // Default values for health tracking
      isPatient: true,
      age: null,
      gender: 'Prefer not to say',
      region: '',
      condition: '',
      diagnosisDate: null,
      lastHospitalVisit: null,
      lastSurveyCompleted: null,
      surveyResults: [],
      firstLogin: true,
      profileCompleted: false,
      settings: {
        notifications: true,
        darkMode: false,
        reminderFrequency: 'weekly'
      }
    };
    
    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), userData);
    
    // Save user info to AsyncStorage for local state management
    const basicUserData = { uid: user.uid, name, email };
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(basicUserData));
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, user.uid);
    
    return {
      success: true,
      user: basicUserData
    };
  } catch (error) {
    console.error('Signup error:', error);
    let message = 'An error occurred during signup';
    
    if (error.code === 'auth/email-already-in-use') {
      message = 'Email already registered';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      // Record last login time
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: new Date().toISOString()
      });
      
      const userData = {
        uid: user.uid,
        name: userDoc.data().name,
        email: userDoc.data().email
      };
      
      // Save user info to AsyncStorage
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, user.uid);
      
      return {
        success: true,
        user: userData
      };
    } else {
      throw new Error('User data not found');
    }
  } catch (error) {
    console.error('Login error:', error);
    let message = 'An error occurred during login';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'Invalid email or password';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Logout user
export const logout = async () => {
  try {
    const auth = getFirebaseAuth();
    
    // Clear local storage first (this ensures our navigation responds immediately)
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    
    // Sign out from Firebase (will trigger onAuthStateChanged)
    await signOut(auth);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'An error occurred during logout'
    };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Check if user is logged in
export const isLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return token !== null;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

// Update user profile data
export const updateUserProfile = async (profileData) => {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !currentUser.uid) {
      return {
        success: false,
        message: 'No authenticated user found'
      };
    }
    
    const db = getFirebaseDb();
    
    // Update the profile in Firestore
    await updateDoc(doc(db, "users", currentUser.uid), profileData);
    
    // If name was updated, also update it in AsyncStorage
    if (profileData.name) {
      currentUser.name = profileData.name;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      message: 'Failed to update profile'
    };
  }
};