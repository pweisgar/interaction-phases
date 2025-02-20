import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey, MousePosition } from "@/contexts/SurveyContext";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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

const PHASE_COLORS = {
  pre: "#808080",    // Grey
  during: "#007BFF", // Blue
  post: "#28a745",   // Green
};

const basePhase = (phase: string): "pre" | "during" | "post" => {
  if (phase.startsWith("pre")) return "pre";
  if (phase.startsWith("during")) return "during";
  return "post";
};

const ResultsMulti = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [replayStartTime, setReplayStartTime] = useState(0);
  const [cursorPosition, setCursorPosition] = useState<MousePosition>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    timestamp: Date.now(),
    phase: "pre",
  });

  const [showAnalysisQ1, setShowAnalysisQ1] = useState(true);
  const [showAnalysisQ2, setShowAnalysisQ2] = useState(true);

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

  const getPhaseAtTimestamp = (timestamp: number) => {
    if (timestamp < survey.firstInteractionTime!) return "pre";
    if (timestamp < (survey.lastInteractionTime || survey.firstInteractionTime)!) return "during";
    return "post";
  };

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
        const phase = basePhase(pos.phase);
        ctx.strokeStyle = PHASE_COLORS[phase];
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        lastPos = pos;
      });
    }
    
    const pos = currentFrame === 0
      ? (survey.mousePositions.length > 0 ? survey.mousePositions[0] : cursorPosition)
      : survey.mousePositions[currentFrame - 1];
    const currentTimestamp = currentFrame === 0 ? survey.startTime! : pos.timestamp;
    const phase = basePhase(getPhaseAtTimestamp(currentTimestamp));
    const currentColor = PHASE_COLORS[phase];
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}4D`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = `${currentColor}B3`;
    ctx.fill();
  };

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
        percentage: ((preTime / total) * 100).toFixed(0)
      },
      during: {
        time: duringTime,
        percentage: ((duringTime / total) * 100).toFixed(0)
      },
      post: {
        time: postTime,
        percentage: ((postTime / total) * 100).toFixed(0)
      }
    };
  };

  const metricsQ1 = calculateMetricsForQuestion(1);
  const metricsQ2 = calculateMetricsForQuestion(2);

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

  useEffect(() => {
    if (survey.mousePositions?.length > 0) {
      setCursorPosition(survey.mousePositions[0]);
    } else {
      setCursorPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        timestamp: Date.now(),
        phase: "pre",
      });
    }
  }, [survey.mousePositions]);

  const handleReplay = () => {
    setCurrentFrame(0);
    setIsAnimating(true);
  };

  return (
    <div className="min-h-screen relative bg-secondary">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-40" />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-8 bg-secondary animate-fade-in z-30">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4"></div>
          {QUESTIONS.map((q) => (
            <div key={q.id} data-question-id={q.id} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">{q.title}</h3>
              <RadioGroup className="space-y-4" value="">
                {q.answers.map((answer) => (
                  <div key={answer} className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={answer}
                      id={`q${q.id}-${answer}`}
                      className="
                        appearance-none w-5 h-5 border-2 border-black rounded-full bg-white
                        checked:bg-black checked:border-black
                        focus:outline-none focus:ring-0 focus:ring-offset-0
                        before:hidden after:hidden
                      "
                    />
                    <Label
                      htmlFor={`q${q.id}-${answer}`}
                      className="flex-grow cursor-pointer text-gray-800"
                    >
                      {answer}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          <Button
            className="w-full py-6 text-lg font-medium transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
            disabled
          >
            Submit Survey
          </Button>
        </div>
      </div>

      <div className="fixed top-20 right-40 space-y-4 z-50">
        {showAnalysisQ1 && metricsQ1 ? (
          <div className="w-96 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                Results – Q1
              </div>
              <button
                onClick={() => setShowAnalysisQ1(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                →
              </button>
            </div>
            <div className="space-y-3">
              {["pre", "during", "post"].map((phase) => {
                const data = metricsQ1[phase];
                return (
                  <div key={phase} className="bg-gray-50 rounded-lg p-0.25">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                      <p className="text-xs font-medium text-gray-900 capitalize">
                        {phase} Interaction
                      </p>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <p className="text-2xl font-bold text-gray-700">
                        {data.percentage}%
                      </p>
                      <p className="text-sm text-gray-600">
                        {Number(data.time).toLocaleString()} ms
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {showAnalysisQ2 && metricsQ2 ? (
          <div className="w-96 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                Results – Q2
              </div>
              <button
                onClick={() => setShowAnalysisQ2(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                →
              </button>
            </div>
            <div className="space-y-3">
              {["pre", "during", "post"].map((phase) => {
                const data = metricsQ2[phase];
                return (
                  <div key={phase} className="bg-gray-50 rounded-lg p-0.25">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                      <p className="text-xs font-medium text-gray-900 capitalize">
                        {phase} Interaction
                      </p>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <p className="text-2xl font-bold text-gray-700">
                        {data.percentage}%
                      </p>
                      <p className="text-sm text-gray-600">
                        {Number(data.time).toLocaleString()} ms
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 mt-2">
              <Button
                variant="outline"
                className="w-full py-4 text-sm transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
                onClick={handleReplay}
                disabled={isAnimating}
              >
                {isAnimating ? "Replaying..." : "Replay Movement"}
              </Button>
              <Button
                variant="outline"
                className="w-full py-4 text-sm transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
                onClick={() => navigate("/StartMulti")}
              >
                Restart Multi-Question Survey
              </Button>
              <Button
                variant="outline"
                className="w-full py-4 text-sm transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
                onClick={() => navigate("/")}
              >
                Restart Single Question Survey
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {(!showAnalysisQ1 || !showAnalysisQ2) && (
        <button
          onClick={() => {
            setShowAnalysisQ1(true);
            setShowAnalysisQ2(true);
          }}
          className="fixed top-4 right-4 bg-white p-2 rounded-lg shadow-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 z-50"
        >
          ←
        </button>
      )}
    </div>
  );
};

export default ResultsMulti;
