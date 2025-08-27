// MyAuthApp/navigation/index.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, getDoc, doc, updateDoc } from 'firebase/firestore';

// Import Firebase config - IMPORTANT: This initializes Firebase
import '../firebase/firebaseConfig'; // Make sure path is correct

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import FirstTimeLoginScreen from '../screens/FirstTimeLoginScreen';
import SurveyScreen from '../screens/SurveyScreen';
import HealthHistoryScreen from '../screens/HealthHistoryScreen';
import HealthTipsScreen from '../screens/HealthTipsScreen';
import DoctorsListScreen from '../screens/DoctorsListScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createStackNavigator();

const Navigation = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const isUserLoggedIn = userToken !== null;
        setIsLoggedIn(isUserLoggedIn);
        
        // If user is logged in, check if it's their first login
        if (isUserLoggedIn) {
          const userJson = await AsyncStorage.getItem('currentUser');
          if (userJson) {
            const userData = JSON.parse(userJson);
            
            // Check if we need to fetch first login status from Firestore
            if (userData.uid) {
              const db = getFirestore();
              const userDoc = await getDoc(doc(db, "users", userData.uid));
              
              if (userDoc.exists()) {
                // If firstLogin field is true or doesn't exist (for older accounts)
                // and profileCompleted is not true, mark as first login
                const docData = userDoc.data();
                const isFirst = docData.firstLogin !== false && docData.profileCompleted !== true;
                setIsFirstLogin(isFirst);
                
                // Update the firstLogin status if it's not explicitly set
                if (docData.firstLogin === undefined) {
                  updateDoc(doc(db, "users", userData.uid), {
                    firstLogin: isFirst
                  });
                }
              }
            }
          }
        } else {
          // Reset first login state when logged out
          setIsFirstLogin(false);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.log('Error checking login status:', error);
        setIsLoading(false);
      }
    };

    checkLoginStatus();

    // Monitor auth state changes - fallback method
    try {
      // Get auth directly instead of importing
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          await AsyncStorage.setItem('userToken', user.uid);
          setIsLoggedIn(true);
          
          // Check if it's the first login by fetching user data
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists()) {
            // If firstLogin field is true or doesn't exist, and profileCompleted is not true
            const docData = userDoc.data();
            const isFirst = docData.firstLogin !== false && docData.profileCompleted !== true;
            setIsFirstLogin(isFirst);
            
            // Update the firstLogin status if needed
            if (docData.firstLogin === undefined) {
              updateDoc(doc(db, "users", user.uid), {
                firstLogin: isFirst
              });
            }
          }
        } else {
          await AsyncStorage.removeItem('userToken');
          setIsLoggedIn(false);
          setIsFirstLogin(false);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Auth monitoring error:', error);
    }
  }, []);

  if (isLoading) {
    // You could show a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          isFirstLogin ? (
            // First-time login experience
            <Stack.Screen 
              name="FirstTimeLogin" 
              component={FirstTimeLoginScreen} 
              options={{ 
                headerShown: false,
                gestureEnabled: false // Prevent going back with gesture
              }}
            />
          ) : (
            // Regular authenticated user experience
            <>
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Health Track',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                    color: '#2E86C1'
                  },
                  headerLeft: null, // Disable back button
                }}
              />
              <Stack.Screen 
                name="ProfileEdit" 
                component={ProfileEditScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Edit Profile',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  }
                }}
              />
              <Stack.Screen 
                name="Survey" 
                component={SurveyScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Health Check-In',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  }
                }}
              />
              <Stack.Screen 
                name="HealthHistory" 
                component={HealthHistoryScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Health History',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  }
                }}
              />
              <Stack.Screen 
                name="HealthTips" 
                component={HealthTipsScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Health Tips',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  }
                }}
              />
              {/* Future screens for appointment booking and payment */}
              <Stack.Screen 
                name="DoctorsList" 
                component={DoctorsListScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Find a Doctor',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  }
                }}
              />
              <Stack.Screen 
                name="Appointment" 
                component={AppointmentScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Book Appointment',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  }
                }}
              />
              <Stack.Screen 
                name="Payment" 
                component={PaymentScreen} 
                options={{ 
                  headerShown: true,
                  title: 'Payment',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  }
                }}
              />
            </>
          )
        ) : (
          // User is not logged in, show authentication screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;