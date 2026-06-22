import { createContext, useContext, useState } from 'react';

const SystemDataContext = createContext();

export function SystemDataProvider({ children }) {
  const [systemData, setSystemData] = useState(null);
  return (
    <SystemDataContext.Provider value={{ systemData, setSystemData }}>
      {children}
    </SystemDataContext.Provider>
  );
}

export const useSystemData = () => useContext(SystemDataContext);
