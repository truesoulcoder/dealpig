import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { systemMonitor } from '@/lib/systemMonitor';

/**
 * Health check endpoint
 * Verifies database connectivity, required environment variables, and API services
 * Can be used with uptime monitoring services like UptimeRobot, Pingdom, or StatusCake
 */
export async function GET() {
  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    const { data: dbData, error: dbError } = await supabase.from('health_checks').select('*').limit(1);
    const dbResponseTime = Date.now() - dbStartTime;
    
    if (dbError) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connectivity issue', 
          error: dbError.message 
        },
        { status: 500 }
      );
    }
    
    // Check required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
      'ENCRYPTION_KEY',
      'CRON_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing required environment variables', 
          missing: missingEnvVars 
        },
        { status: 500 }
      );
    }
    
    // Get system health data from systemMonitor
    const systemHealth = await systemMonitor.getSystemHealth();
    
    // Compile health response with all checks
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      environment: {
        status: 'complete',
        checkedVars: requiredEnvVars.length
      },
      system: systemHealth
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
}