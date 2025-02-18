import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ANSWERS = [
  "Very Happy",
  "Somewhat Happy",
  "Neutral",
  "Somewhat Unhappy",
  "Very Unhappy",
];

// Color scheme for different phases
const PHASE_COLORS = {
  pre: "#808080",    // Grey
  during: "#007BFF", // Blue
  post: "#28a745",   // Green
};

const Results = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [replayStartTime, setReplayStartTime] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Determine the current phase based on timestamp
  const getPhaseAtTimestamp = (timestamp: number) => {
    if (timestamp < survey.firstInteractionTime) return "pre";
    if (timestamp < (survey.lastInteractionTime || survey.firstInteractionTime)) return "during";
    return "post";
  };

  // Calculate time & percentages for each phase
  const calculateMetrics = () => {
    if (!survey.startTime || !survey.firstInteractionTime || !survey.submitTime) return null;

    const preInteractionTime = survey.firstInteractionTime - survey.startTime;
    const duringInteractionTime =
      (survey.lastInteractionTime || survey.firstInteractionTime) - survey.firstInteractionTime;
    const postInteractionTime =
      survey.submitTime - (survey.lastInteractionTime || survey.firstInteractionTime);
    const totalTime = survey.submitTime - survey.startTime;

    return {
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

    // Draw path up to current frame
    if (currentFrame > 0) {
      let lastPos = positions[0];
      positions.slice(1, currentFrame).forEach((pos) => {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);

        // Get color based on timestamp
        const phase = getPhaseAtTimestamp(pos.timestamp);
        ctx.strokeStyle = PHASE_COLORS[phase];
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        lastPos = pos;
      });
    }
    
    // Get current position and timestamp
    const pos = currentFrame === 0
      ? (positions.length > 0 ? positions[0] : cursorPosition)
      : positions[currentFrame - 1];
    
    const currentTimestamp = currentFrame === 0
      ? survey.startTime
      : positions[currentFrame - 1].timestamp;
    
    // Get current phase color
    const currentPhase = getPhaseAtTimestamp(currentTimestamp);
    const currentColor = PHASE_COLORS[currentPhase];
    
    // Draw outer circle with current phase color
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}4D`; // ~30% opacity
    ctx.fill();
    
    // Draw inner circle with current phase color
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}B3`; // ~70% opacity
    ctx.fill();
  };

  // Set initial cursor position when component loads
  useEffect(() => {
    if (survey.mousePositions && survey.mousePositions.length > 0) {
      setCursorPosition(survey.mousePositions[0]);
    } else {
      setCursorPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
  }, [survey.mousePositions]);

  // Handle realistic replay with proper timing
  useEffect(() => {
    if (isAnimating) {
      if (currentFrame === 0) {
        setReplayStartTime(Date.now());
        drawMouseTrailAndCursor();
      }

      if (currentFrame < survey.mousePositions.length) {
        const currentPos = currentFrame === 0
          ? { timestamp: survey.startTime }
          : survey.mousePositions[currentFrame - 1];
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
  }, [isAnimating, currentFrame, survey.mousePositions, survey.startTime, replayStartTime]);

  // Initialize canvas
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
  }, []);

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen relative bg-secondary">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-40"
      />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in z-30">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">How are you feeling today?</h2>
          </div>

          <RadioGroup
            className="space-y-4"
            value={survey.selectedAnswer || ""}
          >
            {ANSWERS.map((answer) => (
              <div key={answer} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={answer}
                  id={answer}
                  className="
                    appearance-none w-5 h-5 border-2 border-black rounded-full bg-white
                    checked:bg-black checked:border-black
                    focus:outline-none focus:ring-0 focus:ring-offset-0
                    before:hidden after:hidden
                  "
                  disabled
                />
                <Label htmlFor={answer} className="flex-grow">{answer}</Label>
              </div>
            ))}
          </RadioGroup>

          <Button
            className="w-full py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
            disabled
          >
            Submit Survey
          </Button>
        </div>
      </div>

      <div
        className={`fixed top-4 right-4 w-96 transition-transform duration-300 transform ${
          showAnalysis ? "translate-x-0" : "translate-x-full"
        } z-50`}
      >
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              Results
            </div>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
            >
              {showAnalysis ? "→" : "←"}
            </button>
          </div>

          <div className="space-y-4">
            {metrics &&
              Object.entries(metrics).map(([phase, data]) => (
                <div key={phase} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: PHASE_COLORS[phase]
                      }}
                    />
                    <p className="text-sm font-medium text-gray-900 capitalize">{phase} Interaction</p>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-2xl font-bold text-gray-700">{data.percentage}%</p>
                    <p className="text-sm text-gray-600">{Number(data.time).toLocaleString()} ms</p>
                  </div>
                </div>
              ))}

            <Button
              variant="outline"
              className="w-full py-4 text-base font-medium"
              onClick={() => {
                setCurrentFrame(0);
                setIsAnimating(true);
              }}
              disabled={isAnimating}
            >
              {isAnimating ? "Replaying..." : "Replay Movement"}
            </Button>

            {/* 
              ADDING THE "New Survey" BUTTON HERE 
              which returns the user to the root route or any route you prefer
            */}
            <Button
              variant="outline"
              className="w-full py-4 text-base font-medium"
              onClick={() => navigate("/")} 
            >
              Restart Single Question Survey
            </Button>
          </div>
        </div>
      </div>

      {!showAnalysis && (
        <button
          onClick={() => setShowAnalysis(true)}
          className="fixed top-4 right-4 bg-white p-2 rounded-lg shadow-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 z-50"
        >
          ←
        </button>
      )}
    </div>
  );
};

export default Results;
