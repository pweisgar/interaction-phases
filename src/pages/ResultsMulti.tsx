
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey, MousePosition } from "@/contexts/SurveyContext";
import { MetricsPanel } from "@/components/MetricsPanel";
import { SurveyDisplay } from "@/components/SurveyDisplay";

// Survey questions configuration
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

// Color configuration for different interaction phases
const PHASE_COLORS = {
  pre: "#808080",    // Grey
  during: "#007BFF", // Blue
  post: "#28a745",   // Green
  pre1: "#808080",
  during1: "#007BFF",
  post1: "#28a745",
  pre2: "#808080",
  during2: "#007BFF",
  post2: "#28a745"
};

// Helper function to get base phase from specific phase
const basePhase = (phase: string): "pre" | "during" | "post" => {
  if (phase.startsWith("pre")) return "pre";
  if (phase.startsWith("during")) return "during";
  return "post";
};

// Helper function to determine phase based on timestamp and question
const getPhaseForTimestamp = (timestamp: number, questionId: number, survey: any) => {
  if (questionId === 1) {
    if (timestamp < survey.firstInteractionTimeQ1!) return "pre1";
    if (timestamp <= survey.lastInteractionTimeQ1!) return "during1";
    const transitionToQ2Time = survey.mousePositions.find(pos => pos.questionId === 2)?.timestamp;
    if (transitionToQ2Time && timestamp <= transitionToQ2Time) return "post1";
    return "pre2";
  } else {
    const transitionToQ2Time = survey.mousePositions.find(pos => pos.questionId === 2)?.timestamp;
    if (!transitionToQ2Time) return "pre2";
    if (timestamp < survey.firstInteractionTimeQ2!) return "pre2";
    if (timestamp <= survey.lastInteractionTimeQ2!) return "during2";
    return "post2";
  }
};

const ResultsMulti = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [replayStartTime, setReplayStartTime] = useState(0);
  const [showAnalysisQ1, setShowAnalysisQ1] = useState(true);
  const [showAnalysisQ2, setShowAnalysisQ2] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log("ResultsMulti - Survey Context Values:", {
      startTime: survey.startTime,
      submitTime: survey.submitTime,
      firstInteractionTimeQ1: survey.firstInteractionTimeQ1,
      lastInteractionTimeQ1: survey.lastInteractionTimeQ1,
      firstInteractionTimeQ2: survey.firstInteractionTimeQ2,
      lastInteractionTimeQ2: survey.lastInteractionTimeQ2,
      mousePositions: survey.mousePositions,
    });
  }, [survey]);

  // Calculate metrics for a specific question
  const calculateMetricsForQuestion = (qId: number) => {
    if (!survey.startTime || !survey.submitTime) return null;
    
    const positions = survey.mousePositions.filter(pos => pos.questionId === qId);
    if (!positions.length) return null;

    let preTime = 0;
    let duringTime = 0;
    let postTime = 0;

    if (qId === 1) {
      const firstInteraction = survey.firstInteractionTimeQ1;
      const lastInteraction = survey.lastInteractionTimeQ1;
      const transitionToQ2Time = survey.mousePositions.find(pos => pos.questionId === 2)?.timestamp;

      if (firstInteraction) {
        preTime = Math.max(0, firstInteraction - survey.startTime);
        if (lastInteraction && lastInteraction > firstInteraction) {
          duringTime = Math.max(0, lastInteraction - firstInteraction);
        }
        if (transitionToQ2Time && lastInteraction) {
          postTime = Math.max(0, transitionToQ2Time - lastInteraction);
        }
      }
    } else {
      const transitionToQ2Time = survey.mousePositions.find(pos => pos.questionId === 2)?.timestamp || survey.startTime;
      const firstInteraction = survey.firstInteractionTimeQ2;
      const lastInteraction = survey.lastInteractionTimeQ2;

      if (firstInteraction) {
        preTime = Math.max(0, firstInteraction - transitionToQ2Time);
        if (lastInteraction && lastInteraction > firstInteraction) {
          duringTime = Math.max(0, lastInteraction - firstInteraction);
        }
        if (lastInteraction) {
          postTime = Math.max(0, survey.submitTime - lastInteraction);
        }
      }
    }

    preTime = Math.max(0, preTime);
    duringTime = Math.max(0, duringTime);
    postTime = Math.max(0, postTime);

    const total = preTime + duringTime + postTime;
    if (total === 0) return null;

    return {
      pre: {
        time: preTime,
        percentage: ((preTime / total) * 100).toFixed(1)
      },
      during: {
        time: duringTime,
        percentage: ((duringTime / total) * 100).toFixed(1)
      },
      post: {
        time: postTime,
        percentage: ((postTime / total) * 100).toFixed(1)
      }
    };
  };

  // Animation effects
  useEffect(() => {
    if (isAnimating) {
      if (currentFrame === 0) {
        setReplayStartTime(Date.now());
        drawMouseTrailAndCursor();
      }
      if (currentFrame < survey.mousePositions.length) {
        const nextPos = survey.mousePositions[currentFrame];
        const elapsed = Date.now() - replayStartTime;
        const delay = Math.max(0, nextPos.timestamp - survey.startTime! - elapsed);
        const timer = setTimeout(() => {
          setCurrentFrame(prev => prev + 1);
          drawMouseTrailAndCursor();
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setIsAnimating(false);
      }
    }
  }, [isAnimating, currentFrame, survey.mousePositions, survey.startTime, replayStartTime]);

  // Canvas initialization
  useEffect(() => {
    if (!survey.startTime) {
      navigate("/");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawMouseTrailAndCursor();
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate, survey.startTime]);

  // Draw mouse trail and cursor
  const drawMouseTrailAndCursor = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const positions = survey.mousePositions;
    if (!positions.length) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentFrame > 0) {
      let lastPos = positions[0];
      positions.slice(1, currentFrame).forEach((pos) => {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        const phase = basePhase(getPhaseForTimestamp(pos.timestamp, pos.questionId!, survey));
        ctx.strokeStyle = PHASE_COLORS[phase];
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        lastPos = pos;
      });
    }

    // Draw cursor
    const currentPos = currentFrame === 0 
      ? positions[0] 
      : positions[currentFrame - 1];
    
    const currentPhase = basePhase(getPhaseForTimestamp(
      currentPos.timestamp,
      currentPos.questionId!,
      survey
    ));
    const currentColor = PHASE_COLORS[currentPhase];

    // Draw cursor circles
    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}4D`; // 30% opacity
    ctx.fill();

    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}B3`; // 70% opacity
    ctx.fill();
  };

  const handleReplay = () => {
    setCurrentFrame(0);
    setIsAnimating(true);
  };

  const metricsQ1 = calculateMetricsForQuestion(1);
  const metricsQ2 = calculateMetricsForQuestion(2);

  return (
    <div className="min-h-screen relative bg-secondary">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-40" />

      <div className="relative min-h-screen flex flex-col items-center p-8 bg-secondary animate-fade-in z-30">
        <SurveyDisplay questions={QUESTIONS} />

        <div className="fixed right-4 top-4 space-y-4">
          {showAnalysisQ1 && (
            <MetricsPanel
              questionNumber={1}
              metrics={metricsQ1}
              onHide={() => setShowAnalysisQ1(false)}
            />
          )}
          {showAnalysisQ2 && (
            <MetricsPanel
              questionNumber={2}
              metrics={metricsQ2}
              onHide={() => setShowAnalysisQ2(false)}
              showReplayControls={true}
              isAnimating={isAnimating}
              onReplay={handleReplay}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsMulti;
