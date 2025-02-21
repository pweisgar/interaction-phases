
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MetricData {
  time: number;
  percentage: string;
}

interface Metrics {
  pre: MetricData;
  during: MetricData;
  post: MetricData;
}

interface MetricsPanelProps {
  questionNumber: number;
  metrics: Metrics | null;
  onHide: () => void;
  showReplayControls?: boolean;
  isAnimating?: boolean;
  onReplay?: () => void;
}

const PHASE_COLORS = {
  pre: "#808080",    // Grey
  during: "#007BFF", // Blue
  post: "#28a745",   // Green
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  questionNumber,
  metrics,
  onHide,
  showReplayControls = false,
  isAnimating = false,
  onReplay
}) => {
  const navigate = useNavigate();

  if (!metrics) return null;

  return (
    <div className="w-96 bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
          Results – Q{questionNumber}
        </div>
        <button
          onClick={onHide}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
        >
          →
        </button>
      </div>
      <div className="space-y-3">
        {["pre", "during", "post"].map((phase) => {
          const data = metrics[phase as keyof Metrics];
          return (
            <div key={phase} className="bg-gray-50 rounded-lg p-0.25">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: PHASE_COLORS[phase as keyof typeof PHASE_COLORS] }} 
                />
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
      {showReplayControls && (
        <div className="space-y-2 mt-2">
          <Button
            variant="outline"
            className="w-full py-4 text-sm transition-all duration-200 transform hover:scale-105 bg-gray-300 hover:bg-gray-400 text-black disabled:opacity-50"
            onClick={onReplay}
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
      )}
    </div>
  );
};
