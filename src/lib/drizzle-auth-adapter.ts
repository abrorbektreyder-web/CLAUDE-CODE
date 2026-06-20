import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db/lib/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .slice(0, 30);
}

// Ensure the schema object only contains the relevant tables, 
// matching usePlural: true format for Better Auth
const adapterSchema = {
  user: schema.users,
  session: schema.sessions,
  account: schema.account,
  verification: schema.verification,
};

// We wrap the raw Drizzle adapter to inject our custom business logic (Tenant & Session management)
export const createDrizzleAdapter = () => {
  // Pass the exact same schema structure
  const rawAdapter = drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema: adapterSchema
  });

  // Execute the raw adapter factory to get the interface
  // Wait, in recent versions drizzleAdapter returns a function or object?
  // Usually `drizzleAdapter` returns a function that takes `(db, config)` or returns the `Adapter` object itself if we passed `db` and options.
  // Actually, drizzleAdapter(db, options) returns the Adapter object directly or a plugin factory.
  // We'll treat it as returning the database adapter function. Better Auth expects database: adapter.
  // So rawAdapter is a function that betterAuth calls, OR it's the object.
  // Let's create a proxy to intercept the `create` method.
  
  return (config: any) => {
    const initializedAdapter = typeof rawAdapter === 'function' ? rawAdapter(config) : rawAdapter;
    
    return {
      ...initializedAdapter,
      
      create: async (params: any) => {
        const { model, data } = params;
        const modifiedData = { ...data };

        if (model === 'session') {
          // Fetch tenantId from user
          if (modifiedData.userId) {
            const user = await db.query.users.findFirst({
              where: eq(schema.users.id, modifiedData.userId),
              columns: { tenantId: true }
            });
            if (user) {
              modifiedData.tenantId = user.tenantId;
            }
          }
          modifiedData.lastActiveAt = new Date();
          
          if (modifiedData.ipAddress === '') {
            delete modifiedData.ipAddress;
          }
        }

        if (model === 'user' && !modifiedData.tenantId && modifiedData.storeName) {
          const storeName = modifiedData.storeName as string;
          const ownerEmail = modifiedData.email as string;
          const ownerPhone = modifiedData.phone as string;
          
          // 1. Create Tenant
          const subdomainBase = slugify(storeName);
          let subdomain = subdomainBase;

          const existingTenant = await db.query.tenants.findFirst({
            where: eq(schema.tenants.subdomain, subdomain),
            columns: { id: true }
          });
          
          if (existingTenant) {
            subdomain = `${subdomainBase}-${Math.random().toString(36).substring(2, 6)}`;
          }

          const [tenant] = await db.insert(schema.tenants).values({
            subdomain,
            businessName: storeName,
            ownerEmail,
            ownerPhone,
            status: 'trial',
            plan: 'free',
          }).returning();

          // 2. Create Main Branch
          const [branch] = await db.insert(schema.branches).values({
            tenantId: tenant.id,
            name: "Asosiy do'kon",
            isMain: true,
            isActive: true,
          }).returning();

          // 3. Update User Data
          modifiedData.tenantId = tenant.id;
          modifiedData.branchId = branch.id;
          modifiedData.role = 'tenant_owner';

          delete modifiedData.storeName;
        } else if (model === 'user') {
          delete modifiedData.storeName;
          if (!modifiedData.role) modifiedData.role = 'admin';
        }

        if (model === 'user' && !modifiedData.password) {
          // In Better Auth `password` is mapped to `password_hash` automatically by drizzleAdapter? No, if it's not defined, we should provide the fallback.
          modifiedData.password = '$argon2id$v=19$m=19456,t=2,p=1$managed_by_better_auth';
        }

        if (model === 'user' && !modifiedData.phone) {
          modifiedData.phone = '+998000000000';
        }

        return initializedAdapter.create({ model, data: modifiedData });
      }
    };
  };
};

export const customDrizzleAdapter = createDrizzleAdapter();
