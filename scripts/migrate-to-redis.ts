#!/usr/bin/env tsx

/**
 * Migration script to transition from in-memory queue to Redis persistent queue
 * 
 * This script helps verify the new Redis setup and provides cleanup utilities
 */

import { persistentQueue } from "../src/services/persistentQueue";
import { db } from "../src/utils";

async function checkRedisConnection(): Promise<boolean> {
  try {
    console.log('🔍 Checking Redis connection...');
    
    await persistentQueue.initialize();
    const health = await persistentQueue.healthCheck();
    
    if (health.status === 'healthy') {
      console.log('✅ Redis connection successful');
      console.log('📊 Connection details:', health.details);
      return true;
    } else {
      console.error('❌ Redis connection failed');
      console.error('📋 Details:', health.details);
      return false;
    }
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    return false;
  }
}

async function initializeWorker(): Promise<boolean> {
  try {
    console.log('🚀 Initializing queue worker...');
    
    await persistentQueue.processMessages();
    
    // Wait a moment for worker to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await persistentQueue.getQueueStatus();
    console.log('✅ Worker initialized successfully');
    console.log('📊 Queue status:', status);
    
    return true;
  } catch (error) {
    console.error('❌ Worker initialization failed:', error);
    return false;
  }
}

async function cleanupOldQueue(): Promise<void> {
  try {
    console.log('🧹 Cleaning up old queue data...');
    
    await persistentQueue.cleanQueue();
    
    console.log('✅ Queue cleanup completed');
  } catch (error) {
    console.error('❌ Queue cleanup failed:', error);
  }
}

async function testMessageFlow(): Promise<boolean> {
  try {
    console.log('🧪 Testing message flow...');
    
    // Create a test message
    const testMessage = {
      id: `test_${Date.now()}`,
      from: 'test_user',
      type: 'text' as const,
      timestamp: Date.now().toString(),
      text: { body: 'Test message' }
    };
    
    // Enqueue test message
    await persistentQueue.enqueue(testMessage, 'test_agent', 1);
    
    // Check queue status
    const status = await persistentQueue.getQueueStatus();
    
    if (status.waiting > 0 || status.active > 0) {
      console.log('✅ Test message enqueued successfully');
      console.log('📊 Queue status:', status);
      return true;
    } else {
      console.log('⚠️ Test message may not have been enqueued properly');
      return false;
    }
  } catch (error) {
    console.error('❌ Message flow test failed:', error);
    return false;
  }
}

async function verifyDatabaseConnections(): Promise<boolean> {
  try {
    console.log('🔍 Verifying database connections...');
    
    // Test database connection
    const agentCount = await db.chatAgent.count();
    console.log(`✅ Database connected - Found ${agentCount} chat agents`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function generateHealthReport(): Promise<void> {
  console.log('\n📋 SYSTEM HEALTH REPORT');
  console.log('========================');
  
  const checks = [
    { name: 'Database Connection', fn: verifyDatabaseConnections },
    { name: 'Redis Connection', fn: checkRedisConnection },
    { name: 'Worker Initialization', fn: initializeWorker },
    { name: 'Message Flow Test', fn: testMessageFlow },
  ];
  
  const results: { name: string; success: boolean }[] = [];
  
  for (const check of checks) {
    try {
      const success = await check.fn();
      results.push({ name: check.name, success });
    } catch (error) {
      console.error(`❌ ${check.name} failed:`, error);
      results.push({ name: check.name, success: false });
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('============');
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  const allPassed = results.every(r => r.success);
  
  if (allPassed) {
    console.log('\n🎉 All checks passed! Your Redis queue is ready for production.');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy to Vercel with REDIS_URL environment variable');
    console.log('   2. Test with actual WhatsApp messages');
    console.log('   3. Monitor queue status at /api/worker/process-queue');
  } else {
    console.log('\n⚠️ Some checks failed. Please review the errors above.');
    console.log('\n📝 Troubleshooting:');
    console.log('   1. Verify REDIS_URL is correct');
    console.log('   2. Check Redis provider documentation');
    console.log('   3. Ensure database is accessible');
  }
}

async function main(): Promise<void> {
  const command = process.argv[2];
  
  switch (command) {
    case 'health':
      await generateHealthReport();
      break;
      
    case 'cleanup':
      await cleanupOldQueue();
      break;
      
    case 'test':
      await testMessageFlow();
      break;
      
    case 'check':
      await checkRedisConnection();
      break;
      
    default:
      console.log('🚀 Redis Migration Tool');
      console.log('=======================');
      console.log('');
      console.log('Available commands:');
      console.log('  health  - Run full system health check');
      console.log('  cleanup - Clean old queue data');
      console.log('  test    - Test message flow');
      console.log('  check   - Check Redis connection only');
      console.log('');
      console.log('Usage: npm run migrate [command]');
      console.log('');
      
      // Run health check by default
      await generateHealthReport();
  }
  
  process.exit(0);
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run main function
main().catch(error => {
  console.error('❌ Migration script failed:', error);
  process.exit(1);
}); 