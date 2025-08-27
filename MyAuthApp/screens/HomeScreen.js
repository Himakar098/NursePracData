// MyAuthApp/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';

// Import components and services
import Button from '../components/Button';
import { logout, getCurrentUser } from '../services/authService';

// Import health tips schema as fallback
import healthTipsSchema from '../data/healthTipsSchema';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(null);
  const [lastSurveyDate, setLastSurveyDate] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);
  const [surveyTemplates, setSurveyTemplates] = useState({});

  // Fetch current user on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get basic user data from AsyncStorage
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.uid) {
          // Fetch extended profile data from Firestore
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            
            // Get relevant survey templates
            await fetchSurveyTemplates();
            
            // Get the user's condition for health tips
            const userCondition = userData.condition || 'general';
            
            // Get health scores if available
            if (userData.latestScores && userData.latestScores[userCondition]) {
              setHealthScore(userData.latestScores[userCondition]);
            } else if (userData.surveyResults && userData.surveyResults.length > 0) {
              // Fallback to legacy survey results
              const conditions = new Set(userData.surveyResults.map(s => s.surveyType || 'eczema'));
              const latestResults = {};
                            
              conditions.forEach(condition => {
                const conditionSurveys = userData.surveyResults.filter(
                  s => (s.surveyType || 'eczema') === condition
                );
                if (conditionSurveys.length > 0) {
                  const latest = conditionSurveys.reduce((latest, current) => {
                    return new Date(latest.date) > new Date(current.date) ? latest : current;
                  });
                  latestResults[condition] = {
                    score: latest.score,
                    date: latest.date,
                    severityLabel: latest.severityLabel
                  };
                }
              });
              
              if (latestResults[userCondition]) {
                setHealthScore(latestResults[userCondition]);
              }
              
              // Set last survey date from the most recent survey
              const mostRecent = userData.surveyResults.reduce((latest, current) => {
                return new Date(latest.date) > new Date(current.date) ? latest : current;
              });
              setLastSurveyDate(new Date(mostRecent.date));
            }
            
            // Fetch health tip for the day
            await fetchDailyTip(userCondition);
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

    // Set up a focus listener to refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });

    // Clean up the listener
    return unsubscribe;
  }, [navigation]);

  // Fetch survey templates from Firestore
  const fetchSurveyTemplates = async () => {
    try {
      const db = getFirestore();
      const surveysRef = collection(db, "surveyTemplates");
      const querySnapshot = await getDocs(surveysRef);
      
      const templates = {};
      
      querySnapshot.forEach((doc) => {
        const templateData = doc.data();
        if (templateData.condition) {
          templates[templateData.condition] = templateData;
        }
      });
      
      setSurveyTemplates(templates);
    } catch (error) {
      console.error('Error fetching survey templates:', error);
      // Continue with default templates as fallback
    }
  };

  // Fetch daily health tip
  const fetchDailyTip = async (condition) => {
    try {
      const db = getFirestore();
      const tipsRef = collection(db, "healthTips");
      const q = query(tipsRef, where("condition", "in", [condition, "general"]));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const tipsData = [];
        querySnapshot.forEach((doc) => {
          tipsData.push(doc.data());
        });
        
        // Pseudo-random tip based on day of year
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const tipIndex = dayOfYear % tipsData.length;
        setDailyTip(tipsData[tipIndex]);
      } else {
        // Fallback to hardcoded tips
        const fallbackTips = Object.values(healthTipsSchema).filter(
          tip => tip.condition === condition || tip.condition === 'general'
        );
        
        if (fallbackTips.length > 0) {
          const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
          const tipIndex = dayOfYear % fallbackTips.length;
          setDailyTip(fallbackTips[tipIndex]);
        }
      }
    } catch (error) {
      console.error('Error fetching health tips:', error);
      // Try hardcoded tips as fallback
      const fallbackTips = Object.values(healthTipsSchema).filter(
        tip => tip.condition === condition || tip.condition === 'general'
      );
      
      if (fallbackTips.length > 0) {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const tipIndex = dayOfYear % fallbackTips.length;
        setDailyTip(fallbackTips[tipIndex]);
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoading(true); // Show loading indicator
      const response = await logout();
      
      if (!response.success) {
        Alert.alert('Logout Failed', response.message);
      }
      // The Navigation component will handle redirection via onAuthStateChanged
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start new survey
  const handleStartSurvey = (surveyType = null) => {
    navigation.navigate('Survey', { surveyType: surveyType || userProfile?.condition || 'eczema' });
  };

  // Show loading indicator while fetching user
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  // Get time of day for personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-AU', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get health status based on score
  const getHealthStatus = () => {
    if (!healthScore) return { text: 'No data', color: '#757575' };
    
    if (healthScore.severityLabel) {
      return { 
        text: healthScore.severityLabel, 
        color: getColorForSeverity(healthScore.severityLabel) 
      };
    }
    
    // Default severity calculation if not available
    const score = healthScore.score;
    const condition = userProfile?.condition || 'eczema';
    const template = surveyTemplates[condition];
    
    if (template && template.scoringBands) {
      for (const band of template.scoringBands) {
        if (score >= band.min && score <= band.max) {
          return { text: band.label, color: band.color };
        }
      }
    }
    
    // Fallback severity calculation
    if (condition === 'eczema') {
      if (score >= 25) return { text: 'Very severe eczema', color: '#F44336' };
      if (score >= 17) return { text: 'Severe eczema', color: '#FF9800' };
      if (score >= 8) return { text: 'Moderate eczema', color: '#FFC107' };
      if (score >= 3) return { text: 'Mild eczema', color: '#8BC34A' };
      return { text: 'No eczema', color: '#4CAF50' };
    } else {
      // Generic fallback
      if (score >= 0.8 * 28) return { text: 'Very high concern', color: '#F44336' };
      if (score >= 0.6 * 28) return { text: 'High concern', color: '#FF9800' };
      if (score >= 0.3 * 28) return { text: 'Moderate concern', color: '#FFC107' };
      if (score > 0) return { text: 'Low concern', color: '#8BC34A' };
      return { text: 'Healthy habits', color: '#4CAF50' };
    }
  };

  // Get color for severity label
  const getColorForSeverity = (label) => {
    if (!label) return '#757575';
    
    label = label.toLowerCase();
    if (label.includes('no') || label.includes('healthy')) return '#4CAF50';
    if (label.includes('mild') || label.includes('low')) return '#8BC34A';
    if (label.includes('moderate')) return '#FFC107';
    if (label.includes('severe') || label.includes('high')) return '#FF9800';
    if (label.includes('very severe') || label.includes('very high')) return '#F44336';
    
    return '#757575';
  };

  // Get days since last survey
  const getDaysSinceLastSurvey = () => {
    if (!lastSurveyDate) return null;
    
    const now = new Date();
    const diffTime = Math.abs(now - lastSurveyDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysSinceLastSurvey = getDaysSinceLastSurvey();
  const healthStatus = getHealthStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>
            Health Track
          </Text>
          
          <Text style={styles.welcomeText}>
            {getGreeting()}, {user?.name || 'User'}!
          </Text>
        </View>
        
        {/* Health Status Card */}
        <TouchableOpacity 
          style={styles.healthStatusCard}
          onPress={() => handleStartSurvey()}
        >
          {healthScore ? (
            <>
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreText, { color: healthStatus.color }]}>
                  {healthScore.score}
                </Text>
                <Text style={styles.maxScoreText}>/28</Text>
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusText, { color: healthStatus.color }]}>
                  {healthStatus.text}
                </Text>
                <Text style={styles.lastUpdatedText}>
                  Last updated: {formatDate(lastSurveyDate)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No health data yet</Text>
              <Text style={styles.startSurveyText}>Tap to start your first check-in</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Daily Health Tip */}
        {dailyTip && (
          <TouchableOpacity 
            style={styles.tipCard}
            onPress={() => navigation.navigate('HealthTips')}
          >
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>Daily Health Tip</Text>
              <View style={[
                styles.tipBadge,
                { backgroundColor: dailyTip.condition === 'general' ? '#4CAF50' : '#2E86C1' }
              ]}>
                <Text style={styles.tipBadgeText}>
                  {dailyTip.condition === 'general' ? 'General' : 'Condition-specific'}
                </Text>
              </View>
            </View>
            <Text style={styles.tipSubtitle}>{dailyTip.title}</Text>
            <Text style={styles.tipContent}>
              {dailyTip.content.length > 120 
                ? dailyTip.content.substring(0, 120) + '...' 
                : dailyTip.content}
            </Text>
            <View style={styles.viewMoreContainer}>
              <Text style={styles.viewMoreText}>View all health tips</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleStartSurvey()}
          >
            <View style={[styles.actionIcon, styles.surveyIcon]}>
              <Text style={styles.actionIconText}>📋</Text>
            </View>
            <Text style={styles.actionText}>Check-In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('HealthHistory')}
          >
            <View style={[styles.actionIcon, styles.historyIcon]}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('HealthTips')}
          >
            <View style={[styles.actionIcon, styles.tipsIcon]}>
              <Text style={styles.actionIconText}>💡</Text>
            </View>
            <Text style={styles.actionText}>Tips</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('DoctorsList', { condition: userProfile?.condition })}
          >
            <View style={[styles.actionIcon, styles.doctorIcon]}>
              <Text style={styles.actionIconText}>👨‍⚕️</Text>
            </View>
            <Text style={styles.actionText}>Doctors</Text>
          </TouchableOpacity>
        </View>
        
        {/* User Information */}
        <View style={styles.profileSection}>
          <View style={styles.profileDetails}>
            <Text style={styles.sectionTitle}>Your Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name || 'Not provided'}</Text>
            </View>
            
            {userProfile?.age && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{userProfile.age}</Text>
              </View>
            )}
            
            {userProfile?.gender && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoValue}>{userProfile.gender}</Text>
              </View>
            )}
            
            {userProfile?.region && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Region:</Text>
                <Text style={styles.infoValue}>{userProfile.region}</Text>
              </View>
            )}
            
            {userProfile?.condition && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Condition:</Text>
                <Text style={styles.infoValue}>{userProfile.condition}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Next Check-in Reminder */}
        <View style={styles.reminderSection}>
          <Text style={styles.sectionTitle}>Your Health Check-in</Text>
          
          {daysSinceLastSurvey ? (
            <View style={styles.reminderCard}>
              {daysSinceLastSurvey >= 7 ? (
                <Text style={styles.reminderText}>
                  It's been {daysSinceLastSurvey} days since your last check-in.
                </Text>
              ) : (
                <Text style={styles.reminderText}>
                  Your last check-in was {daysSinceLastSurvey} day{daysSinceLastSurvey !== 1 ? 's' : ''} ago.
                </Text>
              )}
              
              {daysSinceLastSurvey >= 7 && (
                <Text style={styles.overdueText}>
                  A weekly check-in is recommended.
                </Text>
              )}
              
              <Button
                title="Take Health Check-in"
                onPress={() => handleStartSurvey()}
                style={styles.checkInButton}
              />
            </View>
          ) : lastSurveyDate ? (
            <View style={styles.reminderCard}>
              <Text style={styles.reminderText}>
                You completed a check-in today. Great job!
              </Text>
              <Text style={styles.reminderSubtext}>
                Taking regular health check-ins helps track your progress.
              </Text>
            </View>
          ) : (
            <View style={styles.reminderCard}>
              <Text style={styles.reminderText}>
                You haven't completed any check-ins yet.
              </Text>
              <Text style={styles.reminderSubtext}>
                Regular check-ins help you track your health over time.
              </Text>
              <Button
                title="Take First Health Check-in"
                onPress={() => handleStartSurvey()}
                style={styles.checkInButton}
              />
            </View>
          )}
        </View>

        <View style={styles.settingsButtonContainer}>
          <Button
            title="Profile Settings"
            onPress={() => navigation.navigate('ProfileEdit')}
            style={styles.profileButton}
            textStyle={styles.profileButtonText}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Logout"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
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
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86C1',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 5,
  },
  healthStatusCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 15,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  maxScoreText: {
    fontSize: 18,
    color: '#666',
    marginLeft: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lastUpdatedText: {
    fontSize: 14,
    color: '#666',
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  startSurveyText: {
    fontSize: 14,
    color: '#2E86C1',
  },
  tipCard: {
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
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  tipBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  tipSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  viewMoreContainer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#2E86C1',
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  surveyIcon: {
    backgroundColor: '#E1F5FE',
  },
  historyIcon: {
    backgroundColor: '#E8F5E9',
  },
  tipsIcon: {
    backgroundColor: '#FFF3CD',
  },
  doctorIcon: {
    backgroundColor: '#E8EAF6',
  },
  profileIcon: {
    backgroundColor: '#FFF3E0',
  },
  actionIconText: {
    fontSize: 22,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  profileSection: {
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
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  reminderSection: {
    marginBottom: 20,
  },
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  reminderSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  overdueText: {
    fontSize: 14,
    color: '#D32F2F',
    marginBottom: 10,
  },
  checkInButton: {
    backgroundColor: '#2E86C1',
  },
  settingsButtonContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  profileButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2E86C1',
  },
  profileButtonText: {
    color: '#2E86C1',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
});

export default HomeScreen;
