import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const QUESTIONS = [
  { id: 1, text: "How satisfied are you with your current work-life balance?" },
  { id: 2, text: "How often do you feel stressed during your daily routine?" }
];

const ANSWERS = [
  "Very Satisfied",
  "Somewhat Satisfied",
  "Neutral",
  "Somewhat Dissatisfied",
  "Very Dissatisfied"
];

const MultiQuestionSurvey = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    survey.resetSurvey();
    survey.setStartTime(Date.now());

    const trackMouseMovement = (e: MouseEvent) => {
      if (isSubmitting) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      const questionElement = element?.closest("[data-question-id]");
      const questionId = questionElement?.getAttribute("data-question-id");

      if (questionId) {
        const phase =
          !survey.firstInteractionTime[questionId] ? "pre" :
          !survey.lastInteractionTime[questionId] ? "during" : "post";

        survey.addMousePosition(parseInt(questionId), {
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now(),
          phase,
        });
      }
    };

    window.addEventListener("mousemove", trackMouseMovement);
    return () => window.removeEventListener("mousemove", trackMouseMovement);
  }, [isSubmitting, survey]);

  const handleAnswerSelect = (questionId: number, value: string) => {
    if (!survey.firstInteractionTime[questionId]) {
      survey.setFirstInteractionTime(questionId, Date.now());
    }
    survey.setLastInteractionTime(questionId, Date.now());
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    survey.setSubmitTime(Date.now());
    setTimeout(() => {
      navigate("/results-multi");
    }, 150);
  };

  const isAllQuestionsAnswered = QUESTIONS.every((q) => responses[q.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary">
      <div className="max-w-2xl w-full space-y-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">
          Multi-Question Survey
        </h2>

        {QUESTIONS.map((question) => (
          <div
            key={question.id}
            className="space-y-6 p-6 bg-white rounded-lg shadow-sm"
            data-question-id={question.id}
          >
            <h3 className="text-xl font-semibold text-gray-800">
              {question.text}
            </h3>
            <RadioGroup
              value={responses[question.id] || ""}
              onValueChange={(value) => handleAnswerSelect(question.id, value)}
              className="space-y-4"
            >
              {ANSWERS.map((answer) => (
                <div key={answer} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={answer}
                    id={`q${question.id}-${answer}`}
                    onClick={() => handleAnswerSelect(question.id, answer)} // Add this to handle selection properly
                  />
                  <Label
                    htmlFor={`q${question.id}-${answer}`}
                    className="text-gray-700 cursor-pointer"
                  >
                    {answer}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}

        <Button
          className="w-full py-6 text-lg font-medium bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={!isAllQuestionsAnswered || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Survey"}
        </Button>
      </div>
    </div>
  );
};

export default MultiQuestionSurvey;
