// Updated user profile schema for the health tracking app
// This represents the Firestore document structure

const userProfileSchema = {
  // Basic user info
  uid: "string", // Firebase Auth UID
  name: "string", // User's full name
  email: "string", // User's email
  createdAt: "timestamp", // Account creation date
  
  // Personal information for health tracking
  age: "number", // User's age
  gender: "string", // User's gender
  region: "string", // Region in Australia
  isPatient: "boolean", // Whether the user is a patient or caregiver
  
  // Medical tracking
  condition: "string", // Primary condition being tracked (eczema, obesity, etc.)
  diagnosisDate: "timestamp", // When the condition was diagnosed
  lastHospitalVisit: "timestamp", // Date of last hospital visit
  
  // App usage
  lastSurveyCompleted: "timestamp", // When the last survey was completed
  surveyResults: [
    // Array of survey submissions
    {
      date: "timestamp",
      surveyType: "string", // The type of survey (eczema, obesity, etc.)
      surveyId: "string", // Reference to the survey template
      answers: [
        // Array of question/answer pairs
        { 
          questionId: "string", 
          answer: "string",
          score: "number" // Individual question score
        }
      ],
      score: "number", // Overall health score from survey
      maxPossibleScore: "number", // Maximum possible score for this survey
      severityLabel: "string", // Severity category (e.g. "Mild eczema", "Moderate concern")
      severityColor: "string" // HEX color code for the severity level
    }
  ],
  
  // Latest scores for different conditions (for quick reference)
  latestScores: {
    "eczema": {
      score: "number",
      date: "timestamp",
      severityLabel: "string"
    },
    "obesity": {
      score: "number",
      date: "timestamp",
      severityLabel: "string"
    }
  },
  
  // Appointments
  upcomingAppointments: [
    // Array of upcoming appointments
    {
      id: "string", // Appointment ID
      doctorId: "string", // Reference to doctor
      date: "timestamp", // Date and time of appointment
      duration: "number", // Duration in minutes
      type: "string", // In-person or telehealth
      status: "string", // Scheduled, completed, cancelled, no-show
      doctorName: "string", // Doctor's name (for quick reference)
      doctorSpecialty: "string", // Doctor's specialty
      location: "string", // Appointment location or link for telehealth
    }
  ],
  
  // Saved doctors
  savedDoctors: [
    // Array of doctor IDs that the user has saved
    "string"
  ],
  
  // Saved health tips
  savedTips: [
    // Array of health tip IDs that the user has saved
    "string"
  ],
  
  // Payment information (tokenized/secure references only)
  paymentMethods: [
    {
      id: "string", // Payment method ID
      type: "string", // Card, PayPal, etc.
      lastFour: "string", // Last four digits (for cards)
      expiryMonth: "number", // Expiration month (for cards)
      expiryYear: "number", // Expiration year (for cards)
      isDefault: "boolean", // Whether this is the default payment method
    }
  ],
  
  // System fields
  firstLogin: "boolean", // Flag for first login experience
  profileCompleted: "boolean", // Flag for completed profile
  lastLogin: "timestamp", // Last login time
  
  // App settings
  settings: {
    notifications: "boolean",
    darkMode: "boolean",
    reminderFrequency: "string", // daily, weekly, monthly
    emailNotifications: "boolean", // Whether to send email notifications
    smsNotifications: "boolean", // Whether to send SMS notifications
    phoneNumber: "string", // User's phone number for SMS notifications
  }
};

export default userProfileSchema;