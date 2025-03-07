
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <Button 
          className="inline-flex items-center justify-center px-8 py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 animate-slide-up bg-gray-300 hover:bg-gray-400 text-black"
          onClick={() => navigate('/survey')}
        >
          Start Single Question Survey
        </Button>
      </div>
    </div>
  );
};

export default Landing;
