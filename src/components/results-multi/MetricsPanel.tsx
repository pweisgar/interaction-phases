
import React from 'react';
import { Button } from "@/components/ui/button";
import { PHASE_COLORS } from '@/lib/constants';

interface MetricsPanelProps {
  questionId: number;
  metrics: {
    [key: string]: {
      time: number;
      percentage: string;
    };
  } | null;
  showAnalysis: boolean;
  setShowAnalysis: (show: boolean) => void;
  isAnimating: boolean;
  onReplayClick: () => void;
  navigate: (path: string) => void;
}

export const MetricsPanel = ({
  questionId,
  metrics,
  showAnalysis,
  setShowAnalysis,
  isAnimating,
  onReplayClick,
  navigate
}: MetricsPanelProps) => {
  return (
    <div className={`fixed ${questionId === 1 ? 'top-4' : 'top-64'} right-4 w-96 transition-transform duration-300 transform ${
      showAnalysis ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            Results - Q{questionId}
          </div>
          {questionId === 1 && (
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
            >
              {showAnalysis ? '→' : '←'}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {metrics && Object.entries(metrics).map(([phase, data]) => (
            <div key={phase} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PHASE_COLORS[phase as keyof typeof PHASE_COLORS] }}
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

          {questionId === 2 && (
            <div className="space-y-4 pt-4">
              <Button
                className="w-full py-4 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white"
                onClick={onReplayClick}
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
          )}
        </div>
      </div>
    </div>
  );
};
