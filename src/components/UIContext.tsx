import { createContext, useContext, useState } from "react";

const UIContext = createContext({
  isOverlayOpen: false,
  setOverlayOpen: (open: boolean) => {},
});

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOverlayOpen, setOverlayOpen] = useState(false);
  return (
    <UIContext.Provider value={{ isOverlayOpen, setOverlayOpen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);