import React from 'react';

export default function StepTitle({ title, desc }) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{title}</h1>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
} 