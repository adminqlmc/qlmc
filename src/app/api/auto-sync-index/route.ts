import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Auto-Sync FAISS Index to Git API
 * 
 * Downloads FAISS index from Render, saves to prebuilt/, 
 * and automatically commits & pushes to Git.
 * 
 * This endpoint is called automatically after training.
 */
export async function POST() {
  try {
    console.log('[auto-sync] Starting auto-sync to Git...');

    const scriptPath = path.join(process.cwd(), 'scripts', 'auto-sync-index.js');
    
    // Run script with timeout
    const { stdout, stderr } = await execAsync(`node "${scriptPath}"`, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (stderr && !stderr.includes('warning')) {
      console.error('[auto-sync] stderr:', stderr);
    }
    
    console.log('[auto-sync] stdout:', stdout);
    
    // Parse output to check if changes were pushed
    const pushed = stdout.includes('Pushed to GitHub');
    
    return NextResponse.json({
      success: true,
      pushed,
      message: pushed 
        ? 'Index synced to Git successfully. Vercel will auto-deploy.' 
        : 'Index already up to date. No changes needed.',
      output: stdout,
    });
    
  } catch (error: any) {
    console.error('[auto-sync] Failed:', error);
    
    // Check if it's just "no changes" case
    const isNoChanges = error.stdout?.includes('No changes detected');
    
    if (isNoChanges) {
      return NextResponse.json({
        success: true,
        pushed: false,
        message: 'Index already up to date',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Auto-sync failed',
      detail: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }, { status: 500 });
  }
}

/**
 * Manual trigger endpoint (GET)
 * Allows manual triggering via browser or curl
 */
export async function GET() {
  return POST();
}
