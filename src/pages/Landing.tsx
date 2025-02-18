
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-2">
          <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium animate-slide-up">
            Welcome
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-gray-900 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Share Your Thoughts
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            We value your feedback. This short survey will help us understand your experience better.
          </p>
        </div>
        <Button 
          className="inline-flex items-center justify-center px-8 py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 animate-slide-up bg-primary hover:bg-primary-hover text-white"
          style={{ animationDelay: "0.3s" }}
          onClick={() => navigate('/survey')}
        >
          Start Survey
        </Button>
      </div>
    </div>
  );
};

export default Landing;
