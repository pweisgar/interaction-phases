
import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QUESTIONS } from "@/lib/constants";

const MultiQuestionSurvey = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: string }>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(1);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    survey.resetSurvey();
    survey.setStartTime(Date.now());
    console.log("Survey started at:", Date.now());

    const trackMouseMovement = (e: MouseEvent) => {
      if (isSubmitting) return;

      // Get the element under the cursor
      const element = document.elementFromPoint(e.clientX, e.clientY);
      const questionElement = element?.closest('[data-question-id]');
      const questionId = questionElement 
        ? parseInt(questionElement.getAttribute('data-question-id') || '1', 10)
        : currentQuestionId;

      // Update current question if changed
      if (questionId !== currentQuestionId) {
        setCurrentQuestionId(questionId);
        console.log(`Cursor moved to question ${questionId}`);
      }

      // Determine the phase based on interactions and current question
      const getPhase = () => {
        const hasInteractedWithQuestion = selectedAnswers[questionId];
        
        if (!hasInteractedWithQuestion) {
          return questionId === 1 ? 'pre1' : 'pre2';
        }
        
        const isLastInteraction = Object.keys(selectedAnswers).length === QUESTIONS.length;
        if (isLastInteraction) {
          return questionId === 1 ? 'post1' : 'post2';
        }
        
        return questionId === 1 ? 'during1' : 'during2';
      };

      const position = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        phase: getPhase(),
        questionId
      };

      // Only add position if it's different from the last one
      if (!lastPositionRef.current || 
          lastPositionRef.current.x !== position.x || 
          lastPositionRef.current.y !== position.y) {
        survey.addMousePosition(position);
        lastPositionRef.current = { x: position.x, y: position.y };
      }
    };

    window.addEventListener("mousemove", trackMouseMovement);
    return () => window.removeEventListener("mousemove", trackMouseMovement);
  }, [isSubmitting, currentQuestionId, selectedAnswers]);

  const handleAnswerSelect = (questionId: number, value: string) => {
    if (!survey.firstInteractionTime) {
      survey.setFirstInteractionTime(Date.now());
      console.log("First interaction at:", Date.now());
    }
    
    survey.setLastInteractionTime(Date.now());
    console.log("Last interaction at:", Date.now());

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    survey.setSubmitTime(Date.now());
    console.log("Survey submitted at:", Date.now());
    console.log("Final mouse positions:", survey.mousePositions);

    setTimeout(() => {
      navigate("/results-multi");
    }, 150);
  };

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
