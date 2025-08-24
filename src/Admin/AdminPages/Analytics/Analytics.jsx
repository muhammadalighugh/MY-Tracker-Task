// Analytics.js
import React from 'react';
import { BarChart3 } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
      <div className="text-gray-400 mb-4">
        <BarChart3 className="h-12 w-12 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
      <p className="text-gray-600">This section is under development. Check back soon!</p>
    </div>
  );
};

export default Analytics;