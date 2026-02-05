'use client';

interface ScoreCellProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreCell({ score, size = 'md', showLabel = false }: ScoreCellProps) {
  const getColorClass = () => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'px-1.5 py-0.5 text-xs';
      case 'lg': return 'px-3 py-1.5 text-lg font-bold';
      default: return 'px-2 py-1 text-sm';
    }
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${getColorClass()} ${getSizeClass()}`}>
      {score}
      {showLabel && <span className="ml-1 opacity-75">({getLabel()})</span>}
    </span>
  );
}

interface ScoreBarProps {
  score: number;
  label: string;
}

export function ScoreBar({ score, label }: ScoreBarProps) {
  const getBarColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${getBarColor()}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
