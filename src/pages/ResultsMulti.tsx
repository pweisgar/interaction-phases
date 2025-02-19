import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const QUESTIONS = [
  { id: 1, text: "How satisfied are you with your current work-life balance?" },
  { id: 2, text: "How often do you feel stressed during your daily routine?" }
];

const PHASE_COLORS = {
  pre: "#808080",    // Grey
  during: "#007BFF", // Blue
  post: "#28a745",   // Green
};

const ResultsMulti = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [replayStartTime, setReplayStartTime] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Determine the phase for each question separately
  const getPhaseAtTimestamp = (questionId: number, timestamp: number) => {
    if (timestamp < survey.firstInteractionTime[questionId]) return "pre";
    if (timestamp < (survey.lastInteractionTime[questionId] || survey.firstInteractionTime[questionId])) return "during";
    return "post";
  };

  // Calculate metrics for each question separately
  const calculateMetrics = () => {
    if (!survey.startTime || !survey.firstInteractionTime || !survey.submitTime) return null;

    return QUESTIONS.map((question) => {
      const preInteractionTime = survey.firstInteractionTime[question.id] - survey.startTime;
      const duringInteractionTime =
        (survey.lastInteractionTime[question.id] || survey.firstInteractionTime[question.id]) - survey.firstInteractionTime[question.id];
      const postInteractionTime =
        survey.submitTime - (survey.lastInteractionTime[question.id] || survey.firstInteractionTime[question.id]);
      const totalTime = survey.submitTime - survey.startTime;

      return {
        id: question.id,
        text: question.text,
        pre: {
          time: preInteractionTime,
          percentage: ((preInteractionTime / totalTime) * 100).toFixed(0),
        },
        during: {
          time: duringInteractionTime,
          percentage: ((duringInteractionTime / totalTime) * 100).toFixed(0),
        },
        post: {
          time: postInteractionTime,
          percentage: ((postInteractionTime / totalTime) * 100).toFixed(0),
        },
      };
    });
  };

  // Draw the mouse trail and cursor
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

        // Identify which question the user was interacting with
        const currentQuestion = pos.questionId || 1;
        const phase = getPhaseAtTimestamp(currentQuestion, pos.timestamp);

        ctx.strokeStyle = PHASE_COLORS[phase];
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        lastPos = pos;
      });
    }
    
    const pos = currentFrame === 0
      ? (positions.length > 0 ? positions[0] : cursorPosition)
      : positions[currentFrame - 1];

    const currentTimestamp = currentFrame === 0
      ? survey.startTime
      : positions[currentFrame - 1].timestamp;

    // Get phase color for the question being answered
    const currentQuestion = pos.questionId || 1;
    const currentPhase = getPhaseAtTimestamp(currentQuestion, currentTimestamp);
    const currentColor = PHASE_COLORS[currentPhase];

    // Draw cursor effect
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}4D`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}B3`;
    ctx.fill();
  };

  useEffect(() => {
    if (survey.mousePositions && survey.mousePositions.length > 0) {
      setCursorPosition(survey.mousePositions[0]);
    } else {
      setCursorPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, [survey.mousePositions]);

  useEffect(() => {
    if (isAnimating) {
      if (currentFrame === 0) {
        setReplayStartTime(Date.now());
        drawMouseTrailAndCursor();
      }

      if (currentFrame < survey.mousePositions.length) {
        const nextPos = survey.mousePositions[currentFrame];

        const elapsedSinceReplayStart = Date.now() - replayStartTime;
        const whenToShowNextFrame = nextPos.timestamp - survey.startTime;
        const timeToWait = Math.max(0, whenToShowNextFrame - elapsedSinceReplayStart);

        const timer = setTimeout(() => {
          setCurrentFrame((prev) => prev + 1);
          drawMouseTrailAndCursor();
        }, timeToWait);

        return () => clearTimeout(timer);
      } else {
        setIsAnimating(false);
      }
    }
  }, [isAnimating, currentFrame]);

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen relative bg-secondary">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-40" />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in z-30">
        <div className="max-w-2xl w-full space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Multi-Question Survey Results</h2>

          {QUESTIONS.map((question) => (
            <div key={question.id} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">{question.text}</h3>

              <div className="space-y-4">
                {metrics &&
                  Object.entries(metrics.find((m) => m.id === question.id) || {}).map(
                    ([phase, data]) =>
                      phase !== "id" &&
                      phase !== "text" && (
                        <div key={phase} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                            <p className="text-sm font-medium text-gray-900 capitalize">{phase} Interaction</p>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <p className="text-2xl font-bold text-gray-700">{data.percentage}%</p>
                            <p className="text-sm text-gray-600">{Number(data.time).toLocaleString()} ms</p>
                          </div>
                        </div>
                      )
                  )}
              </div>
            </div>
          ))}

          <Button className="w-full py-4 text-base font-medium" onClick={() => setIsAnimating(true)} disabled={isAnimating}>
            {isAnimating ? "Replaying..." : "Replay Movement"}
          </Button>

          <Button className="w-full py-4 text-base font-medium" onClick={() => navigate("/")}>
            Restart Multi-Question Survey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsMulti;
