// MyAuthApp/data/doctorSchema.js
// Schema for doctors and appointments in Firestore

const doctorSchema = {
    // Collection: doctors
    
    // Document structure for a doctor profile
    doctorProfile: {
      id: "string", // Unique doctor ID
      name: "string", // Doctor's full name
      title: "string", // Dr., Prof., etc.
      specialty: "string", // Medical specialty (e.g., Dermatologist, Pediatrician)
      subSpecialty: "string", // Optional sub-specialty
      qualifications: "string", // Medical qualifications (e.g., MBBS, MD)
      experience: "number", // Years of experience
      hospital: "string", // Primary hospital/clinic affiliation
      address: {
        street: "string",
        city: "string",
        state: "string",
        postalCode: "string",
        country: "string",
      },
      consultationFee: "number", // Fee per consultation in AUD
      bio: "string", // Brief professional biography
      profileImage: "string", // URL to profile image
      specialInterests: ["string"], // Array of special interests/expertise
      languages: ["string"], // Languages spoken
      consultationDuration: "number", // Average consultation length in minutes
      acceptingNewPatients: "boolean", // Whether accepting new patients
      telehealth: "boolean", // Whether offering telehealth consultations
      workingHours: {
        monday: { start: "string", end: "string", available: "boolean" },
        tuesday: { start: "string", end: "string", available: "boolean" },
        wednesday: { start: "string", end: "string", available: "boolean" },
        thursday: { start: "string", end: "string", available: "boolean" },
        friday: { start: "string", end: "string", available: "boolean" },
        saturday: { start: "string", end: "string", available: "boolean" },
        sunday: { start: "string", end: "string", available: "boolean" },
      },
      specialties: ["string"], // Array of condition specialties (eczema, obesity, etc.)
      rating: "number", // Average patient rating (1-5)
      reviewCount: "number", // Number of patient reviews
      createdAt: "timestamp", // When the profile was created
      updatedAt: "timestamp", // When the profile was last updated
    },
  
    // Example doctor document
    exampleDoctor: {
      id: "dr123",
      name: "Dr. Sarah Johnson",
      title: "Dr.",
      specialty: "Dermatology",
      subSpecialty: "Pediatric Dermatology",
      qualifications: "MBBS, MD, FACD",
      experience: 15,
      hospital: "Sydney Skin Institute",
      address: {
        street: "123 Medical Way",
        city: "Sydney",
        state: "NSW",
        postalCode: "2000",
        country: "Australia",
      },
      consultationFee: 150,
      bio: "Dr. Johnson is a specialist dermatologist with 15 years of experience in treating pediatric skin conditions, particularly eczema and allergic skin disorders.",
      profileImage: "https://example.com/dr-johnson.jpg",
      specialInterests: ["Pediatric Eczema", "Allergic Skin Disorders", "Acne"],
      languages: ["English", "Spanish"],
      consultationDuration: 30,
      acceptingNewPatients: true,
      telehealth: true,
      workingHours: {
        monday: { start: "09:00", end: "17:00", available: true },
        tuesday: { start: "09:00", end: "17:00", available: true },
        wednesday: { start: "09:00", end: "17:00", available: true },
        thursday: { start: "09:00", end: "17:00", available: true },
        friday: { start: "09:00", end: "15:00", available: true },
        saturday: { start: "10:00", end: "14:00", available: true },
        sunday: { start: "", end: "", available: false },
      },
      specialties: ["eczema", "allergies"],
      rating: 4.8,
      reviewCount: 42,
      createdAt: "2023-01-15T08:30:00Z",
      updatedAt: "2023-05-20T14:45:00Z",
    }
  };
  
  const appointmentSchema = {
    // Collection: appointments
    
    // Document structure for an appointment
    appointmentStructure: {
      id: "string", // Unique appointment ID
      doctorId: "string", // Reference to doctor
      patientId: "string", // Reference to patient (user)
      date: "timestamp", // Date and time of appointment
      duration: "number", // Duration in minutes
      type: "string", // In-person or telehealth
      status: "string", // Scheduled, completed, cancelled, no-show
      reason: "string", // Reason for visit
      notes: "string", // Additional notes from patient
      paymentStatus: "string", // Pending, paid, refunded
      paymentAmount: "number", // Amount paid
      paymentId: "string", // Reference to payment transaction
      createdAt: "timestamp", // When the appointment was created
      updatedAt: "timestamp", // When the appointment was last updated
    },
    
    // Example appointment document
    exampleAppointment: {
      id: "appt456",
      doctorId: "dr123",
      patientId: "user789",
      date: "2023-06-15T14:30:00Z",
      duration: 30,
      type: "in-person",
      status: "scheduled",
      reason: "Follow-up consultation for eczema treatment",
      notes: "Skin has improved on current medication but still some itching at night",
      paymentStatus: "paid",
      paymentAmount: 150,
      paymentId: "pay123",
      createdAt: "2023-06-01T10:15:00Z",
      updatedAt: "2023-06-01T10:15:00Z",
    }
  };
  
  export { doctorSchema, appointmentSchema };