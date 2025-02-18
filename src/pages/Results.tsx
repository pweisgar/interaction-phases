
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurvey } from '@/contexts/SurveyContext';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ANSWERS = [
  "Very Happy",
  "Somewhat Happy",
  "Neutral",
  "Somewhat Unhappy",
  "Very Unhappy"
];

const Results = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const calculateMetrics = () => {
    if (!survey.startTime || !survey.firstInteractionTime || !survey.submitTime) return null;

    const preInteractionTime = survey.firstInteractionTime - survey.startTime;
    const duringInteractionTime = (survey.lastInteractionTime || survey.firstInteractionTime) - survey.firstInteractionTime;
    const postInteractionTime = survey.submitTime - (survey.lastInteractionTime || survey.firstInteractionTime);
    const totalTime = survey.submitTime - survey.startTime;

    return {
      pre: {
        time: preInteractionTime,
        percentage: ((preInteractionTime / totalTime) * 100).toFixed(1),
      },
      during: {
        time: duringInteractionTime,
        percentage: ((duringInteractionTime / totalTime) * 100).toFixed(1),
      },
      post: {
        time: postInteractionTime,
        percentage: ((postInteractionTime / totalTime) * 100).toFixed(1),
      },
    };
  };

  const drawMouseTrail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const positions = survey.mousePositions;
    if (positions.length === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // New color scheme
    const colors = {
      pre: '#222222',    // Dark Gray
      during: '#007BFF', // Blue
      post: '#28A745',   // Green
    };    

    let lastPos = positions[0];
    let lastTimestamp = lastPos.timestamp;
    
    positions.slice(0, currentFrame).forEach((pos) => {
      // Calculate time gap
      const timeGap = pos.timestamp - lastTimestamp;
      
      // If there's a significant pause (>1000ms), draw a pulsing dot
      if (timeGap > 1000) {
        ctx.beginPath();
        ctx.arc(lastPos.x, lastPos.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = colors[pos.phase];
        ctx.fill();
        
        // Draw time indicator
        ctx.fillStyle = '#555555';
        ctx.font = '12px Arial';
        ctx.fillText(`${(timeGap / 1000).toFixed(1)}s`, lastPos.x + 10, lastPos.y);
      }

      // Draw movement line
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = colors[pos.phase];
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      lastPos = pos;
      lastTimestamp = pos.timestamp;
    });
  };

  useEffect(() => {
    if (!survey.startTime) {
      navigate('/');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawMouseTrail();
    };

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (isAnimating && currentFrame < survey.mousePositions.length) {
      const timer = setTimeout(() => {
        setCurrentFrame(prev => prev + 1);
      }, 10);
      drawMouseTrail();
      return () => clearTimeout(timer);
    } else if (isAnimating && currentFrame >= survey.mousePositions.length) {
      setIsAnimating(false);
    }
  }, [isAnimating, currentFrame]);

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen relative bg-secondary">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      {/* Survey Page Replica */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              How are you feeling today?
            </h2>
          </div>

          <RadioGroup
            className="space-y-4"
            value={survey.selectedAnswer || ""}
          >
            {ANSWERS.map((answer) => (
              <div
                key={answer}
                className={`flex items-center space-x-3 rounded-lg border p-4 ${
                  survey.selectedAnswer === answer ? 'bg-gray-100 border-gray-400' : ''
                }`}
              >
                <RadioGroupItem value={answer} id={answer} disabled />
                <Label htmlFor={answer} className="flex-grow">{answer}</Label>
              </div>
            ))}
          </RadioGroup>

          <Button
            className="w-full py-6 text-lg font-medium transition-all duration-200 transform bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
            disabled={true}
          >
            Submit Survey
          </Button>
        </div>
      </div>

      {/* Floating Analysis Panel */}
      <div className={`fixed top-4 right-4 w-96 transition-transform duration-300 transform ${
        showAnalysis ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              Results
            </div>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
            >
              {showAnalysis ? '→' : '←'}
            </button>
          </div>

          <div className="space-y-4">
            {metrics && Object.entries(metrics).map(([phase, data]) => (
              <div key={phase} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ 
                      backgroundColor: phase === 'pre' ? '#222222' : 
                                     phase === 'during' ? '#888888' : '#AAADB0' 
                    }} 
                  />
                  <h3 className="text-sm font-medium text-gray-900 capitalize">
                    {phase} Interaction
                  </h3>
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
              onClick={() => navigate('/')}
            >
              New Survey
            </Button>
          </div>
        </div>
      </div>

      {/* Toggle Analysis Button (visible when panel is hidden) */}
      {!showAnalysis && (
        <button
          onClick={() => setShowAnalysis(true)}
          className="fixed top-4 right-4 bg-white p-2 rounded-lg shadow-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          ←
        </button>
      )}
    </div>
  );
};

export default Results;
