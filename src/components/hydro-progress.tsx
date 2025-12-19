"use client";

import { useState, useEffect } from "react";

interface HydroProgressProps {
  value: number;
  goal: number;
  units: string;
}

export function HydroProgress({ value, goal, units }: HydroProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress change
    const newProgress = goal > 0 ? (value / goal) * 100 : 0;
    setProgress(newProgress);
  }, [value, goal]);

  const clampedProgress = Math.min(progress, 100);
  const percentage = Math.round(clampedProgress);

  const radius = 90;
  const stroke = 20;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="relative w-64 h-64">
      <svg
        height="100%"
        width="100%"
        viewBox="0 0 200 200"
        className="-rotate-90"
      >
        <circle
          className="text-secondary"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
        />
        <circle
          className="text-primary transition-all duration-500 ease-out"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold text-primary transition-colors duration-500"
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}
