"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ClockProps {
  className?: string;
}

export default function Clock({ className = "" }: ClockProps) {
  const [time, setTime] = React.useState<string>("");
  const [date, setDate] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Time format: HH:MM:SS
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      
      // Date format: Day, DD Mon YYYY
      const dateString = now.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      
      setTime(timeString);
      setDate(dateString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Date */}
      <div className="text-right">
        <div className="text-sm font-medium text-slate-700 leading-tight">
          {date}
        </div>
      </div>
      
      {/* Separator */}
      <div className="w-px h-6 bg-slate-300"></div>
      
      {/* Time */}
      <div className="text-right">
        <div className="text-lg font-mono font-semibold text-slate-900 leading-tight">
          {time}
        </div>
        <div className="text-xs text-slate-500 leading-tight">
          Local Time
        </div>
      </div>
      
      {/* Live indicator */}
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    </div>
  );
}
