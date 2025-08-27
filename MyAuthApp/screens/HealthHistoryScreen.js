// MyAuthApp/screens/HealthHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';

// Import components and services
import Button from '../components/Button';
import { getCurrentUser } from '../services/authService';

// Import survey templates as fallbacks
import eczeamSurveyTemplate from '../data/eczeamSurveyTemplate';
import obesitySurveyTemplate from '../data/obesitySurveyTemplate';

const HealthHistoryScreen = ({ navigation, route }) => {
  // Get survey type from route params
  const surveyTypeFilter = route.params?.surveyType || null;
  
  const [user, setUser] = useState(null);
  const [surveyResults, setSurveyResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyTemplates, setSurveyTemplates] = useState({
    'eczema': eczeamSurveyTemplate,
    'obesity': obesitySurveyTemplate
  });
  const [selectedSurveyType, setSelectedSurveyType] = useState(surveyTypeFilter || 'all');

  // Fetch user data and survey results
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.uid) {
          // Fetch survey templates from Firestore
          await fetchSurveyTemplates();
          
          // Fetch user data including survey results
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.surveyResults && Array.isArray(userData.surveyResults) && userData.surveyResults.length > 0) {
              // Your existing filtering code here
              let filteredResults = userData.surveyResults;
              if (selectedSurveyType !== 'all') {
                filteredResults = userData.surveyResults.filter(
                  survey => survey.surveyType === selectedSurveyType
                );
              }
              
              // Sort survey results by date (newest first)
              const sortedResults = [...filteredResults].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
              });
              
              setSurveyResults(sortedResults);
              
              // Select the most recent survey by default
              if (sortedResults.length > 0) {
                setSelectedSurvey(sortedResults[0]);
              }
            } else {
              // Handle case when surveyResults is empty or not an array
              setSurveyResults([]);
              setSelectedSurvey(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching survey results:', error);
        Alert.alert('Error', 'Failed to load your health history data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [selectedSurveyType, surveyTypeFilter]);

  // Fetch survey templates from Firestore
  const fetchSurveyTemplates = async () => {
    try {
      const db = getFirestore();
      const surveysRef = collection(db, "surveyTemplates");
      const querySnapshot = await getDocs(surveysRef);
      
      const templates = { ...surveyTemplates }; // Start with default templates
      
      querySnapshot.forEach((doc) => {
        const templateData = doc.data();
        if (templateData.condition) {
          templates[templateData.condition] = templateData;
        }
      });
      
      setSurveyTemplates(templates);
    } catch (error) {
      console.error('Error fetching survey templates:', error);
      // Continue with hardcoded templates as fallback
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color based on score
  const getScoreColor = (survey) => {
    // If survey has color information, use it
    if (survey.severityColor) {
      return survey.severityColor;
    }
    
    // Otherwise calculate based on score
    const template = surveyTemplates[survey.surveyType];
    if (template && template.scoringBands) {
      for (const band of template.scoringBands) {
        if (survey.score >= band.min && survey.score <= band.max) {
          return band.color;
        }
      }
    }
    
    // Default colors as fallback
    if (survey.score >= 0.8 * (survey.maxPossibleScore || 28)) return '#F44336'; // Very severe/high
    if (survey.score >= 0.6 * (survey.maxPossibleScore || 28)) return '#FF9800'; // Severe/high
    if (survey.score >= 0.3 * (survey.maxPossibleScore || 28)) return '#FFC107'; // Moderate
    if (survey.score > 0) return '#8BC34A'; // Mild/low
    return '#4CAF50'; // None/healthy
  };

  // Get severity label based on score
  const getSeverityLabel = (survey) => {
    // If survey has severity label information, use it
    if (survey.severityLabel) {
      return survey.severityLabel;
    }
    
    // Otherwise calculate based on score and survey type
    const template = surveyTemplates[survey.surveyType];
    if (template && template.scoringBands) {
      for (const band of template.scoringBands) {
        if (survey.score >= band.min && survey.score <= band.max) {
          return band.label;
        }
      }
    }
    
    return "Unknown";
  };

  // Get survey title
  const getSurveyTitle = (surveyType) => {
    const template = surveyTemplates[surveyType];
    return template ? template.title : surveyType.charAt(0).toUpperCase() + surveyType.slice(1);
  };

  // Handle survey type filter
  const handleFilterByType = (type) => {
    setSelectedSurveyType(type);
  };

  // Handle start new survey
  const handleStartSurvey = (surveyType = null) => {
    navigation.navigate('Survey', { surveyType });
  };

  // Show loading indicator while fetching data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
      </View>
    );
  }

  // Show message if no survey results available
  if (surveyResults.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No health check-in records found</Text>
          <Text style={styles.noDataSubtext}>
            {selectedSurveyType !== 'all' 
              ? `No ${getSurveyTitle(selectedSurveyType)} assessments found. Complete one to start tracking.`
              : 'Complete a health check-in to start tracking your progress.'}
          </Text>
          
          {/* Survey type filter buttons */}
          <View style={styles.surveyTypeFilters}>
            <Text style={styles.filterLabel}>View:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedSurveyType === 'all' && styles.activeFilterButton
                ]}
                onPress={() => handleFilterByType('all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedSurveyType === 'all' && styles.activeFilterButtonText
                ]}>All</Text>
              </TouchableOpacity>
              
              {Object.keys(surveyTemplates).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    selectedSurveyType === type && styles.activeFilterButton
                  ]}
                  onPress={() => handleFilterByType(type)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedSurveyType === type && styles.activeFilterButtonText
                  ]}>{getSurveyTitle(type)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <Button
            title={`Take ${selectedSurveyType !== 'all' ? getSurveyTitle(selectedSurveyType) : 'Health'} Check-in`}
            onPress={() => handleStartSurvey(selectedSurveyType !== 'all' ? selectedSurveyType : null)}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Get questions for the selected survey
  const getQuestionsForSurvey = (survey) => {
    const template = surveyTemplates[survey.surveyType];
    return template ? template.questions : [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your Health History</Text>
        
        {/* Survey type filter buttons */}
        <View style={styles.surveyTypeFilters}>
          <Text style={styles.filterLabel}>View:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedSurveyType === 'all' && styles.activeFilterButton
              ]}
              onPress={() => handleFilterByType('all')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedSurveyType === 'all' && styles.activeFilterButtonText
              ]}>All</Text>
            </TouchableOpacity>
            
            {Object.keys(surveyTemplates).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedSurveyType === type && styles.activeFilterButton
                ]}
                onPress={() => handleFilterByType(type)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedSurveyType === type && styles.activeFilterButtonText
                ]}>{getSurveyTitle(type)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Survey History Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.surveySelector}
        >
          {surveyResults.map((survey, index) => {
            const surveyDate = new Date(survey.date);
            const isSelected = selectedSurvey?.date === survey.date;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.surveyDateCard,
                  isSelected && styles.selectedSurveyDateCard,
                  { borderLeftColor: getScoreColor(survey), borderLeftWidth: 5 }
                ]}
                onPress={() => setSelectedSurvey(survey)}
              >
                <Text style={styles.surveyTypeIndicator}>
                  {getSurveyTitle(survey.surveyType)}
                </Text>
                <Text style={styles.surveyDateDay}>
                  {surveyDate.getDate()}
                </Text>
                <Text style={styles.surveyDateMonth}>
                  {surveyDate.toLocaleString('default', { month: 'short' })}
                </Text>
                {isSelected && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Selected Survey Details */}
        {selectedSurvey && (
          <View style={styles.selectedSurveyContainer}>
            <View style={styles.surveyHeader}>
              <View>
                <Text style={styles.surveyType}>
                  {getSurveyTitle(selectedSurvey.surveyType)}
                </Text>
                <Text style={styles.surveyDate}>
                  {formatDate(selectedSurvey.date)}
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text 
                  style={[
                    styles.scoreText, 
                    { color: getScoreColor(selectedSurvey) }
                  ]}
                >
                  {selectedSurvey.score}
                </Text>
                <Text style={styles.maxScoreText}>/{selectedSurvey.maxPossibleScore || 28}</Text>
              </View>
            </View>
            
            <View style={styles.severityContainer}>
              <Text style={styles.severityLabel}>Assessment:</Text>
              <View style={[
                styles.severityBadge,
                { backgroundColor: getScoreColor(selectedSurvey) }
              ]}>
                <Text style={styles.severityText}>
                  {getSeverityLabel(selectedSurvey)}
                </Text>
              </View>
            </View>
            
            <View style={styles.answersContainer}>
              <Text style={styles.answersTitle}>Your Responses:</Text>
              
              {selectedSurvey.answers && selectedSurvey.answers.map((answer, index) => {
                // Find matching question from the template
                const questions = getQuestionsForSurvey(selectedSurvey);
                const question = questions.find(q => q.id === answer.questionId);
                if (!question) return null;
                
                // Find matching option for the answer
                const option = question.options.find(opt => opt.value === answer.answer);
                
                return (
                  <View key={index} style={styles.answerItem}>
                    <Text style={styles.questionText}>{question.question}</Text>
                    <View style={[
                      styles.answerBadge, 
                      { backgroundColor: getScoreColor({
                        score: answer.score,
                        surveyType: selectedSurvey.surveyType,
                        maxPossibleScore: 4 // Each individual question has max score of 4
                      }) }
                    ]}>
                      <Text style={styles.answerText}>
                        {option ? option.label : answer.answer}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Button to take a new survey */}
        <View style={styles.buttonContainer}>
          <Button
            title={`Take New ${selectedSurveyType !== 'all' ? getSurveyTitle(selectedSurveyType) : 'Health'} Check-in`}
            onPress={() => handleStartSurvey(selectedSurveyType !== 'all' ? selectedSurveyType : null)}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  surveyTypeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
    color: '#555',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#2E86C1',
  },
  filterButtonText: {
    color: '#555',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  surveySelector: {
    flexDirection: 'row',
    paddingBottom: 10,
    marginBottom: 20,
  },
  surveyDateCard: {
    width: 90,
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
    overflow: 'hidden',
  },
  selectedSurveyDateCard: {
    backgroundColor: '#E1F5FE',
    borderColor: '#2E86C1',
    borderWidth: 1,
  },
  surveyTypeIndicator: {
    position: 'absolute',
    top: 5,
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  surveyDateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  surveyDateMonth: {
    fontSize: 14,
    color: '#666',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E86C1',
  },
  selectedSurveyContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  surveyType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  surveyDate: {
    fontSize: 14,
    color: '#666',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  maxScoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  severityLabel: {
    fontSize: 16,
    color: '#555',
    marginRight: 10,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  severityText: {
    color: 'white',
    fontWeight: '500',
  },
  answersContainer: {
    paddingTop: 5,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  answerItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  questionText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  answerBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  answerText: {
    color: 'white',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 30,
  },
});

export default HealthHistoryScreen;