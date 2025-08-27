// MyAuthApp/screens/PaymentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

// Import components and services
import Button from '../components/Button';
import Input from '../components/Input';
import { getCurrentUser } from '../services/authService';

const PaymentScreen = ({ navigation, route }) => {
  const { appointment } = route.params;
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  
  // Credit card form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  
  // Validation errors
  const [cardNameError, setCardNameError] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');
  const [cardExpiryError, setCardExpiryError] = useState('');
  const [cardCVCError, setCardCVCError] = useState('');

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'Failed to load user data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Format card number with spaces
  const formatCardNumber = (value) => {
    if (!value) return '';
    return value.replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value) => {
    if (!value) return '';
    value = value.replace(/\D/g, '');
    if (value.length > 2) {
      return value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    return value;
  };

  // Handle card number change
  const handleCardNumberChange = (value) => {
    // Remove non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to 16 digits
    const truncated = digitsOnly.substring(0, 16);
    // Format with spaces every 4 digits
    setCardNumber(formatCardNumber(truncated));
  };

  // Handle expiry date change
  const handleExpiryChange = (value) => {
    setCardExpiry(formatExpiryDate(value));
  };

  // Handle CVC change
  const handleCVCChange = (value) => {
    // Remove non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to 4 digits (for Amex)
    const truncated = digitsOnly.substring(0, 4);
    setCardCVC(truncated);
  };

  // Validate the payment form
  const validatePaymentForm = () => {
    let isValid = true;
    
    // Validate card name
    if (!cardName.trim()) {
      setCardNameError('Cardholder name is required');
      isValid = false;
    } else {
      setCardNameError('');
    }
    
    // Validate card number
    const cardNumberDigits = cardNumber.replace(/\s/g, '');
    if (!cardNumberDigits) {
      setCardNumberError('Card number is required');
      isValid = false;
    } else if (cardNumberDigits.length < 15) {
      setCardNumberError('Card number is incomplete');
      isValid = false;
    } else {
      setCardNumberError('');
    }
    
    // Validate expiry date
    if (!cardExpiry) {
      setCardExpiryError('Expiry date is required');
      isValid = false;
    } else if (cardExpiry.length < 5) {
      setCardExpiryError('Expiry date is incomplete');
      isValid = false;
    } else {
      const [month, year] = cardExpiry.split('/');
      const currentYear = new Date().getFullYear() % 100; // Get last 2 digits
      const currentMonth = new Date().getMonth() + 1; // 1-12
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        setCardExpiryError('Invalid month');
        isValid = false;
      } else if (parseInt(year) < currentYear || 
                (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        setCardExpiryError('Card has expired');
        isValid = false;
      } else {
        setCardExpiryError('');
      }
    }
    
    // Validate CVC
    if (!cardCVC) {
      setCardCVCError('CVC is required');
      isValid = false;
    } else if (cardCVC.length < 3) {
      setCardCVCError('CVC is incomplete');
      isValid = false;
    } else {
      setCardCVCError('');
    }
    
    return isValid;
  };

  // Process payment
  const handleSubmitPayment = async () => {
    // Validate form
    if (!validatePaymentForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real app, this would be a secure payment gateway integration
      // For this demo, we'll simulate a payment process
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update appointment status in Firestore
      const db = getFirestore();
      await updateDoc(doc(db, "appointments", appointment.id), {
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
        // In a real app, you would store a payment transaction ID from your payment processor
        paymentId: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        updatedAt: new Date()
      });
      
      // Show success message and navigate back to home
      Alert.alert(
        'Payment Successful',
        'Your appointment has been booked successfully.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          }
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format appointment date and time for display
  const formatDateTime = (date) => {
    return date.toLocaleString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Display loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Payment</Text>
          
          {/* Order Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Appointment Details</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doctor:</Text>
              <Text style={styles.summaryValue}>{appointment.doctor.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>When:</Text>
              <Text style={styles.summaryValue}>{formatDateTime(appointment.date)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type:</Text>
              <Text style={styles.summaryValue}>
                {appointment.type === 'telehealth' ? 'Telehealth' : 'In-Person Visit'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${appointment.paymentAmount}</Text>
            </View>
          </View>
          
          {/* Payment Method Selector */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  paymentMethod === 'credit-card' && styles.selectedMethodButton
                ]}
                onPress={() => setPaymentMethod('credit-card')}
              >
                <Text style={[
                  styles.methodButtonText,
                  paymentMethod === 'credit-card' && styles.selectedMethodButtonText
                ]}>Credit/Debit Card</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Credit Card Form */}
          {paymentMethod === 'credit-card' && (
            <View style={styles.cardFormContainer}>
              <Input
                label="Cardholder Name"
                value={cardName}
                onChangeText={setCardName}
                placeholder="John Smith"
                error={cardNameError}
              />
              
              <Input
                label="Card Number"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                placeholder="4242 4242 4242 4242"
                keyboardType="number-pad"
                maxLength={19} // 16 digits + 3 spaces
                error={cardNumberError}
              />
              
              <View style={styles.cardRowContainer}>
                <View style={styles.cardExpiryContainer}>
                  <Input
                    label="Expiry Date"
                    value={cardExpiry}
                    onChangeText={handleExpiryChange}
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                    maxLength={5} // MM/YY
                    error={cardExpiryError}
                  />
                </View>
                <View style={styles.cardCVCContainer}>
                  <Input
                    label="CVC"
                    value={cardCVC}
                    onChangeText={handleCVCChange}
                    placeholder="123"
                    keyboardType="number-pad"
                    maxLength={4} // Amex has 4 digits
                    error={cardCVCError}
                  />
                </View>
              </View>
            </View>
          )}
          
          {/* Payment Button */}
          <Button
            title={isProcessing ? "Processing..." : `Pay $${appointment.paymentAmount}`}
            onPress={handleSubmitPayment}
            disabled={isProcessing}
            style={styles.payButton}
          />
          
          <Text style={styles.secureText}>
            Your payment information is secure and encrypted
          </Text>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
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
    marginBottom: 15,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 10,
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
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
  paymentMethodContainer: {
    marginBottom: 10,
  },
  methodButton: {
    padding: 15,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedMethodButton: {
    backgroundColor: '#E1F5FE',
    borderColor: '#2E86C1',
    borderWidth: 1,
  },
  methodButtonText: {
    fontWeight: '500',
    color: '#555',
  },
  selectedMethodButtonText: {
    color: '#2E86C1',
  },
  cardFormContainer: {
    marginBottom: 20,
  },
  cardRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardExpiryContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardCVCContainer: {
    flex: 1,
  },
  payButton: {
    backgroundColor: '#2E86C1',
    marginBottom: 10,
  },
  secureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  }
});

export default PaymentScreen;