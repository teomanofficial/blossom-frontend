import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface UpgradeContextValue {
  isOpen: boolean
  source: string | null
  openUpgrade: (source?: string) => void
  closeUpgrade: () => void
}

const UpgradeContext = createContext<UpgradeContextValue | undefined>(undefined)

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<string | null>(null)

  const openUpgrade = useCallback((src?: string) => {
    setSource(src ?? null)
    setIsOpen(true)
  }, [])

  const closeUpgrade = useCallback(() => {
    setIsOpen(false)
    setSource(null)
  }, [])

  return (
    <UpgradeContext.Provider value={{ isOpen, source, openUpgrade, closeUpgrade }}>
      {children}
    </UpgradeContext.Provider>
  )
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext)
  if (!ctx) throw new Error('useUpgrade must be used within an UpgradeProvider')
  return ctx
}
