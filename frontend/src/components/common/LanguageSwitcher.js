import React from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const LanguageSwitcher = () => {
  // Force Vietnamese UI; render static label
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
      <GlobeAltIcon className="w-4 h-4" />
      <span className="uppercase font-semibold">VI</span>
    </div>
  );
};

export default LanguageSwitcher;
