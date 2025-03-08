import { createContext, ReactNode, useContext, useState } from 'react'

interface AppContextType {}


export const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider = ({
    children,
  }: {
    children: ReactNode;
    // value?: Actions;
  }) => {
    const [state, dispatch] = useState(null);
    // const [state, dispatch] = useReducer(appReducer, initialState);
  
    const contextValue: AppContextType = {
      state,
      dispatch,
    };
  
    return (
      <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
    );
  };

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
      throw new Error("useApp must be used within an AppProvider");
    }
    return context;
  };


  export default AppProvider;