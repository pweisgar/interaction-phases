import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurvey } from '@/contexts/SurveyContext';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ANSWERS = [
  "Very Happy",
  "Somewhat Happy",
  "Neutral",
  "Somewhat Unhappy",
  "Very Unhappy"
];

const Survey = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    survey.resetSurvey();
    survey.setStartTime(Date.now());

    const trackMouseMovement = (e: MouseEvent) => {
      const phase = survey.firstInteractionTime === null ? 'pre' : 
        (survey.lastInteractionTime === null ? 'during' : 'post');
      
      survey.addMousePosition({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        phase,
      });
    };

    window.addEventListener('mousemove', trackMouseMovement);
    return () => window.removeEventListener('mousemove', trackMouseMovement);
  }, []);

  const handleAnswerSelect = (value: string) => {
    if (!survey.firstInteractionTime) {
      survey.setFirstInteractionTime(Date.now());
    } else {
      survey.setLastInteractionTime(Date.now());
    }
    survey.setSelectedAnswer(value);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    survey.setSubmitTime(Date.now());
    setTimeout(() => {
      navigate('/results');
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">
            How are you feeling today?
          </h2>
        </div>

        <RadioGroup
          className="space-y-4"
          value={survey.selectedAnswer || ""}
          onValueChange={handleAnswerSelect}
        >
          {ANSWERS.map((answer) => (
            <div key={answer} className="flex items-center space-x-3">
              <RadioGroupItem 
                value={answer} 
                id={answer} 
                className="bg-black border-black checked:bg-black checked:border-black"
              />
              <Label htmlFor={answer} className="flex-grow cursor-pointer">{answer}</Label>
            </div>
          ))}
        </RadioGroup>

        <Button
          className="w-full py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!survey.selectedAnswer || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Survey"}
        </Button>
      </div>
    </div>
  );
};

export default Survey;
