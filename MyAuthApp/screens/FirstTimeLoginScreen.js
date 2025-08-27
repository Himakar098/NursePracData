// MyAuthApp/screens/FirstTimeLoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig'; // Make sure path is correct

// Import components and services
import Input from '../components/Input';
import Button from '../components/Button';
import { getCurrentUser, updateUserProfile } from '../services/authService';

const FirstTimeLoginScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    isPatient: true, // Default: user is the patient
    age: '',
    gender: 'Prefer not to say',
    region: '',
    condition: '',
    diagnosisDate: new Date().toISOString().split('T')[0], // Today's date as default
    lastHospitalVisit: new Date().toISOString().split('T')[0], // Today's date as default
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState('');
  
  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchUser();
  }, []);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  // Open date picker
  const openDatePicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    handleChange(dateField, date);
    setShowDatePicker(false);
  };

  // Handle form submission
  const handleComplete = async () => {
    if (!formData.age && formData.age !== '') {
      Alert.alert('Error', 'Please enter your age');
      return;
    }

    if (!formData.region) {
      Alert.alert('Error', 'Please select your region');
      return;
    }

    setIsLoading(true);
    
    try {
      // Ensure age is a number
      const updatedData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        profileCompleted: true,
        firstLogin: false
      };
      
      // Update the user profile in Firestore
      const response = await updateUserProfile(updatedData);
      
      if (response.success) {
        // Simply navigate to Home - don't use reset
        navigation.replace('Home');
      } else {
        Alert.alert('Error', response.message || 'Failed to complete profile setup');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle skip (minimal profile)
  const handleSkip = async () => {
    setIsLoading(true);
    
    try {
      // Still mark the profile as completed but with minimal information
      const response = await updateUserProfile({
        isPatient: true,
        gender: 'Prefer not to say',
        condition: '',
        diagnosisDate: '',
        lastHospitalVisit: '',
        profileCompleted: true,
        firstLogin: false
      });
      
      if (response.success) {
        navigation.replace('Home');
      } else {
        Alert.alert('Error', response.message || 'Failed to skip profile setup');
      }
    } catch (error) {
      console.error('Skip profile error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while fetching data
  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Preparing your profile...</Text>
      </View>
    );
  }

  // Region options
  const regionOptions = [
    'Australian Capital Territory',
    'New South Wales',
    'Northern Territory',
    'Queensland',
    'South Australia',
    'Tasmania',
    'Victoria',
    'Western Australia'
  ];

  // Gender options
  const genderOptions = [
    'Male',
    'Female',
    'Non-binary',
    'Prefer not to say'
  ];

  // Common health conditions
  const conditionOptions = [
    'Cardiovascular Disease',
    'Diabetes',
    'Respiratory Condition',
    'Cancer',
    'Mental Health',
    'Chronic Pain',
    'Other'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Health Track!</Text>
            <Text style={styles.subtitle}>Let's set up your health profile</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>About You</Text>
            
            <View style={styles.toggleContainer}>
              <Text style={styles.label}>Are you the patient?</Text>
              <View style={styles.toggleOptions}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    formData.isPatient && styles.toggleOptionSelected
                  ]}
                  onPress={() => handleChange('isPatient', true)}
                >
                  <Text 
                    style={[
                      styles.toggleOptionText,
                      formData.isPatient && styles.toggleOptionTextSelected
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    !formData.isPatient && styles.toggleOptionSelected
                  ]}
                  onPress={() => handleChange('isPatient', false)}
                >
                  <Text 
                    style={[
                      styles.toggleOptionText,
                      !formData.isPatient && styles.toggleOptionTextSelected
                    ]}
                  >
                    No (I'm a caregiver)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Input
              label="Age"
              value={formData.age}
              onChangeText={(value) => handleChange('age', value)}
              placeholder="Enter age"
              keyboardType="number-pad"
            />
            
            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionsContainer}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    formData.gender === option && styles.optionSelected
                  ]}
                  onPress={() => handleChange('gender', option)}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      formData.gender === option && styles.optionTextSelected
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Region in Australia</Text>
            <View style={styles.optionsContainer}>
              {regionOptions.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.option,
                    formData.region === region && styles.optionSelected
                  ]}
                  onPress={() => handleChange('region', region)}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      formData.region === region && styles.optionTextSelected
                    ]}
                  >
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>Health Information</Text>
            
            <Text style={styles.label}>Primary Condition</Text>
            <View style={styles.optionsContainer}>
              {conditionOptions.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.option,
                    formData.condition === condition && styles.optionSelected
                  ]}
                  onPress={() => handleChange('condition', condition)}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      formData.condition === condition && styles.optionTextSelected
                    ]}
                  >
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('diagnosisDate')}
            >
              <Text style={styles.label}>Date of Diagnosis</Text>
              <Text style={styles.dateText}>{formData.diagnosisDate}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('lastHospitalVisit')}
            >
              <Text style={styles.label}>Date of Last Hospital Visit</Text>
              <Text style={styles.dateText}>{formData.lastHospitalVisit}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? "Saving..." : "Complete Profile"}
              onPress={handleComplete}
              disabled={isLoading}
            />
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Simple Date Input Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TextInput
              style={styles.dateInputField}
              placeholder="YYYY-MM-DD"
              value={formData[dateField]}
              onChangeText={(text) => handleChange(dateField, text)}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.modalHelper}>Format: YYYY-MM-DD</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handleDateSelect(formData[dateField])}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2E86C1',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 10,
    color: '#333',
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },
  toggleContainer: {
    marginBottom: 15,
  },
  toggleOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  toggleOption: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 5,
  },
  toggleOptionSelected: {
    backgroundColor: '#2E86C1',
  },
  toggleOptionText: {
    color: '#555',
  },
  toggleOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  option: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#2E86C1',
  },
  optionText: {
    fontSize: 14,
    color: '#555',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dateInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    fontSize: 16,
  },
  modalHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#2E86C1',
  },
  modalButtonText: {
    color: '#2E86C1',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default FirstTimeLoginScreen;