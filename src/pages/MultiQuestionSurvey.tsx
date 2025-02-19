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
    title: "How satisfied are you with your work-life balance?",
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
    title: "How often do you feel stressed during daily routines?",
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

  // Run this effect only once on mount, not when isSubmitting changes.
  useEffect(() => {
    // Reset & start the survey as soon as the component mounts
    survey.resetSurvey();
    const now = Date.now();
    survey.setStartTime(now);
    console.log("Survey started at", now);

    // Mouse tracking logic (same as single question)
    const trackMouseMovement = (e: MouseEvent) => {
      if (isSubmitting) return;

      // Determine overall phase logic
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
  }, []); // <-- Dependency array is now empty

  // Debug: log the SurveyContext values whenever they change.
  useEffect(() => {
    console.log("MultiQuestionSurvey - Survey Context Values:", {
      startTime: survey.startTime,
      firstInteractionTime: survey.firstInteractionTime,
      lastInteractionTime: survey.lastInteractionTime,
      firstInteractionTimeQ1: survey.firstInteractionTimeQ1,
      lastInteractionTimeQ1: survey.lastInteractionTimeQ1,
      firstInteractionTimeQ2: survey.firstInteractionTimeQ2,
      lastInteractionTimeQ2: survey.lastInteractionTimeQ2,
      mousePositions: survey.mousePositions,
      submitTime: survey.submitTime,
    });
  }, [
    survey.startTime,
    survey.firstInteractionTime,
    survey.lastInteractionTime,
    survey.firstInteractionTimeQ1,
    survey.lastInteractionTimeQ1,
    survey.firstInteractionTimeQ2,
    survey.lastInteractionTimeQ2,
    survey.mousePositions,
    survey.submitTime,
  ]);

  // When user selects an answer for a question
  const handleAnswerSelect = (questionId: number, value: string) => {
    const now = Date.now();

    // Update overall (single-question) times:
    if (!survey.firstInteractionTime) {
      survey.setFirstInteractionTime(now);
      console.log(`Set overall firstInteractionTime at ${now}`);
    } else {
      survey.setLastInteractionTime(now);
      console.log(`Set overall lastInteractionTime at ${now}`);
    }

    // Multi-question tracking for Q1 or Q2:
    if (questionId === 1) {
      if (!survey.firstInteractionTimeQ1) {
        survey.setFirstInteractionTimeQ1(now);
        console.log(`Set firstInteractionTimeQ1 at ${now}`);
      } else {
        survey.setLastInteractionTimeQ1(now);
        console.log(`Set lastInteractionTimeQ1 at ${now}`);
      }
    } else if (questionId === 2) {
      if (!survey.firstInteractionTimeQ2) {
        survey.setFirstInteractionTimeQ2(now);
        console.log(`Set firstInteractionTimeQ2 at ${now}`);
      } else {
        survey.setLastInteractionTimeQ2(now);
        console.log(`Set lastInteractionTimeQ2 at ${now}`);
      }
    }

    // Update selected answers
    setSelectedAnswers((prev) => {
      const updated = { ...prev, [questionId]: value };
      console.log("Updated selectedAnswers:", updated);
      return updated;
    });
  };

  // Submit both questions
  const handleSubmit = () => {
    setIsSubmitting(true);
    const now = Date.now();
    survey.setSubmitTime(now);
    console.log("Survey submitted at", now);

    // Short delay before navigating
    setTimeout(() => {
      navigate("/results-multi");
    }, 150);
  };

  // Check if both questions are answered
  const allAnswered = QUESTIONS.every((q) => selectedAnswers[q.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-4"></div>

        {/* Render each question */}
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
