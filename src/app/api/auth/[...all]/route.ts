import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';

const handler = toNextJsHandler(auth.handler);

export const GET = async (req: NextRequest) => {
  console.log('AUTH GET:', req.url);
  return handler.GET(req);
};

export const POST = async (req: NextRequest) => {
  console.log('AUTH POST:', req.url);
  return handler.POST(req);
};
