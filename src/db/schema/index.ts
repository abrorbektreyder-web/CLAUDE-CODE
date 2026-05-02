// ════════════════════════════════════════════════════════════════════════════
// DRIZZLE SCHEMA — Main entry point
// ════════════════════════════════════════════════════════════════════════════
// Import from this file in your app: import { db, sales } from '@/db'
// ════════════════════════════════════════════════════════════════════════════

// Re-export all schema modules
export * from './_shared';
export * from './tenants';
export * from './users';
export * from './inventory';
export * from './customers';
export * from './sales';
export * from './finance';
export * from './suppliers';
export * from './operations';
export * from './auth';

// Re-export relations
export * from './_relations';
