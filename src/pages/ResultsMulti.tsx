
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Two questions, each with five answers (matching MultiQuestionSurvey)
const QUESTIONS = [
  {
    id: 1,
    title: "Question 1: How satisfied are you with your work-life balance?",
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
    title: "Question 2: How often do you feel stressed during daily routines?",
    answers: [
      "Never",
      "Rarely",
      "Sometimes",
      "Often",
      "Always",
    ],
  },
];

// Colors for different phases
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
  const [selectedAnswers] = useState<{ [qId: number]: string }>({}); // For display only

  // Calculate metrics for each question
  const calculateMetricsForQuestion = (questionId: number) => {
    if (!survey.startTime || !survey.firstInteractionTime || !survey.submitTime) return null;

    // Get positions relevant to this question
    const questionPositions = survey.mousePositions.filter(pos => {
      const elem = document.elementFromPoint(pos.x, pos.y);
      if (!elem) return false;
      return elem.closest(`[data-question-id="${questionId}"]`) !== null;
    });

    if (questionPositions.length === 0) return null;

    const firstInteraction = questionPositions.find(pos => pos.phase === "during");
    const lastInteraction = [...questionPositions].reverse().find(pos => pos.phase === "during");

    const preTime = firstInteraction ? firstInteraction.timestamp - survey.startTime : 0;
    const duringTime = lastInteraction && firstInteraction ? 
      lastInteraction.timestamp - firstInteraction.timestamp : 0;
    const postTime = survey.submitTime - (lastInteraction?.timestamp || survey.startTime);
    const totalTime = preTime + duringTime + postTime;

    return {
      pre: {
        time: preTime,
        percentage: ((preTime / totalTime) * 100).toFixed(0),
      },
      during: {
        time: duringTime,
        percentage: ((duringTime / totalTime) * 100).toFixed(0),
      },
      post: {
        time: postTime,
        percentage: ((postTime / totalTime) * 100).toFixed(0),
      },
    };
  };

  const drawMouseTrail = () => {
    const canvas = canvasRef.current;
    if (!canvas || !survey.mousePositions.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let lastPos = survey.mousePositions[0];
    survey.mousePositions.slice(1, currentFrame).forEach((pos) => {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = PHASE_COLORS[pos.phase];
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Draw dots for pauses
      const timeDiff = pos.timestamp - lastPos.timestamp;
      if (timeDiff > 1000) {
        ctx.beginPath();
        ctx.arc(lastPos.x, lastPos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = PHASE_COLORS[lastPos.phase];
        ctx.fill();
        
        // Add time label
        ctx.fillStyle = "#555";
        ctx.font = "12px Arial";
        ctx.fillText(`${(timeDiff / 1000).toFixed(1)}s`, lastPos.x + 8, lastPos.y);
      }

      lastPos = pos;
    });

    // Draw current cursor position
    if (currentFrame > 0) {
      const pos = survey.mousePositions[currentFrame - 1];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `${PHASE_COLORS[pos.phase]}88`;
      ctx.fill();
    }
  };

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
      drawMouseTrail();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation effect
  useEffect(() => {
    if (isAnimating) {
      if (currentFrame === 0) {
        setReplayStartTime(Date.now());
      }
      
      if (currentFrame < survey.mousePositions.length) {
        const timer = setTimeout(() => {
          setCurrentFrame(prev => prev + 1);
          drawMouseTrail();
        }, 10);
        return () => clearTimeout(timer);
      } else {
        setIsAnimating(false);
      }
    }
  }, [isAnimating, currentFrame]);

  return (
    <div className="min-h-screen relative bg-secondary">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-40"
      />

      {/* Survey Page Replica */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in z-30">
        <div className="max-w-2xl w-full space-y-8">
          {QUESTIONS.map((question) => (
            <div key={question.id} data-question-id={question.id} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">{question.title}</h3>
              <RadioGroup
                className="space-y-4"
                value={selectedAnswers[question.id] || ""}
              >
                {question.answers.map((answer) => (
                  <div key={answer} className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={answer}
                      id={`q${question.id}-${answer}`}
                      className="
                        appearance-none w-5 h-5 border-2 border-black rounded-full bg-white
                        checked:bg-black checked:border-black
                        focus:outline-none focus:ring-0 focus:ring-offset-0
                        before:hidden after:hidden
                      "
                      disabled
                    />
                    <Label
                      htmlFor={`q${question.id}-${answer}`}
                      className="flex-grow cursor-not-allowed"
                    >
                      {answer}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Metrics Panel for each question */}
              <div className={`fixed ${question.id === 1 ? 'top-4' : 'top-64'} right-4 w-96 transition-transform duration-300 transform ${
                showAnalysis ? 'translate-x-0' : 'translate-x-full'
              }`}>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      Results - Q{question.id}
                    </div>
                    {question.id === 1 && (
                      <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                      >
                        {showAnalysis ? '→' : '←'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {Object.entries(calculateMetricsForQuestion(question.id) || {}).map(([phase, data]) => (
                      <div key={phase} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PHASE_COLORS[phase] }}
                          />
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {phase} Interaction
                          </p>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <p className="text-2xl font-bold text-gray-700">
                            {data.percentage}%
                          </p>
                          <p className="text-sm text-gray-600">
                            {(data.time / 1000).toFixed(2)}s
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            className="w-full py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
            disabled={true}
          >
            Submit Survey
          </Button>

          <div className="space-y-4 mt-8">
            <Button
              className="w-full py-4 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white"
              onClick={() => {
                setCurrentFrame(0);
                setIsAnimating(true);
              }}
              disabled={isAnimating}
            >
              {isAnimating ? "Replaying..." : "Replay Movement"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full py-4 text-base font-medium"
              onClick={() => navigate("/")}
            >
              Return to Single Survey
            </Button>

            <Button
              variant="outline"
              className="w-full py-4 text-base font-medium"
              onClick={() => navigate("/startMulti")}
            >
              Return to Multi Survey
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle Analysis Button when hidden */}
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

export default ResultsMulti;
