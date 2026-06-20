import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export const getCachedSession = cache(async () => {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error('[Cached Session] error:', error);
    return null;
  }
});
