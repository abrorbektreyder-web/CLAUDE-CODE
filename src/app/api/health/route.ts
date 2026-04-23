import { NextResponse } from 'next/server';
import { healthCheck } from '@/db/lib/db';

export async function GET() {
  const dbHealth = await healthCheck();

  return NextResponse.json(
    {
      status: dbHealth.status === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth,
      },
    },
    {
      status: dbHealth.status === 'ok' ? 200 : 503,
    }
  );
}
