import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  componentName: string
  startTime: number
  endTime?: number
  duration?: number
  dataPoints?: number
  error?: string
}

export function usePerformanceMonitor(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    componentName,
    startTime: performance.now()
  })

  useEffect(() => {
    return () => {
      const endTime = performance.now()
      const duration = endTime - metricsRef.current.startTime
      
      console.log(`⏱️ ${componentName} performance:`, {
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })

      // Log slow components (> 2 seconds)
      if (duration > 2000) {
        console.warn(`🐌 Slow component detected: ${componentName} took ${duration.toFixed(2)}ms`)
      }
    }
  }, [componentName])

  const markDataLoaded = (dataPoints?: number) => {
    metricsRef.current.endTime = performance.now()
    metricsRef.current.duration = metricsRef.current.endTime - metricsRef.current.startTime
    metricsRef.current.dataPoints = dataPoints

    console.log(`📊 ${componentName} data loaded:`, {
      duration: `${metricsRef.current.duration.toFixed(2)}ms`,
      dataPoints,
      timestamp: new Date().toISOString()
    })
  }

  const markError = (error: string) => {
    metricsRef.current.error = error
    metricsRef.current.endTime = performance.now()
    metricsRef.current.duration = metricsRef.current.endTime - metricsRef.current.startTime

    console.error(`❌ ${componentName} error:`, {
      duration: `${metricsRef.current.duration?.toFixed(2)}ms`,
      error,
      timestamp: new Date().toISOString()
    })
  }

  return {
    markDataLoaded,
    markError,
    getMetrics: () => metricsRef.current
  }
}
