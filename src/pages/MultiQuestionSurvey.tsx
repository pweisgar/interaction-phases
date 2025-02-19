import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Two questions, each with five answers
const QUESTIONS = [
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
];

const MultiQuestionSurvey = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track selected answers for each question
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: string }>({});

  useEffect(() => {
    // Reset & start the survey as soon as the component mounts
    survey.resetSurvey();
    survey.setStartTime(Date.now());

    // Mouse tracking logic (same as single question)
    const trackMouseMovement = (e: MouseEvent) => {
      if (isSubmitting) return;

      // We'll do overall phase logic here (one set of first/last times)
      const phase =
        survey.firstInteractionTime === null
          ? "pre"
          : survey.lastInteractionTime === null
          ? "during"
          : "post";

      survey.addMousePosition({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        phase,
      });
    };

    window.addEventListener("mousemove", trackMouseMovement);
    return () => window.removeEventListener("mousemove", trackMouseMovement);
  }, [isSubmitting]);

  // When user selects an answer for a question
  const handleAnswerSelect = (questionId: number, value: string) => {
    // If no first interaction, set it
    if (!survey.firstInteractionTime) {
      survey.setFirstInteractionTime(Date.now());
    } else {
      // Else, we might be in "during"
      survey.setLastInteractionTime(Date.now());
    }

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Submit both questions
  const handleSubmit = () => {
    setIsSubmitting(true);
    survey.setSubmitTime(Date.now());

    // Short delay before navigating
    setTimeout(() => {
      navigate("/results-multi");
    }, 150);
  };

  // Check if both questions answered
  const allAnswered = QUESTIONS.every((q) => selectedAnswers[q.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            Multi-Question Survey
          </h2>
        </div>

        {/* Render each question with a RadioGroup, identical logic to single question */}
        {QUESTIONS.map((question) => (
          <div key={question.id} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{question.title}</h3>
            <RadioGroup
              className="space-y-4"
              value={selectedAnswers[question.id] || ""}
              onValueChange={(val) => handleAnswerSelect(question.id, val)}
            >
              {question.answers.map((answer) => (
                <div key={answer} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={answer}
                    id={`q${question.id}-${answer}`}
                    className="
                      appearance-none w-5 h-5 border-2 border-black rounded-full bg-white
                      checked:bg-black checked:border-black
                      focus:outline-none focus:ring-0 focus:ring-offset-0
                      before:hidden after:hidden
                    "
                  />
                  <Label
                    htmlFor={`q${question.id}-${answer}`}
                    className="flex-grow cursor-pointer"
                  >
                    {answer}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}

        <Button
          className="
            w-full 
            py-6 
            text-lg 
            font-medium 
            transition-all 
            duration-200 
            transform 
            hover:scale-105 
            bg-gray-300 
            hover:bg-gray-400 
            text-black 
            disabled:opacity-50
          "
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Survey"}
        </Button>
      </div>
    </div>
  );
};

export default MultiQuestionSurvey;
