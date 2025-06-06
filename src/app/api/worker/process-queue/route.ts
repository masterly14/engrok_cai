import { NextRequest, NextResponse } from "next/server";
import { persistentQueue } from "@/services/persistentQueue";

export async function POST(request: NextRequest) {
  try {
    console.log('[Worker] Starting queue processing');
    
    // Initialize and start processing messages
    await persistentQueue.processMessages();
    
    // Get current queue status
    const status = await persistentQueue.getQueueStatus();
    
    console.log('[Worker] Queue processing started', status);
    
    return NextResponse.json({
      success: true,
      message: 'Queue processing started',
      status
    });
    
  } catch (error) {
    console.error('[Worker] Error starting queue processing:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check and queue status
    const healthCheck = await persistentQueue.healthCheck();
    const queueStatus = await persistentQueue.getQueueStatus();
    
    return NextResponse.json({
      health: healthCheck,
      queue: queueStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Worker] Error getting queue status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Optional: Manual queue management endpoints
export async function PUT(request: NextRequest) {
  const { action } = await request.json();
  
  try {
    switch (action) {
      case 'pause':
        await persistentQueue.pauseQueue();
        return NextResponse.json({ success: true, message: 'Queue paused' });
        
      case 'resume':
        await persistentQueue.resumeQueue();
        return NextResponse.json({ success: true, message: 'Queue resumed' });
        
      case 'clean':
        await persistentQueue.cleanQueue();
        return NextResponse.json({ success: true, message: 'Queue cleaned' });
        
      case 'retry':
        await persistentQueue.retryFailedJobs();
        return NextResponse.json({ success: true, message: 'Failed jobs retried' });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`[Worker] Error executing action ${action}:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 