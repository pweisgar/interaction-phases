import * as React from "react";
import { createContext, useContext, useState } from "react";

/**
 * Expanded InteractionPhase to handle both single-question ("pre", "during", "post")
 * and multi-question phases ("pre1", "during1", "post1", "pre2", "during2", "post2").
 */
export type InteractionPhase =
  | "pre"
  | "during"
  | "post"
  | "pre1"
  | "during1"
  | "post1"
  | "pre2"
  | "during2"
  | "post2";

/**
 * MousePosition now includes an optional questionId for multi-question scenarios.
 */
export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
  phase: InteractionPhase;
  questionId?: number;
}

/**
 * SurveyContextType includes the original single-question fields plus
 * new fields for multi-question scenarios.
 */
export interface SurveyContextType {
  // Single-question fields
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

  // Multi-question fields (for question 1 and question 2)
  firstInteractionTimeQ1: number | null;
  setFirstInteractionTimeQ1: (time: number | null) => void;
  lastInteractionTimeQ1: number | null;
  setLastInteractionTimeQ1: (time: number | null) => void;

  firstInteractionTimeQ2: number | null;
  setFirstInteractionTimeQ2: (time: number | null) => void;
  lastInteractionTimeQ2: number | null;
  setLastInteractionTimeQ2: (time: number | null) => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const SurveyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Single-question fields
  const [startTime, setStartTime] = useState<number | null>(null);
  const [firstInteractionTime, setFirstInteractionTime] = useState<number | null>(null);
  const [lastInteractionTime, setLastInteractionTime] = useState<number | null>(null);
  const [submitTime, setSubmitTime] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [mousePositions, setMousePositions] = useState<MousePosition[]>([]);

  // Multi-question fields
  const [firstInteractionTimeQ1, setFirstInteractionTimeQ1] = useState<number | null>(null);
  const [lastInteractionTimeQ1, setLastInteractionTimeQ1] = useState<number | null>(null);
  const [firstInteractionTimeQ2, setFirstInteractionTimeQ2] = useState<number | null>(null);
  const [lastInteractionTimeQ2, setLastInteractionTimeQ2] = useState<number | null>(null);

  const addMousePosition = (position: MousePosition) => {
    setMousePositions(prev => [...prev, position]);
  };

  const resetSurvey = () => {
    // Reset single-question fields
    setStartTime(null);
    setFirstInteractionTime(null);
    setLastInteractionTime(null);
    setSubmitTime(null);
    setSelectedAnswer(null);
    setMousePositions([]);

    // Reset multi-question fields
    setFirstInteractionTimeQ1(null);
    setLastInteractionTimeQ1(null);
    setFirstInteractionTimeQ2(null);
    setLastInteractionTimeQ2(null);
  };

  const value: SurveyContextType = {
    // Single-question fields
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

    // Multi-question fields
    firstInteractionTimeQ1,
    setFirstInteractionTimeQ1,
    lastInteractionTimeQ1,
    setLastInteractionTimeQ1,
    firstInteractionTimeQ2,
    setFirstInteractionTimeQ2,
    lastInteractionTimeQ2,
    setLastInteractionTimeQ2,
  };

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
};

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurvey must be used within a SurveyProvider");
  }
  return context;
};
