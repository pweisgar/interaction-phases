
import * as React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Question {
  id: number;
  title: string;
  answers: string[];
}

interface SurveyDisplayProps {
  questions: Question[];
}

export const SurveyDisplay: React.FC<SurveyDisplayProps> = ({ questions }) => {
  return (
    <div className="max-w-2xl w-full space-y-8 translate-y-[10vh]">
      <div className="space-y-4"></div>
      {questions.map((q) => (
        <div key={q.id} data-question-id={q.id} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">{q.title}</h3>
          <RadioGroup className="space-y-4" value="">
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
                  className="flex-grow cursor-pointer text-gray-800"
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
        disabled
      >
        Submit Survey
      </Button>
    </div>
  );
};
