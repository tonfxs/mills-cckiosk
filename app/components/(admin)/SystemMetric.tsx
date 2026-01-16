'use client';

interface SystemMetricProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export const SystemMetric: React.FC<SystemMetricProps> = ({ 
  label, 
  value, 
  max = 100, 
  color 
}) => {
  const percentage = (value / max) * 100;
  
  const getColorClass = (): string => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color || getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};