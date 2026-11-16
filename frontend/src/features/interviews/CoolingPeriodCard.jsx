import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CoolingPeriodCard({ coolingData, interviewType, onExpired }) {
  const [secondsRemaining, setSecondsRemaining] = useState(
    coolingData?.remaining_seconds || 0
  );

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpired) onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining, onExpired]);

  if (!coolingData || secondsRemaining <= 0) {
    return null;
  }

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 mb-6 text-amber-900 shadow-sm">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <span>{interviewType.toUpperCase()} Practice Cooling Period</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono font-bold">
                {formattedTime}
              </span>
            </h4>
          </div>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Following an unsuccessful interview session, a 24-hour cooling period is in effect to encourage targeted review before reattempting.
          </p>
          <div className="mt-3 pt-2.5 border-t border-amber-200/70 flex items-center justify-between text-xs text-amber-900 font-medium">
            <span className="flex items-center gap-1 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Other interview types remain completely accessible.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
