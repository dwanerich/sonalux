import { useState } from 'react';

export function Select({ value, onValueChange, children }) {
  return <div className="relative">{children}</div>;
}

export function SelectTrigger({ children, className = '', ...props }) {
  return (
    <div
      className={`cursor-pointer px-3 py-2 border rounded-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectContent({ children, className = '' }) {
  return (
    <div className={`absolute z-50 mt-2 rounded-md shadow bg-black text-white border border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

export function SelectItem({ value, children, onClick }) {
  return (
    <div
      className="px-3 py-2 cursor-pointer hover:bg-white/10"
      onClick={() => onClick && onClick(value)}
    >
      {children}
    </div>
  );
}
