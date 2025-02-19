
export const PHASE_COLORS = {
  pre1: "#808080",    // Grey
  during1: "#007BFF", // Blue
  post1: "#28a745",   // Green
  pre2: "#A9A9A9",    // Dark Grey
  during2: "#0056b3", // Dark Blue
  post2: "#218838",   // Dark Green
} as const;

export const QUESTIONS = [
  {
    id: 1,
    title: "Question 1: How satisfied are you with your work-life balance?",
    answers: [
      "Very Satisfied",
      "Somewhat Satisfied",
      "Neutral",
      "Somewhat Dissatisfied",
      "Very Dissatisfied",
    ],
  },
  {
    id: 2,
    title: "Question 2: How often do you feel stressed during daily routines?",
    answers: [
      "Never",
      "Rarely",
      "Sometimes",
      "Often",
      "Always",
    ],
  },
] as const;
