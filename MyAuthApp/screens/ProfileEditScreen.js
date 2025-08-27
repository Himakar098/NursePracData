// MyAuthApp/screens/ProfileEditScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, getDoc, doc } from 'firebase/firestore';

// Import components and services
import Input from '../components/Input';
import Button from '../components/Button';
import { getCurrentUser, updateUserProfile } from '../services/authService';

const ProfileEditScreen = ({ navigation }) => {
  // State for form fields
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isPatient: true,
    age: '',
    gender: 'Prefer not to say',
    region: '',
    condition: '',
    diagnosisDate: '',
    lastHospitalVisit: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState('');

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get basic user info
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.uid) {
          // Fetch extended profile data from Firestore
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Initialize form data with existing data, using defaults for missing fields
            setFormData({
              name: userData.name || '',
              isPatient: userData.isPatient !== undefined ? userData.isPatient : true,
              age: userData.age ? userData.age.toString() : '',
              gender: userData.gender || 'Prefer not to say',
              region: userData.region || '',
              condition: userData.condition || '',
              diagnosisDate: userData.diagnosisDate || '',
              lastHospitalVisit: userData.lastHospitalVisit || '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load your profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle form input changes
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
  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    
    // Convert age to number if provided
    const updatedData = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : null
    };
    
    try {
      const response = await updateUserProfile(updatedData);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          'Your profile has been updated successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading indicator while fetching data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  // Gender options
  const genderOptions = [
    'Male',
    'Female',
    'Non-binary',
    'Prefer not to say'
  ];

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
          <Text style={styles.title}>Edit Your Profile</Text>
          <Text style={styles.subtitle}>Update your personal information</Text>
          
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Input
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
            
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
            
            <Text style={styles.sectionTitle}>Personal Details</Text>
            
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
              <Text style={styles.dateText}>
                {formData.diagnosisDate || 'Select a date'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('lastHospitalVisit')}
            >
              <Text style={styles.label}>Date of Last Hospital Visit</Text>
              <Text style={styles.dateText}>
                {formData.lastHospitalVisit || 'Select a date'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.buttonContainer}>
              <Button
                title={isSaving ? "Saving..." : "Save Changes"}
                onPress={handleSubmit}
                disabled={isSaving}
              />
              <Button
                title="Cancel"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
            </View>
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
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 15,
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
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007BFF',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#007BFF',
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

export default ProfileEditScreen;