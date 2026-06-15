import React, { createContext, useContext, useState } from 'react';

// Create Level Context
const LevelContext = createContext();

// Level Provider Component
export const LevelProvider = ({ children }) => {
  const [currentLevel, setCurrentLevel] = useState('beginner');

  const levelConfig = {
    beginner: {
      label: 'Beginner Level',
      shortLabel: 'Beginner',
      emoji: '🟢',
      color: '#4CAF50',
    },
    intermediate: {
      label: 'Intermediate Level',
      shortLabel: 'Intermediate', 
      emoji: '🟡',
      color: '#FF9800',
    },
    advanced: {
      label: 'Advanced Level',
      shortLabel: 'Advanced',
      emoji: '🔴',
      color: '#F44336',
    },
  };

  const value = {
    currentLevel,
    setCurrentLevel,
    levelConfig,
    currentLevelConfig: levelConfig[currentLevel],
  };

  return (
    <LevelContext.Provider value={value}>
      {children}
    </LevelContext.Provider>
  );
};

// Custom Hook
export const useLevel = () => {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error('useLevel must be used within a LevelProvider');
  }
  return context;
};

export default LevelContext;
