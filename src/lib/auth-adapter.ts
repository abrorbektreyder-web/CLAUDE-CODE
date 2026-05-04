import { getSupabase } from '@/db/lib/supabase';

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE HTTP ADAPTER FOR BETTER AUTH
// ════════════════════════════════════════════════════════════════════════════
// WHY: Port 5432/6543 is blocked by ISP in development.
//      Supabase JS client uses HTTPS (port 443) — always available.
//      This adapter maps Better Auth's CRUD interface to Supabase REST API.
// ════════════════════════════════════════════════════════════════════════════

// Lazy proxy — initializes only when first method is called (no top-level crash on Vercel)
const supabase = new Proxy({} as ReturnType<typeof getSupabase>, {
  get(_target, prop) {
    const client = getSupabase() as any;
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

// Model name → table name mapping
const TABLE_MAP: Record<string, string> = {
  user: 'users',
  session: 'sessions',
  account: 'accounts',
  verification: 'verifications',
};

// camelCase → snake_case converter
function toSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// snake_case → camelCase converter
function toCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// Slugify helper for subdomains
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

// Convert object keys: camelCase → snake_case
// Special mappings for fields that don't follow standard rules
const CAMEL_TO_SNAKE: Record<string, Record<string, string>> = {
  users: {
    name: 'full_name',
    emailVerified: 'email_verified',
    password: 'password_hash',
  },
  sessions: {
    userId: 'user_id',
    token: 'token_hash',
    expiresAt: 'expires_at',
    ipAddress: 'ip_address',
    userAgent: 'user_agent',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  accounts: {
    userId: 'user_id',
    accountId: 'account_id',
    providerId: 'provider_id',
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    idToken: 'id_token',
    accessTokenExpiresAt: 'access_token_expires_at',
    refreshTokenExpiresAt: 'refresh_token_expires_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  verifications: {
    expiresAt: 'expires_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

// Convert object keys: snake_case → camelCase with special reverse mappings
const SNAKE_TO_CAMEL: Record<string, Record<string, string>> = {
  users: {
    full_name: 'name',
    email_verified: 'emailVerified',
    password_hash: 'password',
    tenant_id: 'tenantId',
    branch_id: 'branchId',
    pin_hash: 'pinHash',
    two_factor_enabled: 'twoFactorEnabled',
    two_factor_secret: 'twoFactorSecret',
    recovery_codes: 'recoveryCodes',
    is_active: 'isActive',
    is_locked: 'isLocked',
    locked_until: 'lockedUntil',
    failed_login_attempts: 'failedLoginAttempts',
    last_login_at: 'lastLoginAt',
    last_login_ip: 'lastLoginIp',
    last_login_user_agent: 'lastLoginUserAgent',
    last_active_at: 'lastActiveAt',
    allowed_devices: 'allowedDevices',
    telegram_chat_id: 'telegramChatId',
    telegram_username: 'telegramUsername',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    deleted_at: 'deletedAt',
    avatar_url: 'avatarUrl',
    image: 'image',
    role: 'role',
  },
  sessions: {
    token_hash: 'token',
    user_id: 'userId',
    expires_at: 'expiresAt',
    ip_address: 'ipAddress',
    user_agent: 'userAgent',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
};

function objToSnake(obj: Record<string, unknown>, table: string): Record<string, unknown> {
  const specialMap = CAMEL_TO_SNAKE[table] ?? {};
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snakeKey = specialMap[k] ?? toSnake(k);
    result[snakeKey] = v;
  }
  return result;
}

function objToCamel(obj: Record<string, unknown>, table: string): Record<string, unknown> {
  const specialMap = SNAKE_TO_CAMEL[table] ?? {};
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camelKey = specialMap[k] ?? toCamel(k);
    result[camelKey] = v;
  }
  return result;
}

type WhereClause = {
  field: string;
  value: unknown;
  operator?: string;
};

function buildQuery(query: ReturnType<typeof supabase.from>, where: WhereClause[], table: string) {
  const specialMap = CAMEL_TO_SNAKE[table] ?? {};
  for (const w of where) {
    const col = specialMap[w.field] ?? toSnake(w.field);
    const op = w.operator ?? 'eq';
    if (op === 'eq') query = (query as any).eq(col, w.value);
    else if (op === 'ne') query = (query as any).neq(col, w.value);
    else if (op === 'in') query = (query as any).in(col, w.value as unknown[]);
    else if (op === 'gt') query = (query as any).gt(col, w.value);
    else if (op === 'gte') query = (query as any).gte(col, w.value);
    else if (op === 'lt') query = (query as any).lt(col, w.value);
    else if (op === 'lte') query = (query as any).lte(col, w.value);
    else if (op === 'contains') query = (query as any).ilike(col, `%${w.value}%`);
    else if (op === 'starts_with') query = (query as any).ilike(col, `${w.value}%`);
    else query = (query as any).eq(col, w.value);
  }
  return query;
}

// ════════════════════════════════════════════════════════════════════════════
// THE ADAPTER — implements Better Auth's DatabaseAdapter interface
// ════════════════════════════════════════════════════════════════════════════

export const supabaseAdapter = {
  // CREATE: Insert a new record
  async create<T extends Record<string, unknown>>({
    model,
    data,
  }: {
    model: string;
    data: Record<string, unknown>;
    select?: string[];
  }): Promise<T> {
    const table = TABLE_MAP[model] ?? model + 's';
    const snakeData = objToSnake(data, table);

    // Provide fields for session
    if (model === 'session') {
      // Fetch tenant_id from user
      if (snakeData.user_id) {
        const { data: user } = await supabase.from('users').select('tenant_id').eq('id', snakeData.user_id).single();
        if (user) {
          snakeData.tenant_id = user.tenant_id;
        }
      }
      
      // Set last_active_at
      snakeData.last_active_at = new Date().toISOString();
      
      // Fix empty inet string (Supabase doesn't like "" for inet)
      if (snakeData.ip_address === '') {
        delete snakeData.ip_address;
      }
    }

    // Handle UUID vs String ID mismatch:
    // Our database uses UUIDs for 'users' and 'sessions', but Better Auth generates base62 strings.
    if (model === 'user' || model === 'session') {
      delete snakeData.updated_at;
      delete snakeData.id; // Let database generate UUID
    } else {
      if (!snakeData.id) {
        snakeData.id = crypto.randomUUID();
      }
    }

    // Handle NEW USER Onboarding (Public Registration)
    if (model === 'user' && !snakeData.tenant_id && snakeData.store_name) {
      const storeName = snakeData.store_name as string;
      const ownerEmail = snakeData.email as string;
      const ownerPhone = snakeData.phone as string;
      const fullName = snakeData.full_name as string;

      // 1. Create Tenant
      const subdomainBase = slugify(storeName);
      let subdomain = subdomainBase;
      
      const { data: existingTenant } = await supabase.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle();
      if (existingTenant) {
        subdomain = `${subdomainBase}-${Math.random().toString(36).substring(2, 6)}`;
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          subdomain,
          business_name: storeName,
          owner_email: ownerEmail,
          owner_phone: ownerPhone,
          status: 'trial',
          plan: 'free',
        })
        .select()
        .single();

      if (tenantError) {
        console.error('[Adapter] Tenant creation failed:', tenantError);
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      // 2. Create Main Branch
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .insert({
          tenant_id: tenant.id,
          name: 'Asosiy do\'kon',
          is_main: true,
          is_active: true,
        })
        .select()
        .single();

      if (branchError) {
        console.error('[Adapter] Branch creation failed:', branchError);
      }

      // 3. Update User Data
      snakeData.tenant_id = tenant.id;
      snakeData.branch_id = branch?.id;
      snakeData.role = 'tenant_owner';
      
      delete snakeData.store_name;
    } else if (model === 'user') {
      delete snakeData.store_name;
      if (!snakeData.role) snakeData.role = 'admin';
    }

    // Fix for database constraint
    if (model === 'user' && !snakeData.password_hash) {
      snakeData.password_hash = '$argon2id$v=19$m=19456,t=2,p=1$managed_by_better_auth';
    }

    // Our DB requires phone NOT NULL — provide fallback if not given
    if (model === 'user' && !snakeData.phone) {
      snakeData.phone = '+998000000000';
    }

    console.log(`[Adapter] create model=${model} table=${table} data=`, JSON.stringify(snakeData, null, 2));

    const { data: result, error } = await supabase
      .from(table)
      .insert(snakeData)
      .select()
      .single();

    if (error) {
      throw new Error(`DB create failed: ${error.message}`);
    }

    return objToCamel(result as Record<string, unknown>, table) as T;
  },

  // FIND ONE: Get a single record by conditions
  async findOne<T>({
    model,
    where,
    join,
  }: {
    model: string;
    where: WhereClause[];
    select?: string[];
    join?: Record<string, boolean>;
  }): Promise<T | null> {
    console.log(`[Adapter] findOne model=${model}`, JSON.stringify(where), 'join=', join);
    const table = TABLE_MAP[model] ?? model + 's';
    let query = supabase.from(table).select('*');
    query = buildQuery(query, where, table) as any;

    const { data, error } = await (query as any).maybeSingle();

    if (error) {
      throw new Error(`DB findOne failed: ${error.message}`);
    }

    if (!data) {
      return null;
    }
    
    const camelData = objToCamel(data as Record<string, unknown>, table) as T;
    
    if (join && join.account && model === 'user') {
      const { data: accountsData } = await supabase.from('accounts').select('*').eq('user_id', data.id);
      if (accountsData) {
        (camelData as any).account = accountsData.map(a => objToCamel(a as Record<string, unknown>, 'accounts'));
      } else {
        (camelData as any).account = [];
      }
    }
    
    return camelData;
  },

  // FIND MANY: Get multiple records
  async findMany<T>({
    model,
    where,
    limit,
    offset,
    sortBy,
  }: {
    model: string;
    where?: WhereClause[];
    limit?: number;
    offset?: number;
    sortBy?: { field: string; direction: 'asc' | 'desc' };
    select?: string[];
  }): Promise<T[]> {
    const table = TABLE_MAP[model] ?? model + 's';
    let query = supabase.from(table).select('*');

    if (where?.length) query = buildQuery(query, where, table) as any;

    if (sortBy) {
      const col = toSnake(sortBy.field);
      query = (query as any).order(col, { ascending: sortBy.direction === 'asc' });
    }

    if (typeof offset === 'number' && typeof limit === 'number') {
      query = (query as any).range(offset, offset + limit - 1);
    } else if (typeof limit === 'number') {
      query = (query as any).limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`DB findMany failed: ${error.message}`);
    }

    return ((data as Record<string, unknown>[]) ?? []).map((r) =>
      objToCamel(r, table)
    ) as T[];
  },

  // COUNT: Count records matching conditions
  async count({
    model,
    where,
  }: {
    model: string;
    where?: WhereClause[];
  }): Promise<number> {
    const table = TABLE_MAP[model] ?? model + 's';
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    if (where?.length) query = buildQuery(query, where, table) as any;

    const { count, error } = await query;

    if (error) {
      console.error(`[SupabaseAdapter] COUNT error on ${table}:`, error);
      throw new Error(`DB count failed: ${error.message}`);
    }

    return count ?? 0;
  },

  // UPDATE: Update a single record
  async update<T>({
    model,
    where,
    update,
  }: {
    model: string;
    where: WhereClause[];
    update: Record<string, unknown>;
  }): Promise<T | null> {
    const table = TABLE_MAP[model] ?? model + 's';
    const snakeUpdate = objToSnake(update, table);

    let query = supabase.from(table).update(snakeUpdate);
    query = buildQuery(query, where, table) as any;

    const { data, error } = await (query as any).select().maybeSingle();

    if (error) {
      console.error(`[SupabaseAdapter] UPDATE error on ${table}:`, error);
      throw new Error(`DB update failed: ${error.message}`);
    }

    if (!data) return null;
    return objToCamel(data as Record<string, unknown>, table) as T;
  },

  // UPDATE MANY: Update multiple records
  async updateMany({
    model,
    where,
    update,
  }: {
    model: string;
    where: WhereClause[];
    update: Record<string, unknown>;
  }): Promise<number> {
    const table = TABLE_MAP[model] ?? model + 's';
    const snakeUpdate = objToSnake(update, table);

    let query = supabase.from(table).update(snakeUpdate);
    query = buildQuery(query, where, table) as any;

    const { count, error } = await (query as any).select('id', {
      count: 'exact',
      head: true,
    });

    if (error) {
      console.error(`[SupabaseAdapter] UPDATE_MANY error on ${table}:`, error);
      throw new Error(`DB updateMany failed: ${error.message}`);
    }

    return count ?? 0;
  },

  // DELETE: Delete a single record
  async delete({
    model,
    where,
  }: {
    model: string;
    where: WhereClause[];
  }): Promise<void> {
    const table = TABLE_MAP[model] ?? model + 's';
    let query = supabase.from(table).delete();
    query = buildQuery(query, where, table) as any;

    const { error } = await query;

    if (error) {
      console.error(`[SupabaseAdapter] DELETE error on ${table}:`, error);
      throw new Error(`DB delete failed: ${error.message}`);
    }
  },

  // DELETE MANY: Delete multiple records
  async deleteMany({
    model,
    where,
  }: {
    model: string;
    where: WhereClause[];
  }): Promise<number> {
    const table = TABLE_MAP[model] ?? model + 's';
    let query = supabase.from(table).delete();
    query = buildQuery(query, where, table) as any;

    const { count, error } = await (query as any);

    if (error) {
      console.error(`[SupabaseAdapter] DELETE_MANY error on ${table}:`, error);
      throw new Error(`DB deleteMany failed: ${error.message}`);
    }
    return count ?? 0;
  },
};
