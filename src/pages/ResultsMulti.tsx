
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MetricsPanel } from "@/components/results-multi/MetricsPanel";
import { PHASE_COLORS, QUESTIONS } from "@/lib/constants";

const ResultsMulti = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!survey.startTime) {
      console.log("No survey data, redirecting to home");
      navigate("/");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!isAnimating) {
        drawMouseTrail();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const drawMouseTrail = () => {
    const canvas = canvasRef.current;
    if (!canvas || !survey.mousePositions.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 1; i < currentFrame && i < survey.mousePositions.length; i++) {
      const prevPos = survey.mousePositions[i - 1];
      const pos = survey.mousePositions[i];

      // Draw line
      ctx.beginPath();
      ctx.moveTo(prevPos.x, prevPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = PHASE_COLORS[pos.phase];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw pause indicators
      const timeDiff = pos.timestamp - prevPos.timestamp;
      if (timeDiff > 500) {
        ctx.beginPath();
        ctx.arc(prevPos.x, prevPos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = PHASE_COLORS[prevPos.phase];
        ctx.fill();

        // Add pause duration text
        ctx.fillStyle = "#666";
        ctx.font = "12px Arial";
        ctx.fillText(`${(timeDiff / 1000).toFixed(1)}s`, prevPos.x + 10, prevPos.y);
      }
    }

    // Draw current position
    if (currentFrame > 0 && currentFrame <= survey.mousePositions.length) {
      const currentPos = survey.mousePositions[currentFrame - 1];
      ctx.beginPath();
      ctx.arc(currentPos.x, currentPos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = `${PHASE_COLORS[currentPos.phase]}88`;
      ctx.fill();
    }
  };

  const calculateMetricsForQuestion = (questionId: number) => {
    if (!survey.mousePositions.length || !survey.startTime || !survey.submitTime) {
      console.log("Missing data for metrics calculation");
      return null;
    }

    const questionPositions = survey.mousePositions.filter(pos => pos.questionId === questionId);
    
    if (!questionPositions.length) {
      console.log(`No positions found for question ${questionId}`);
      return null;
    }

    const phases = {
      pre: questionPositions.filter(pos => pos.phase === `pre${questionId}`),
      during: questionPositions.filter(pos => pos.phase === `during${questionId}`),
      post: questionPositions.filter(pos => pos.phase === `post${questionId}`)
    };

    const getPhaseTime = (positions: typeof questionPositions) => {
      if (positions.length === 0) return 0;
      return positions[positions.length - 1].timestamp - positions[0].timestamp;
    };

    const preTime = getPhaseTime(phases.pre);
    const duringTime = getPhaseTime(phases.during);
    const postTime = getPhaseTime(phases.post);
    const totalTime = preTime + duringTime + postTime || 1; // Prevent division by zero

    return {
      pre: {
        time: preTime,
        percentage: ((preTime / totalTime) * 100).toFixed(1),
      },
      during: {
        time: duringTime,
        percentage: ((duringTime / totalTime) * 100).toFixed(1),
      },
      post: {
        time: postTime,
        percentage: ((postTime / totalTime) * 100).toFixed(1),
      },
    };
  };

  useEffect(() => {
    if (isAnimating) {
      if (currentFrame >= survey.mousePositions.length) {
        setIsAnimating(false);
        setCurrentFrame(survey.mousePositions.length);
      } else {
        drawMouseTrail();
        animationRef.current = requestAnimationFrame(() => {
          setCurrentFrame(prev => prev + 1);
        });
      }
    } else {
      drawMouseTrail();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentFrame, isAnimating]);

  const handleReplay = () => {
    setCurrentFrame(0);
    setIsAnimating(true);
  };

  console.log("Mouse positions:", survey.mousePositions);
  console.log("Current frame:", currentFrame);

  return (
    <div className="min-h-screen relative bg-secondary">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-40"
      />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in z-30">
        <div className="max-w-2xl w-full space-y-8">
          {QUESTIONS.map((question) => (
            <div key={question.id} data-question-id={question.id} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">{question.title}</h3>
              <RadioGroup
                className="space-y-4"
                value=""
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

              <MetricsPanel
                questionId={question.id}
                metrics={calculateMetricsForQuestion(question.id)}
                showAnalysis={showAnalysis}
                setShowAnalysis={setShowAnalysis}
                isAnimating={isAnimating}
                onReplayClick={handleReplay}
                navigate={navigate}
              />
            </div>
          ))}

          <Button
            className="w-full py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
            disabled={true}
          >
            Submit Survey
          </Button>
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

export default ResultsMulti;
