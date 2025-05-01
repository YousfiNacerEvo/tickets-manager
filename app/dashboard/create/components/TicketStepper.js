import React from 'react';

export default function TicketStepper({ step, steps }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, idx) => (
        <div key={s.label} className="flex items-center">
          <div className={`flex flex-col items-center ${step === idx + 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step === idx + 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-100'} mb-1`}>{s.icon}</div>
            <span className="text-xs font-medium text-center w-20">{s.label}</span>
          </div>
          {idx < steps.length - 1 && <div className="w-8 h-1 bg-gray-200 mx-2 rounded" />}
        </div>
      ))}
    </div>
  );
} 