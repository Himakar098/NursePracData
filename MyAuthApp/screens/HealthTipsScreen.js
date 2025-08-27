// MyAuthApp/screens/HealthTipsScreen.js
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
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Import components and services
import Button from '../components/Button';
import { getCurrentUser } from '../services/authService';

// Import default health tips as fallback
import healthTipsSchema from '../data/healthTipsSchema';

const HealthTipsScreen = ({ navigation, route }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [tips, setTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // Fetch user data and health tips
  useEffect(() => {
    const fetchUserAndTips = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser?.uid) {
          // Fetch user profile from Firestore
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            
            // Determine user's condition(s)
            const userCondition = userData.condition || 'general';
            
            // Try to fetch health tips from Firestore
            try {
              const tipsRef = collection(db, "healthTips");
              const q = query(
                tipsRef, 
                where("condition", "in", [userCondition, "general"])
              );
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const tipsData = [];
                querySnapshot.forEach((doc) => {
                  tipsData.push(doc.data());
                });
                setTips(tipsData);
                
                // Extract unique categories
                const uniqueCategories = [...new Set(tipsData.map(tip => tip.category))];
                setCategories(uniqueCategories);
              } else {
                // Fallback to hardcoded tips if none in Firestore
                const fallbackTips = Object.values(healthTipsSchema).filter(
                  tip => tip.condition === userCondition || tip.condition === 'general'
                );
                setTips(fallbackTips);
                
                // Extract unique categories
                const uniqueCategories = [...new Set(fallbackTips.map(tip => tip.category))];
                setCategories(uniqueCategories);
              }
            } catch (error) {
              console.error('Error fetching tips from Firestore:', error);
              // Fallback to hardcoded tips
              const fallbackTips = Object.values(healthTipsSchema).filter(
                tip => tip.condition === userCondition || tip.condition === 'general'
              );
              setTips(fallbackTips);
              
              // Extract unique categories
              const uniqueCategories = [...new Set(fallbackTips.map(tip => tip.category))];
              setCategories(uniqueCategories);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load health tips. Please try again.');
        
        // Fallback to hardcoded general tips
        const fallbackTips = Object.values(healthTipsSchema).filter(
          tip => tip.condition === 'general'
        );
        setTips(fallbackTips);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(fallbackTips.map(tip => tip.category))];
        setCategories(uniqueCategories);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndTips();
  }, []);

  // Filter tips when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredTips(tips);
    } else {
      setFilteredTips(tips.filter(tip => tip.category === selectedCategory));
    }
  }, [selectedCategory, tips]);

  // Display loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Loading health tips...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          Health Tips{userProfile?.condition ? ` for ${userProfile.condition.charAt(0).toUpperCase() + userProfile.condition.slice(1)}` : ''}
        </Text>
        
        {/* Category filter buttons */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Filter by:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.selectedCategoryButtonText
              ]}>All Tips</Text>
            </TouchableOpacity>
            
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryButtonText
                ]}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Tips list */}
        {filteredTips.length > 0 ? (
          <View style={styles.tipsContainer}>
            {filteredTips.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <View style={styles.tipMeta}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)}
                      </Text>
                    </View>
                    {tip.condition !== 'general' && (
                      <View style={[
                        styles.conditionBadge,
                        {backgroundColor: tip.condition === 'eczema' ? '#2E86C1' : '#FF9800'}
                      ]}>
                        <Text style={styles.conditionText}>
                          {tip.condition.charAt(0).toUpperCase() + tip.condition.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.tipContent}>{tip.content}</Text>
                {tip.tags && (
                  <View style={styles.tagsContainer}>
                    {tip.tags.map((tag, index) => (
                      <View key={index} style={styles.tagBadge}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noTipsContainer}>
            <Text style={styles.noTipsText}>No tips available for this category</Text>
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
  categoryContainer: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#555',
  },
  categoryScroll: {
    paddingBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#2E86C1',
  },
  categoryButtonText: {
    color: '#555',
  },
  selectedCategoryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipCard: {
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
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  tipMeta: {
    flexDirection: 'row',
  },
  categoryBadge: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#0277BD',
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 5,
  },
  conditionText: {
    fontSize: 12,
    color: 'white',
  },
  tipContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  noTipsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noTipsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default HealthTipsScreen;