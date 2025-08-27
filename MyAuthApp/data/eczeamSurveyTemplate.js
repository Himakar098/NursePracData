// MyAuthApp/data/eczeamSurveyTemplate.js
// Default template for Eczema POEM assessment if not found in Firestore

const eczeamSurveyTemplate = {
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
  };

  export default eczeamSurveyTemplate;