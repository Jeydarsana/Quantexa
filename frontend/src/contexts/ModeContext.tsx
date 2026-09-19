import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModeContextType = {
  isSimpleMode: boolean;
  toggleMode: () => void;
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  const toggleMode = () => setIsSimpleMode(prev => !prev);

  return (
    <ModeContext.Provider value={{ isSimpleMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
