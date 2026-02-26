// Read subtab from URL query parameter (legacy support, redirects to proper route)
useEffect(() => {
  if (!hasAccess || hasReadUrl.current) return
  hasReadUrl.current = true

  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab') as SubTab | null
  if (tab && ["correlation", "performance", "mental-health"].includes(tab)) {
    setActiveSubTab(tab)
  }
}, [hasAccess])
