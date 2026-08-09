import React from 'react';

export default function StepCard({ n, label, right, active, children }) {
  return (
    <div className={`entropy-step rounded-lg border p-3.5 xl:p-5 ${active ? 'border-gray-800' : 'border-gray-800/50'}`}>
      <div className="entropy-step-head flex items-baseline gap-2 mb-3">
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold border shrink-0 self-center ${
            active ? 'border-yellow-500/40 bg-yellow-900/50 text-yellow-400' : 'border-gray-800 text-gray-600'
          }`}
        >
          {n}
        </span>
        <span className={`text-[10px] uppercase tracking-widest ${active ? 'text-gray-300' : 'text-gray-600'}`}>
          {label}
        </span>
        {right && (
          <span className={`ml-auto font-mono text-[10px] ${active ? 'text-gray-500' : 'text-gray-700'}`}>
            {right}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
