import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const MultiQuestionSurvey = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Multi-Question Survey
        </h1>
        <p className="text-lg text-gray-700">
          Answer multiple questions to complete the survey.
        </p>

        {/* Placeholder for questions - You can replace this */}
        <div className="bg-white shadow p-6 rounded-lg w-full">
          <p className="text-gray-800">[Question 1 Placeholder]</p>
        </div>
        <div className="bg-white shadow p-6 rounded-lg w-full">
          <p className="text-gray-800">[Question 2 Placeholder]</p>
        </div>

        <Button
          className="w-full py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black"
          onClick={() => navigate("/results")}
        >
          Submit Multi-Question Survey
        </Button>
      </div>
    </div>
  );
};

export default MultiQuestionSurvey;
