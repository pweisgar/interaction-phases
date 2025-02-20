
import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: string }>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(1);
  
  // Track first and last selection times for each question
  const firstSelectionTimes = useRef<{ [qId: number]: number }>({});
  const lastSelectionTimes = useRef<{ [qId: number]: number }>({});
  const questionTransitionTime = useRef<number | null>(null);

  useEffect(() => {
    survey.resetSurvey();
    const startTime = Date.now();
    survey.setStartTime(startTime);
    console.log("Survey started at:", startTime);

    // Set up mouseenter/mouseleave event handlers for questions
    const questions = document.querySelectorAll('[data-question-id]');
    
    const handleMouseEnter = (e: MouseEvent) => {
      const element = e.currentTarget as HTMLElement;
      const questionId = parseInt(element.getAttribute('data-question-id') || '1', 10);
      const timestamp = Date.now();
      
      if (currentQuestionId === 1 && questionId === 2) {
        questionTransitionTime.current = timestamp;
        console.log("Transition from Q1 to Q2 at:", timestamp);
      }
      
      setCurrentQuestionId(questionId);
    };

    questions.forEach(question => {
      question.addEventListener('mouseenter', handleMouseEnter as EventListener);
    });

    return () => {
      questions.forEach(question => {
        question.removeEventListener('mouseenter', handleMouseEnter as EventListener);
      });
    };
  }, []);

  const handleAnswerSelect = (questionId: number, value: string) => {
    const timestamp = Date.now();

    // Track first selection time
    if (!firstSelectionTimes.current[questionId]) {
      firstSelectionTimes.current[questionId] = timestamp;
      if (questionId === 1) {
        survey.setFirstInteractionTimeQ1(timestamp);
      } else {
        survey.setFirstInteractionTimeQ2(timestamp);
      }
      console.log(`First selection for Q${questionId} at:`, timestamp);
    }

    // Always update last selection time
    lastSelectionTimes.current[questionId] = timestamp;
    if (questionId === 1) {
      survey.setLastInteractionTimeQ1(timestamp);
    } else {
      survey.setLastInteractionTimeQ2(timestamp);
    }
    console.log(`Latest selection for Q${questionId} at:`, timestamp);

    // Update selected answers
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const submitTime = Date.now();
    survey.setSubmitTime(submitTime);
    console.log("Survey submitted at:", submitTime);

    // Store the final interaction times in the survey context
    if (lastSelectionTimes.current[1]) {
      survey.setLastInteractionTimeQ1(lastSelectionTimes.current[1]);
    }
    if (lastSelectionTimes.current[2]) {
      survey.setLastInteractionTimeQ2(lastSelectionTimes.current[2]);
    }

    setTimeout(() => {
      navigate("/results-multi");
    }, 150);
  };

  // Track mouse movement for visualization
  useEffect(() => {
    const trackMouseMovement = (e: MouseEvent) => {
      if (isSubmitting) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      const questionElement = element?.closest('[data-question-id]');
      const questionId = questionElement 
        ? parseInt(questionElement.getAttribute('data-question-id') || '1', 10)
        : currentQuestionId;

      // Determine the current phase for this position
      const getPhase = () => {
        if (questionId === 1) {
          if (!firstSelectionTimes.current[1]) return 'pre1';
          if (lastSelectionTimes.current[1] && questionTransitionTime.current) return 'post1';
          return 'during1';
        } else {
          if (!firstSelectionTimes.current[2]) return 'pre2';
          if (lastSelectionTimes.current[2]) return 'post2';
          return 'during2';
        }
      };

      survey.addMousePosition({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        phase: getPhase(),
        questionId
      });
    };

    window.addEventListener("mousemove", trackMouseMovement);
    return () => window.removeEventListener("mousemove", trackMouseMovement);
  }, [isSubmitting, currentQuestionId]);

  const allAnswered = QUESTIONS.every((q) => selectedAnswers[q.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in">
      <div className="max-w-2xl w-full space-y-8">
        {QUESTIONS.map((question) => (
          <div key={question.id} data-question-id={question.id} className="space-y-4">
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
