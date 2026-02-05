'use client';

import { ProcessingStatus } from '@/types';

interface ProgressIndicatorProps {
  status: ProcessingStatus;
}

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  const getStatusText = () => {
    switch (status.status) {
      case 'idle':
        return 'Ready to analyze';
      case 'parsing':
        return 'Parsing PDF...';
      case 'splitting':
        return 'Identifying applicants...';
      case 'analyzing':
        return status.current && status.total
          ? `Analyzing candidates (${status.current}/${status.total})...`
          : 'Analyzing candidates...';
      case 'complete':
        return 'Analysis complete!';
      case 'error':
        return `Error: ${status.error || 'Unknown error'}`;
      default:
        return 'Processing...';
    }
  };

  const getProgressPercent = () => {
    if (status.status === 'analyzing' && status.current && status.total) {
      return Math.round((status.current / status.total) * 100);
    }
    return Math.round(status.progress * 100);
  };

  if (status.status === 'idle') {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
        <span className="text-sm text-gray-500">
          {getProgressPercent()}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            status.status === 'error' ? 'bg-red-500' :
            status.status === 'complete' ? 'bg-green-500' : 'bg-blue-600'
          }`}
          style={{ width: `${getProgressPercent()}%` }}
        />
      </div>

      {status.message && (
        <p className="text-xs text-gray-500">{status.message}</p>
      )}

      {status.status === 'analyzing' && status.current && status.total && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span className="text-xs text-gray-500">
            Processing candidate {status.current} of {status.total}
          </span>
        </div>
      )}
    </div>
  );
}
