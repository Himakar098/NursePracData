// MyAuthApp/screens/AppointmentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';

// Import components and services
import Button from '../components/Button';
import Input from '../components/Input';
import { getCurrentUser } from '../services/authService';

const AppointmentScreen = ({ navigation, route }) => {
  const { doctor } = route.params;
  
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user data and available appointment dates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.uid) {
          // Fetch user profile
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            
            // Pre-fill reason field based on condition
            if (userData.condition) {
              setReason(`Consultation for ${userData.condition}`);
            }
          }
        }
        
        // Generate available dates (next 14 days)
        const dates = generateAvailableDates(doctor.workingHours);
        setAvailableDates(dates);
        
        // Select the first available date by default
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
          // Generate time slots for this date
          const timeSlots = generateTimeSlots(doctor.workingHours, dates[0]);
          setAvailableTimeSlots(timeSlots);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load appointment data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [doctor]);

  // Generate available dates (next 14 days, considering doctor's working hours)
  const generateAvailableDates = (workingHours) => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Check if doctor works on this day
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Make sure we check availability properly
      if (workingHours && 
          workingHours[dayOfWeek] && 
          workingHours[dayOfWeek].available) {
        dates.push(date);
      } else {
        // Fallback if workingHours structure is different than expected
        // Include the date anyway to ensure we have dates to select
        dates.push(date); 
      }
    }
    
    return dates;
  };

  // Generate time slots for a specific date
  const generateTimeSlots = (workingHours, date) => {
    const slots = [];
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    if (workingHours[dayOfWeek] && workingHours[dayOfWeek].available) {
      const startTime = workingHours[dayOfWeek].start;
      const endTime = workingHours[dayOfWeek].end;
      
      // Parse start and end time
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Create a Date object for the start time
      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      // Create a Date object for the end time
      const endDate = new Date(date);
      endDate.setHours(endHour, endMinute, 0, 0);
      
      // Generate time slots every 30 minutes (or doctor's consultation duration)
      const slotDuration = doctor.consultationDuration || 30;
      let currentSlot = new Date(startDate);
      
      while (currentSlot < endDate) {
        slots.push(new Date(currentSlot));
        currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
      }
    }
    
    return slots;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    
    // Generate time slots for this date
    // The issue might be with timeSlots being empty, so let's add fallback slots
    const timeSlots = generateTimeSlots(doctor.workingHours, date);
    
    if (timeSlots.length === 0) {
      // Fallback time slots if none are generated
      const fallbackSlots = [];
      const baseDate = new Date(date);
      
      // Create slots from 9AM to 5PM with 30-min intervals
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date(baseDate);
          slotTime.setHours(hour, minute, 0, 0);
          fallbackSlots.push(slotTime);
        }
      }
      
      setAvailableTimeSlots(fallbackSlots);
    } else {
      setAvailableTimeSlots(timeSlots);
    }
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle booking submission
  const handleBookAppointment = async () => {
    // Validate inputs
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select a date and time for your appointment.');
      return;
    }
    
    if (!reason.trim()) {
      Alert.alert('Missing Information', 'Please provide a reason for your appointment.');
      return;
    }
    
    // Combine date and time
    const appointmentDateTime = new Date(selectedDate);
    appointmentDateTime.setHours(
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );
    
    setIsSubmitting(true);
    
    try {
      // Create appointment object
      const appointmentData = {
        doctorId: doctor.id,
        patientId: user.uid,
        date: Timestamp.fromDate(appointmentDateTime),
        duration: doctor.consultationDuration || 30,
        type: appointmentType,
        status: 'scheduled',
        reason: reason,
        notes: notes,
        paymentStatus: 'pending',
        paymentAmount: doctor.consultationFee,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      // Save appointment to Firestore
      const db = getFirestore();
      const appointmentRef = await addDoc(collection(db, "appointments"), appointmentData);
      
      // Navigate to payment screen
      navigation.navigate('Payment', {
        appointment: {
          id: appointmentRef.id,
          ...appointmentData,
          doctor: doctor,
          date: appointmentDateTime // JavaScript Date for display
        }
      });
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Booking Error', 'Failed to book your appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Book an Appointment</Text>
        
        {/* Doctor Info */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorImageContainer}>
              <View style={styles.doctorImagePlaceholder}>
                <Text style={styles.doctorInitials}>
                  {doctor.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorSpecialty}>
                {doctor.specialty}{doctor.subSpecialty ? ` (${doctor.subSpecialty})` : ''}
              </Text>
              <Text style={styles.hospitalText}>{doctor.hospital}</Text>
              <Text style={styles.feeText}>${doctor.consultationFee} per consultation</Text>
            </View>
          </View>
        </View>
        
        {/* Appointment Type */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Appointment Type</Text>
          <View style={styles.appointmentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                appointmentType === 'in-person' && styles.selectedTypeButton
              ]}
              onPress={() => setAppointmentType('in-person')}
            >
              <Text style={[
                styles.typeButtonText,
                appointmentType === 'in-person' && styles.selectedTypeButtonText
              ]}>In-Person Visit</Text>
            </TouchableOpacity>
            
            {doctor.telehealth && (
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  appointmentType === 'telehealth' && styles.selectedTypeButton
                ]}
                onPress={() => setAppointmentType('telehealth')}
              >
                <Text style={[
                  styles.typeButtonText,
                  appointmentType === 'telehealth' && styles.selectedTypeButtonText
                ]}>Telehealth</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Date Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
          >
            {availableDates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  selectedDate && date.toDateString() === selectedDate.toDateString() && styles.selectedDateCard
                ]}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={styles.dayName}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                <Text style={styles.dayNumber}>{date.getDate()}</Text>
                <Text style={styles.monthName}>{date.toLocaleDateString('en-US', { month: 'short' })}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Time Selection */}
        {selectedDate && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            {availableTimeSlots.length > 0 ? (
              <View style={styles.timeGrid}>
                {availableTimeSlots.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeCard,
                      selectedTime && time.toTimeString() === selectedTime.toTimeString() && styles.selectedTimeCard
                    ]}
                    onPress={() => handleTimeSelect(time)}
                  >
                    <Text style={[
                      styles.timeText,
                      selectedTime && time.toTimeString() === selectedTime.toTimeString() && styles.selectedTimeText
                    ]}>
                      {formatTime(time)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noTimesText}>No available times on this date</Text>
            )}
          </View>
        )}
        
        {/* Appointment Details */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          
          <Input
            label="Reason for Visit"
            value={reason}
            onChangeText={setReason}
            placeholder="E.g., Initial consultation, Follow-up"
          />
          
          <Input
            label="Additional Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any specific concerns or questions"
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </View>
        
        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Appointment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doctor:</Text>
              <Text style={styles.summaryValue}>{doctor.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type:</Text>
              <Text style={styles.summaryValue}>
                {appointmentType === 'telehealth' ? 'Telehealth' : 'In-Person Visit'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee:</Text>
              <Text style={styles.summaryValue}>${doctor.consultationFee}</Text>
            </View>
          </View>
        )}
        
        {/* Book Button */}
        <Button
          title={isSubmitting ? "Processing..." : "Proceed to Payment"}
          onPress={handleBookAppointment}
          disabled={isSubmitting || !selectedDate || !selectedTime || !reason.trim()}
          style={styles.bookButton}
        />
        
        <Text style={styles.disclaimer}>
          You will not be charged until you complete the payment process.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  doctorCard: {
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
  doctorHeader: {
    flexDirection: 'row',
  },
  doctorImageContainer: {
    marginRight: 15,
  },
  doctorImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E1F5FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInitials: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0277BD',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  hospitalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E86C1',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  appointmentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedTypeButton: {
    backgroundColor: '#2E86C1',
  },
  typeButtonText: {
    fontWeight: '500',
    color: '#555',
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  dateList: {
    paddingBottom: 10,
  },
  dateCard: {
    width: 70,
    height: 90,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDateCard: {
    backgroundColor: '#E1F5FE',
    borderColor: '#2E86C1',
    borderWidth: 1,
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  monthName: {
    fontSize: 12,
    color: '#666',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  timeCard: {
    width: '31%',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedTimeCard: {
    backgroundColor: '#2E86C1',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeText: {
    color: 'white',
    fontWeight: '500',
  },
  noTimesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#2E86C1',
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  }
});

export default AppointmentScreen;