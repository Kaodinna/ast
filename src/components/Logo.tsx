import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 bg-gradient-to-br from-purple-500 via-blue-400 to-cyan-300 rounded-full flex items-center justify-center">
          <div className="absolute w-4 h-4 bg-background rounded-full"></div>
          <div className="absolute w-6 h-6 border-2 border-background rounded-full"></div>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-300">
          Astra
        </span>
      </div>
    </div>
  );
};

export default Logo;