// MyAuthApp/screens/SurveyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';

// Import Firebase config
import '../firebase/firebaseConfig';
import { getFirestore, doc, updateDoc, arrayUnion, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Import components and services
import Button from '../components/Button';
import { getCurrentUser, updateUserProfile } from '../services/authService';

const SurveyScreen = ({ navigation, route }) => {
  // Get survey type from route params, default to user's primary condition
  const surveyType = route.params?.surveyType || null;
  
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [surveyTemplate, setSurveyTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [previousAnswers, setPreviousAnswers] = useState(null);

  // Fetch user data and appropriate survey template
  useEffect(() => {
    const fetchUserAndSurvey = async () => {
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
            
            // If surveyType is specified or user has a condition, load that survey
            if (surveyType || userData.condition) {
              const conditionToLoad = surveyType || userData.condition;
              loadSurveyTemplate(conditionToLoad, userData);
            } else {
              // If no condition is specified and user doesn't have one, we'll show condition selector
              setIsFetching(false);
            }
          } else {
            setIsFetching(false);
          }
        } else {
          setIsFetching(false);
        }
      } catch (error) {
        console.error('Error fetching user or survey:', error);
        Alert.alert('Error', 'Failed to load survey data. Please try again.');
        setIsFetching(false);
      }
    };

    fetchUserAndSurvey();
  }, [surveyType]);

  // Load survey template for a specific condition
  const loadSurveyTemplate = async (conditionType, userData) => {
    try {
      // Fetch the appropriate survey template
      const db = getFirestore();
      const surveysRef = collection(db, "surveyTemplates");
      const q = query(surveysRef, where("condition", "==", conditionType));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Get the first matching survey template
        const surveyDoc = querySnapshot.docs[0];
        setSurveyTemplate(surveyDoc.data());
      } else {
        // Fallback to hardcoded template if none found in Firestore
        const fallbackTemplate = conditionType === 'obesity' 
          ? require('../data/obesitySurveyTemplate').default
          : require('../data/eczeamSurveyTemplate').default;
        
        setSurveyTemplate(fallbackTemplate);
      }
      
      // Get previous survey results if any
      if (userData.surveyResults && userData.surveyResults.length > 0) {
        // Filter to get only the results for this survey type
        const relevantSurveys = userData.surveyResults.filter(
          survey => survey.surveyType === conditionType
        );
        
        if (relevantSurveys.length > 0) {
          // Get the most recent relevant survey
          const lastSurvey = relevantSurveys.reduce((latest, current) => {
            return new Date(latest.date) > new Date(current.date) ? latest : current;
          });
          setPreviousAnswers(lastSurvey.answers);
        }
      }
    } catch (error) {
      console.error('Error loading survey template:', error);
      Alert.alert('Error', 'Failed to load survey template. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  // Function to fetch and set survey template
  const fetchSurveyTemplate = async (conditionType) => {
    setIsFetching(true);
    try {
      // Load the survey template
      await loadSurveyTemplate(conditionType, userProfile || {});
      
      // Update the user's condition if not already set
      if (user?.uid && (!userProfile?.condition || userProfile.condition === '')) {
        updateUserProfile({ condition: conditionType });
      }
    } catch (error) {
      console.error('Error fetching survey template:', error);
      Alert.alert('Error', 'Failed to load survey. Please try again.');
      setIsFetching(false);
    }
  };

  // Handle answer selection
  const handleSelectAnswer = (questionId, value, score) => {
    setAnswers({
      ...answers,
      [questionId]: { value, score }
    });
    
    // Automatically move to next question after selection
    if (currentQuestion < surveyTemplate.questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestion < surveyTemplate.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Calculate the total score
  const calculateTotalScore = () => {
    let totalScore = 0;
    
    Object.values(answers).forEach(answer => {
      totalScore += answer.score;
    });
    
    return totalScore;
  };

  // Get the severity band based on the score
  const getSeverityBand = (score) => {
    if (!surveyTemplate || !surveyTemplate.scoringBands) {
      return { label: "Unknown", color: "#757575" };
    }
    
    for (const band of surveyTemplate.scoringBands) {
      if (score >= band.min && score <= band.max) {
        return { label: band.label, color: band.color };
      }
    }
    
    return { label: "Unknown", color: "#757575" };
  };

  // Submit survey answers
  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < surveyTemplate.questions.length) {
      Alert.alert('Incomplete Survey', 'Please answer all questions before submitting.');
      return;
    }

    setIsLoading(true);

    try {
      if (user?.uid) {
        const db = getFirestore();
        
        // Format the survey results
        const formattedAnswers = Object.entries(answers).map(([questionId, answerData]) => ({
          questionId,
          answer: answerData.value,
          score: answerData.score
        }));
        
        // Calculate total score
        const totalScore = calculateTotalScore();
        const severityBand = getSeverityBand(totalScore);
        
        // Prepare survey result object
        const surveyResult = {
          date: new Date().toISOString(),
          surveyType: surveyTemplate.condition,
          surveyId: surveyTemplate.id,
          answers: formattedAnswers,
          score: totalScore,
          maxPossibleScore: surveyTemplate.maxScore,
          severityLabel: severityBand.label,
          severityColor: severityBand.color
        };
        
        // Update user document with new survey result
        await updateDoc(doc(db, "users", user.uid), {
          surveyResults: arrayUnion(surveyResult),
          lastSurveyCompleted: new Date().toISOString(),
          // Also update the latest score for this condition
          [`latestScores.${surveyTemplate.condition}`]: {
            score: totalScore,
            date: new Date().toISOString(),
            severityLabel: severityBand.label
          }
        });
        
        Alert.alert(
          'Survey Completed',
          `Thank you for completing your ${surveyTemplate.title}. Your score: ${totalScore}/${surveyTemplate.maxScore} (${severityBand.label}).`,
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      Alert.alert('Error', 'Failed to submit survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render condition selection screen
  const renderConditionSelector = () => {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Health Assessment</Text>
            <Text style={styles.subtitle}>Choose which condition you want to check in on</Text>
          </View>
          
          <View style={styles.conditionContainer}>
            <TouchableOpacity
              style={styles.conditionCard}
              onPress={() => fetchSurveyTemplate('eczema')}
            >
              <View style={[styles.conditionIcon, { backgroundColor: '#E1F5FE' }]}>
                <Text style={styles.conditionEmoji}>🧴</Text>
              </View>
              <Text style={styles.conditionName}>Eczema</Text>
              <Text style={styles.conditionDesc}>Skin condition assessment using POEM score</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.conditionCard}
              onPress={() => fetchSurveyTemplate('obesity')}
            >
              <View style={[styles.conditionIcon, { backgroundColor: '#FFF3CD' }]}>
                <Text style={styles.conditionEmoji}>🍎</Text>
              </View>
              <Text style={styles.conditionName}>Obesity</Text>
              <Text style={styles.conditionDesc}>Weight management and lifestyle assessment</Text>
            </TouchableOpacity>
          </View>
          
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  };

  // Display a loading indicator while data is being fetched
  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Preparing your survey...</Text>
      </View>
    );
  }

  // Show condition selector if no survey template is loaded
  if (!surveyTemplate) {
    return renderConditionSelector();
  }

  // Display submitting indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Submitting your responses...</Text>
      </View>
    );
  }

  // Get the current question
  const currentQ = surveyTemplate.questions[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{surveyTemplate.title}</Text>
          <Text style={styles.subtitle}>{surveyTemplate.description}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentQuestion + 1) / surveyTemplate.questions.length) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {surveyTemplate.questions.length}
            </Text>
          </View>
        </View>
        
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQ.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQ.options.map((option) => {
              const isSelected = answers[currentQ.id]?.value === option.value;
              
              // Show previous answer if available
              let previousAnswer = null;
              if (previousAnswers) {
                const prevAnswer = previousAnswers.find(a => a.questionId === currentQ.id);
                if (prevAnswer && prevAnswer.answer === option.value) {
                  previousAnswer = true;
                }
              }
              
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                    previousAnswer && styles.previousAnswerOption
                  ]}
                  onPress={() => handleSelectAnswer(currentQ.id, option.value, option.score)}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText
                    ]}
                  >
                    {option.label}
                  </Text>
                  {previousAnswer && (
                    <Text style={styles.previousText}>(Previous)</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        <View style={styles.navigationContainer}>
          {currentQuestion > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePrevious}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          {currentQuestion < surveyTemplate.questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNext}
              disabled={!answers[currentQ.id]}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <Button
              title="Submit"
              onPress={handleSubmit}
              disabled={!answers[currentQ.id]}
            />
          )}
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
    flexGrow: 1,
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
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E86C1',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E86C1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  optionsContainer: {
    marginBottom: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#E1F5FE',
    borderColor: '#2E86C1',
  },
  previousAnswerOption: {
    borderStyle: 'dashed',
    borderColor: '#81C784',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#0277BD',
  },
  previousText: {
    fontSize: 12,
    color: '#388E3C',
    fontStyle: 'italic',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  navButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  nextButton: {
    backgroundColor: '#2E86C1',
  },
  navButtonText: {
    color: '#2E86C1',
    fontWeight: '600',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Condition selector styles
  conditionContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: 30,
  },
  conditionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  conditionEmoji: {
    fontSize: 36,
  },
  conditionName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  conditionDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  }
});

export default SurveyScreen;