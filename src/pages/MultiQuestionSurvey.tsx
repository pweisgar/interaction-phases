import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey, MousePosition, InteractionPhase } from "@/contexts/SurveyContext";
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

// Phase colors for both questions (same for pre/during/post)
const PHASE_COLORS = {
  pre: "#808080",    // Grey
  during: "#007BFF", // Blue
  post: "#28a745",   // Green
};

// Modified basePhase function that strips the question-specific suffix
const basePhase = (phase: string): "pre" | "during" | "post" => {
  if (phase.endsWith("1") || phase.endsWith("2")) {
    // Remove the trailing digit (question id)
    return phase.slice(0, phase.length - 1) as "pre" | "during" | "post";
  }
  if (phase.startsWith("pre")) return "pre";
  if (phase.startsWith("during")) return "during";
  return "post";
};

const MultiQuestionSurvey = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track selected answers for each question
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: string }>({});
  // NEW: Track the current active question id (1 or 2)
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  useEffect(() => {
    // Reset & start the survey when the component mounts
    survey.resetSurvey();
    const now = Date.now();
    survey.setStartTime(now);
    console.log("Survey started at", now);

    // Mouse tracking logic now takes the currentQuestionId into account.
    const trackMouseMovement = (e: MouseEvent) => {
      if (isSubmitting) return;
    
      let phase: InteractionPhase;
      if (currentQuestionId === 1) {
        phase =
          survey.firstInteractionTimeQ1 === null
            ? ("pre1" as InteractionPhase)
            : survey.lastInteractionTimeQ1 === null
            ? ("during1" as InteractionPhase)
            : ("post1" as InteractionPhase);
      } else if (currentQuestionId === 2) {
        phase =
          survey.firstInteractionTimeQ2 === null
            ? ("pre2" as InteractionPhase)
            : survey.lastInteractionTimeQ2 === null
            ? ("during2" as InteractionPhase)
            : ("post2" as InteractionPhase);
      } else {
        phase =
          survey.firstInteractionTime === null
            ? ("pre" as InteractionPhase)
            : survey.lastInteractionTime === null
            ? ("during" as InteractionPhase)
            : ("post" as InteractionPhase);
      }
    
      survey.addMousePosition({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        phase,
      });
    };    

    window.addEventListener("mousemove", trackMouseMovement);
    return () => window.removeEventListener("mousemove", trackMouseMovement);
  }, [isSubmitting, currentQuestionId, survey]);

  // When a user selects an answer, update both the selected answer and the active question id.
  const handleAnswerSelect = (questionId: number, value: string) => {
    setCurrentQuestionId(questionId);
    const now = Date.now();

    // Update overall (single-question) interaction times
    if (!survey.firstInteractionTime) {
      survey.setFirstInteractionTime(now);
      console.log(`Set overall firstInteractionTime at ${now}`);
    } else {
      survey.setLastInteractionTime(now);
      console.log(`Set overall lastInteractionTime at ${now}`);
    }

    // Update multi-question specific times
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

    // Short delay before navigating to results page
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
        {QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">{q.title}</h3>
            <RadioGroup
              className="space-y-4"
              value={selectedAnswers[q.id] || ""}
              onValueChange={(val) => handleAnswerSelect(q.id, val)}
            >
              {q.answers.map((answer) => (
                <div key={answer} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={answer}
                    id={`q${q.id}-${answer}`}
                    className="
                      appearance-none w-5 h-5 border-2 border-black rounded-full bg-white
                      checked:bg-black checked:border-black
                      focus:outline-none focus:ring-0 focus:ring-offset-0
                      before:hidden after:hidden
                    "
                  />
                  <Label
                    htmlFor={`q${q.id}-${answer}`}
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
          className="w-full py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
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
