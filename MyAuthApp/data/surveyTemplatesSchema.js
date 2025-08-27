// surveyTemplates.js - Schema for survey templates in Firestore

// Example of the survey template structure
const surveyTemplatesSchema = {
    // Collection: surveyTemplates
    
    // Document: eczema-poem
    eczeamPOEM: {
      id: "eczema-poem",
      title: "Eczema Severity Assessment (POEM)",
      description: "Track the severity of eczema symptoms over the past week",
      condition: "eczema",
      maxScore: 28,
      scoringBands: [
        { min: 0, max: 2, label: "No eczema", color: "#4CAF50" },
        { min: 3, max: 7, label: "Mild eczema", color: "#8BC34A" },
        { min: 8, max: 16, label: "Moderate eczema", color: "#FFC107" },
        { min: 17, max: 24, label: "Severe eczema", color: "#FF9800" },
        { min: 25, max: 28, label: "Very severe eczema", color: "#F44336" }
      ],
      questions: [
        {
          id: 'q1',
          question: 'Over the last week, on how many days has your child\'s skin been itchy because of their eczema?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        },
        {
          id: 'q2',
          question: 'Over the last week, on how many days has your child\'s sleep been disturbed because of their eczema?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        },
        {
          id: 'q3',
          question: 'Over the last week, on how many days has your child\'s skin been bleeding because of their eczema?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        },
        {
          id: 'q4',
          question: 'Over the last week, on how many days has your child\'s skin been weeping or oozing clear fluid because of their eczema?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        },
        {
          id: 'q5',
          question: 'Over the last week, on how many days has your child\'s skin been cracked because of their eczema?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        },
        {
          id: 'q6',
          question: 'Over the last week, on how many days has your child\'s skin been flaking off because of their eczema?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        },
        {
          id: 'q7',
          question: 'Over the last week, on how many days has your child\'s skin felt dry or rough because of their eczema?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        }
      ],
      resultInterpretation: "The POEM score helps track eczema severity and guide treatment decisions. Regular assessments can help monitor response to treatments and manage flare-ups."
    },
    
    // Document: obesity-assessment
    obesityAssessment: {
      id: "obesity-assessment",
      title: "Child Obesity Assessment",
      description: "Track your child's weight, diet, and physical activity habits",
      condition: "obesity",
      maxScore: 28, // Example max score
      scoringBands: [
        { min: 0, max: 7, label: "Healthy habits", color: "#4CAF50" },
        { min: 8, max: 14, label: "Moderate concern", color: "#FFC107" },
        { min: 15, max: 21, label: "High concern", color: "#FF9800" },
        { min: 22, max: 28, label: "Very high concern", color: "#F44336" }
      ],
      questions: [
        {
          id: 'q1',
          question: 'How many days in the past week did your child consume fruits and vegetables?',
          options: [
            { value: '4', label: 'Every day', score: 0 },
            { value: '3', label: '5-6 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '1', label: '1-2 days', score: 3 },
            { value: '0', label: 'No days', score: 4 }
          ]
        },
        {
          id: 'q2',
          question: 'How many days in the past week did your child consume sugary drinks (soda, juice, sports drinks)?',
          options: [
            { value: '0', label: 'No days', score: 0 },
            { value: '1', label: '1-2 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '3', label: '5-6 days', score: 3 },
            { value: '4', label: 'Every day', score: 4 }
          ]
        },
        {
          id: 'q3',
          question: 'How many days in the past week did your child engage in physical activity for at least 60 minutes?',
          options: [
            { value: '4', label: 'Every day', score: 0 },
            { value: '3', label: '5-6 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '1', label: '1-2 days', score: 3 },
            { value: '0', label: 'No days', score: 4 }
          ]
        },
        {
          id: 'q4',
          question: 'How many hours per day does your child spend on screen time (TV, computer, phone, etc.)?',
          options: [
            { value: '0', label: 'Less than 1 hour', score: 0 },
            { value: '1', label: '1-2 hours', score: 1 },
            { value: '2', label: '2-3 hours', score: 2 },
            { value: '3', label: '3-4 hours', score: 3 },
            { value: '4', label: 'More than 4 hours', score: 4 }
          ]
        },
        {
          id: 'q5',
          question: 'How many fast food or restaurant meals did your child consume in the past week?',
          options: [
            { value: '0', label: 'None', score: 0 },
            { value: '1', label: '1-2 meals', score: 1 },
            { value: '2', label: '3-4 meals', score: 2 },
            { value: '3', label: '5-6 meals', score: 3 },
            { value: '4', label: '7 or more meals', score: 4 }
          ]
        },
        {
          id: 'q6',
          question: 'How many days in the past week did your child eat breakfast?',
          options: [
            { value: '4', label: 'Every day', score: 0 },
            { value: '3', label: '5-6 days', score: 1 },
            { value: '2', label: '3-4 days', score: 2 },
            { value: '1', label: '1-2 days', score: 3 },
            { value: '0', label: 'No days', score: 4 }
          ]
        },
        {
          id: 'q7',
          question: 'How often does your child eat snacks between meals?',
          options: [
            { value: '0', label: 'Rarely or never', score: 0 },
            { value: '1', label: 'Once a day', score: 1 },
            { value: '2', label: 'Twice a day', score: 2 },
            { value: '3', label: '3 times a day', score: 3 },
            { value: '4', label: 'More than 3 times a day', score: 4 }
          ]
        }
      ],
      resultInterpretation: "This assessment helps track lifestyle factors that contribute to weight management. Regular monitoring can help identify areas for improvement and track progress over time."
    }
  };
  
  export default surveyTemplatesSchema;