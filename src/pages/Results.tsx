
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurvey } from '@/contexts/SurveyContext';
import { Button } from "@/components/ui/button";

const Results = () => {
  const navigate = useNavigate();
  const survey = useSurvey();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

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
    
    const colors = {
      pre: '#84A98C',
      during: '#E28F83',
      post: '#6B8E74',
    };

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let lastPos = positions[0];
    positions.slice(0, currentFrame).forEach((pos) => {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = colors[pos.phase];
      ctx.stroke();
      lastPos = pos;
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
    }
  }, [isAnimating, currentFrame]);

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen relative bg-secondary animate-fade-in">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
      
      <div className="relative z-10 max-w-4xl mx-auto pt-16 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="space-y-2 mb-8">
            <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              Results
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Interaction Analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {metrics && Object.entries(metrics).map(([phase, data]) => (
              <div key={phase} className="bg-gray-50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 capitalize mb-2">
                  {phase} Interaction
                </h3>
                <p className="text-3xl font-bold text-primary mb-1">
                  {data.percentage}%
                </p>
                <p className="text-sm text-gray-600">
                  {(data.time / 1000).toFixed(2)}s
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Button
              className="w-full py-6 text-lg font-medium transition-all duration-200 bg-primary hover:bg-primary-hover text-white"
              onClick={() => {
                setCurrentFrame(0);
                setIsAnimating(true);
              }}
              disabled={isAnimating}
            >
              {isAnimating ? "Replaying Movement..." : "Replay Mouse Movement"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full py-6 text-lg font-medium"
              onClick={() => navigate('/')}
            >
              Start New Survey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
