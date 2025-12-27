import React from 'react';
import { AlertCircle } from 'lucide-react';

type DataErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function DataError({ 
  message = 'Failed to load data', 
  onRetry 
}: DataErrorProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
        <div className="flex-1">
          <p className="text-sm text-red-700">
            {message}
          </p>
        </div>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
