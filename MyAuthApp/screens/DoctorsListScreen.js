// MyAuthApp/screens/DoctorsListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Import components and services
import Button from '../components/Button';
import { getCurrentUser } from '../services/authService';

// Import doctor schema as fallback
import { doctorSchema } from '../data/doctorSchema';

const DoctorsListScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [specialties, setSpecialties] = useState([]);

  // Fetch user data and doctors
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // User condition from route params or profile
        const conditionFilter = route.params?.condition;
        
        if (currentUser?.uid) {
          // Fetch user profile
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
          }
        }
        
        // Fetch doctors from Firestore
        await fetchDoctors(conditionFilter);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load doctors. Please try again.');
        
        // Use fallback data
        const fallbackDoctors = [doctorSchema.exampleDoctor];
        setDoctors(fallbackDoctors);
        setFilteredDoctors(fallbackDoctors);
        
        // Extract unique specialties
        const uniqueSpecialties = [...new Set(fallbackDoctors.flatMap(doctor => doctor.specialties || []))];
        setSpecialties(uniqueSpecialties);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [route.params?.condition]);

  // Fetch doctors from Firestore
  const fetchDoctors = async (conditionFilter) => {
    try {
      const db = getFirestore();
      let doctorsQuery;
      
      if (conditionFilter) {
        // Query doctors that specialize in the condition
        doctorsQuery = query(
          collection(db, "doctors"),
          where("specialties", "array-contains", conditionFilter.toLowerCase()),
          orderBy("rating", "desc"),
          limit(20)
        );
      } else {
        // Get all doctors
        doctorsQuery = query(
          collection(db, "doctors"),
          orderBy("rating", "desc"),
          limit(20)
        );
      }
      
      const querySnapshot = await getDocs(doctorsQuery);
      
      if (!querySnapshot.empty) {
        const doctorsData = [];
        querySnapshot.forEach((doc) => {
          doctorsData.push({ id: doc.id, ...doc.data() });
        });
        
        setDoctors(doctorsData);
        setFilteredDoctors(doctorsData);
        
        // Extract unique specialties
        const uniqueSpecialties = [...new Set(doctorsData.flatMap(doctor => doctor.specialties || []))];
        setSpecialties(uniqueSpecialties);
      } else {
        // No doctors found in Firestore, use fallback
        const fallbackDoctors = [
          {
            ...doctorSchema.exampleDoctor,
            id: "dr123",
            name: "Dr. Sarah Johnson",
            specialty: "Dermatology",
            subSpecialty: "Pediatric Dermatology",
            specialties: ["eczema", "allergies"]
          },
          {
            ...doctorSchema.exampleDoctor,
            id: "dr124",
            name: "Dr. Michael Chen",
            specialty: "Pediatrics",
            subSpecialty: "Nutrition",
            specialties: ["obesity", "nutrition"],
            hospital: "Children's Health Center"
          },
          {
            ...doctorSchema.exampleDoctor,
            id: "dr125",
            name: "Dr. Emily Wilson",
            specialty: "Endocrinology",
            subSpecialty: "Pediatric Endocrinology",
            specialties: ["diabetes", "obesity"],
            hospital: "Metropolitan Medical Center"
          }
        ];
        
        setDoctors(fallbackDoctors);
        setFilteredDoctors(fallbackDoctors);
        
        // Extract unique specialties
        const uniqueSpecialties = [...new Set(fallbackDoctors.flatMap(doctor => doctor.specialties || []))];
        setSpecialties(uniqueSpecialties);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      
      // Use multiple fallback doctors in case of error
      const fallbackDoctors = [
        {
          ...doctorSchema.exampleDoctor,
          id: "dr123",
          name: "Dr. Sarah Johnson",
          specialty: "Dermatology",
          subSpecialty: "Pediatric Dermatology",
          specialties: ["eczema", "allergies"]
        },
        {
          ...doctorSchema.exampleDoctor,
          id: "dr124",
          name: "Dr. Michael Chen",
          specialty: "Pediatrics",
          subSpecialty: "Nutrition",
          specialties: ["obesity", "nutrition"],
          hospital: "Children's Health Center"
        }
      ];
      
      setDoctors(fallbackDoctors);
      setFilteredDoctors(fallbackDoctors);
      
      // Extract unique specialties
      const uniqueSpecialties = [...new Set(fallbackDoctors.flatMap(doctor => doctor.specialties || []))];
      setSpecialties(uniqueSpecialties);
      
      throw error;
    }
  };

  // Filter doctors based on search and specialty
  useEffect(() => {
    if (!doctors.length) return;
    
    let filtered = [...doctors];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query) ||
        doctor.subSpecialty?.toLowerCase().includes(query) ||
        doctor.hospital.toLowerCase().includes(query)
      );
    }
    
    // Filter by specialty
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.specialties && doctor.specialties.includes(selectedSpecialty)
      );
    }
    
    setFilteredDoctors(filtered);
  }, [searchQuery, selectedSpecialty, doctors]);

  // Handle doctor selection
  const handleSelectDoctor = (doctor) => {
    navigation.navigate('Appointment', { doctor });
  };

  // Format the rating with star emoji
  const formatRating = (rating) => {
    return `${rating.toFixed(1)} ★`;
  };

  // Display loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Finding doctors...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Find a Doctor</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, specialty, or hospital"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Specialty Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by specialty:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedSpecialty === 'all' && styles.selectedFilterButton
              ]}
              onPress={() => setSelectedSpecialty('all')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedSpecialty === 'all' && styles.selectedFilterButtonText
              ]}>All Specialists</Text>
            </TouchableOpacity>
            
            {specialties.map((specialty) => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.filterButton,
                  selectedSpecialty === specialty && styles.selectedFilterButton
                ]}
                onPress={() => setSelectedSpecialty(specialty)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedSpecialty === specialty && styles.selectedFilterButtonText
                ]}>{specialty.charAt(0).toUpperCase() + specialty.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Results count */}
        <Text style={styles.resultsText}>
          {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found
        </Text>
        
        {/* Doctors List */}
        {filteredDoctors.length > 0 ? (
          <View style={styles.doctorsContainer}>
            {filteredDoctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() => handleSelectDoctor(doctor)}
              >
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
                    <View style={styles.doctorMetaContainer}>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.ratingText}>
                          {formatRating(doctor.rating)}
                        </Text>
                        <Text style={styles.reviewCount}>
                          ({doctor.reviewCount} reviews)
                        </Text>
                      </View>
                      <Text style={styles.experienceText}>
                        {doctor.experience} years exp.
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.doctorDetailsContainer}>
                  <Text style={styles.hospitalText}>{doctor.hospital}</Text>
                  <Text style={styles.feeText}>${doctor.consultationFee} consultation</Text>
                  
                  <View style={styles.tagsContainer}>
                    {doctor.specialties && doctor.specialties.map((specialty, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.specialtyTag,
                          { backgroundColor: specialty === 'eczema' ? '#E1F5FE' : '#FFF3CD' }
                        ]}
                      >
                        <Text style={[
                          styles.specialtyTagText,
                          { color: specialty === 'eczema' ? '#0277BD' : '#FF8F00' }
                        ]}>
                          {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                        </Text>
                      </View>
                    ))}
                    
                    {doctor.telehealth && (
                      <View style={styles.telehealthTag}>
                        <Text style={styles.telehealthTagText}>Telehealth</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <Button
                  title="Book Appointment"
                  onPress={() => handleSelectDoctor(doctor)}
                  style={styles.bookButton}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No doctors found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search criteria</Text>
          </View>
        )}
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
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#555',
  },
  filterScroll: {
    paddingBottom: 5,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  selectedFilterButton: {
    backgroundColor: '#2E86C1',
  },
  filterButtonText: {
    color: '#555',
  },
  selectedFilterButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  doctorsContainer: {
    marginBottom: 20,
  },
  doctorCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 15,
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
  doctorMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57C00',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
  },
  experienceText: {
    fontSize: 12,
    color: '#666',
  },
  doctorDetailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
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
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  specialtyTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  telehealthTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 6,
    marginBottom: 6,
  },
  telehealthTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#388E3C',
  },
  bookButton: {
    backgroundColor: '#2E86C1',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  }
});

export default DoctorsListScreen;