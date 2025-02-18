
import React, { createContext, useContext, useState, useEffect } from 'react';

type InteractionPhase = 'pre' | 'during' | 'post';

interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
  phase: InteractionPhase;
}

interface SurveyContextType {
  startTime: number | null;
  firstInteractionTime: number | null;
  lastInteractionTime: number | null;
  submitTime: number | null;
  selectedAnswer: string | null;
  mousePositions: MousePosition[];
  setStartTime: (time: number) => void;
  setFirstInteractionTime: (time: number) => void;
  setLastInteractionTime: (time: number) => void;
  setSubmitTime: (time: number) => void;
  setSelectedAnswer: (answer: string) => void;
  addMousePosition: (position: MousePosition) => void;
  resetSurvey: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const SurveyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [firstInteractionTime, setFirstInteractionTime] = useState<number | null>(null);
  const [lastInteractionTime, setLastInteractionTime] = useState<number | null>(null);
  const [submitTime, setSubmitTime] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [mousePositions, setMousePositions] = useState<MousePosition[]>([]);

  const addMousePosition = (position: MousePosition) => {
    setMousePositions(prev => [...prev, position]);
  };

  const resetSurvey = () => {
    setStartTime(null);
    setFirstInteractionTime(null);
    setLastInteractionTime(null);
    setSubmitTime(null);
    setSelectedAnswer(null);
    setMousePositions([]);
  };

  const value = {
    startTime,
    firstInteractionTime,
    lastInteractionTime,
    submitTime,
    selectedAnswer,
    mousePositions,
    setStartTime,
    setFirstInteractionTime,
    setLastInteractionTime,
    setSubmitTime,
    setSelectedAnswer,
    addMousePosition,
    resetSurvey,
  };

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
};

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error('useSurvey must be used within a SurveyProvider');
  }
  return context;
};
