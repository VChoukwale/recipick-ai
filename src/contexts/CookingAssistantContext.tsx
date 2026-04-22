import { createContext, useContext, useState } from 'react'

interface CookingAssistantContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const CookingAssistantContext = createContext<CookingAssistantContextType>({
  open: false,
  setOpen: () => {},
})

export function CookingAssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <CookingAssistantContext.Provider value={{ open, setOpen }}>
      {children}
    </CookingAssistantContext.Provider>
  )
}

export const useCookingAssistant = () => useContext(CookingAssistantContext)
