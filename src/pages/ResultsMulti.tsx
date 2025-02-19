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

  const calculateMetricsForQuestion = (questionId: number) => {
    if (!survey.startTime || !survey.firstInteractionTime || !survey.submitTime) {
      console.log("Missing required timestamps");
      return null;
    }

    const questionPositions = survey.mousePositions.filter(pos => {
      const elem = document.elementFromPoint(pos.x, pos.y);
      if (!elem) return false;
      return elem.closest(`[data-question-id="${questionId}"]`) !== null;
    });

    if (questionPositions.length === 0) {
      console.log(`No positions found for question ${questionId}`);
      return null;
    }

    const firstInteraction = questionPositions.find(pos => pos.phase === "during");
    const lastInteraction = [...questionPositions].reverse().find(pos => pos.phase === "during");

    const preTime = firstInteraction ? firstInteraction.timestamp - survey.startTime : 0;
    const duringTime = lastInteraction && firstInteraction ? 
      lastInteraction.timestamp - firstInteraction.timestamp : 0;
    const postTime = survey.submitTime - (lastInteraction?.timestamp || survey.startTime);
    const totalTime = preTime + duringTime + postTime;

    console.log(`Metrics for Q${questionId}:`, { preTime, duringTime, postTime, totalTime });

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

  const drawMouseTrail = () => {
    const canvas = canvasRef.current;
    if (!canvas || !survey.mousePositions.length) {
      console.log("No canvas or positions to draw");
      return;
    }

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

  const handleReplay = () => {
    setCurrentFrame(0);
    setIsAnimating(true);
  };

  useEffect(() => {
    if (!survey.startTime) {
      console.log("No survey data, redirecting to home");
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

  useEffect(() => {
    if (isAnimating && currentFrame < survey.mousePositions.length) {
      const timer = setTimeout(() => {
        setCurrentFrame(prev => prev + 1);
        drawMouseTrail();
      }, 10);
      return () => clearTimeout(timer);
    } else if (isAnimating && currentFrame >= survey.mousePositions.length) {
      setIsAnimating(false);
    }
  }, [isAnimating, currentFrame]);

  console.log("Survey data:", survey);
  console.log("Current frame:", currentFrame);
  console.log("Mouse positions:", survey.mousePositions);

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
