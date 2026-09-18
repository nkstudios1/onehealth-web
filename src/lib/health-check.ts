/**
 * Health check utility to verify backend connectivity
 */
export async function checkBackendHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  message: string
  url?: string
}> {
  try {
    const response = await fetch('/api/v1/health/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Backend is connected and responding',
        url: response.url,
      }
    }
    
    return {
      status: 'unhealthy',
      message: `Backend returned status ${response.status}`,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Failed to connect to backend',
    }
  }
}
