import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
}

export function KPICard({ title, value }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
} 