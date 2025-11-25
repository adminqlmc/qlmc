/**
 * Render Server Utilities
 * Functions to wake up Render server from sleep
 */

/**
 * Wake up Render server by making a health check request
 * Render free tier sleeps after 15min idle, wake-up takes 30-60s
 */
export async function wakeUpRenderServer(
  baseUrl: string,
  maxRetries: number = 5,
  retryDelay: number = 10000 // 10 seconds
): Promise<boolean> {
  console.log(`[Render] Attempting to wake up server: ${baseUrl}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try health check endpoint
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000), // 15s timeout per attempt
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Render] Server is awake! (attempt ${attempt}/${maxRetries})`);
        console.log(`[Render] Server status:`, data);
        return true;
      }
    } catch (error: any) {
      const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
      const isConnectionError = error.message?.includes('ECONNREFUSED') || 
                                error.message?.includes('fetch failed');
      
      if (isTimeout || isConnectionError) {
        // Server is likely sleeping, wait and retry
        if (attempt < maxRetries) {
          console.log(
            `[Render] Server sleeping (attempt ${attempt}/${maxRetries}), ` +
            `waiting ${retryDelay}ms before retry...`
          );
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // Other errors
      console.error(`[Render] Error waking up server (attempt ${attempt}):`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error(`[Render] Failed to wake up server after ${maxRetries} attempts`);
  return false;
}

/**
 * Check if Render server is awake
 */
export async function isRenderServerAwake(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Execute function with Render server wake-up
 */
export async function withRenderServer<T>(
  baseUrl: string,
  fn: () => Promise<T>,
  options: {
    wakeUpFirst?: boolean;
    maxWakeUpRetries?: number;
    wakeUpDelay?: number;
  } = {}
): Promise<T> {
  const {
    wakeUpFirst = true,
    maxWakeUpRetries = 5,
    wakeUpDelay = 10000,
  } = options;

  // Wake up server if needed
  if (wakeUpFirst) {
    const isAwake = await isRenderServerAwake(baseUrl);
    if (!isAwake) {
      console.log('[Render] Server is sleeping, waking up...');
      const wokeUp = await wakeUpRenderServer(baseUrl, maxWakeUpRetries, wakeUpDelay);
      if (!wokeUp) {
        throw new Error('Failed to wake up Render server');
      }
    }
  }

  // Execute function
  return await fn();
}

