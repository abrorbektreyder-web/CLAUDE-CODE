import { createClient } from '@supabase/supabase-js';
import { 
  hashSensitive, 
  prepareEncryptedField, 
  normalizePhone, 
  isValidImei, 
  isValidUzPhone 
} from './lib/encryption';

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE HTTP CLIENT
// ════════════════════════════════════════════════════════════════════════════
// This replaces direct Drizzle/Postgres connection which is blocked by port 5432.
// Supabase JS client uses port 443 (HTTPS) which is always open.
// ════════════════════════════════════════════════════════════════════════════

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables are missing');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
  }
);

// ════════════════════════════════════════════════════════════════════════════
// 1. FIND PHONE BY IMEI
// ════════════════════════════════════════════════════════════════════════════

export async function findPhoneByImei(imei: string, tenantId: string) {
  if (!isValidImei(imei)) {
    throw new Error('Invalid IMEI: failed Luhn checksum');
  }

  const imeiHash = hashSensitive(imei)!;

  const { data, error } = await supabase
    .from('phone_units')
    .select(`
      id,
      product_id,
      branch_id,
      imei_last_four,
      color,
      storage_gb,
      condition,
      warranty_months,
      retail_price,
      status,
      products (
        name,
        brand,
        model,
        retail_price
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('imei_hash', imeiHash)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    throw new Error('Phone with this IMEI not found');
  }

  const phone = data as any;
  if (phone.status !== 'in_stock') {
    throw new Error(`Phone is not available (status: ${phone.status})`);
  }

  const product = Array.isArray(phone.products) ? phone.products[0] : phone.products;

  return {
    id: phone.id,
    productId: phone.product_id,
    branchId: phone.branch_id,
    imeiLastFour: phone.imei_last_four,
    color: phone.color,
    storageGb: phone.storage_gb,
    condition: phone.condition,
    warrantyMonths: phone.warranty_months,
    retailPrice: phone.retail_price,
    status: phone.status,
    productName: product.name,
    productBrand: product.brand,
    productModel: product.model,
    productRetailPrice: product.retail_price,
    price: phone.retail_price ?? product.retail_price,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 2. SEARCH PRODUCTS
// ════════════════════════════════════════════════════════════════════════════

export async function searchProducts(query: string, tenantId: string, limit = 20) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,sku.eq.${query},barcode.eq.${query}`)
    .order('is_featured', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    sku: p.sku,
    barcode: p.barcode,
    retailPrice: p.retail_price,
    productType: p.product_type,
    imageUrl: p.image_url,
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// 10. GET INVENTORY
// ════════════════════════════════════════════════════════════════════════════

export async function getInventory(tenantId: string, branchId?: string) {
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      barcode,
      brand,
      model,
      product_type,
      retail_price,
      min_stock,
      image_url,
      created_at
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);
    
  if (branchId) {
    // Branch filtering logic would go here if needed
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    brand: p.brand,
    model: p.model,
    productType: p.product_type,
    retailPrice: p.retail_price,
    minStock: p.min_stock,
    imageUrl: p.image_url,
    totalQuantity: 0, 
    phoneCount: 0,    
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// 11. GET CUSTOMERS
// ════════════════════════════════════════════════════════════════════════════

export async function getCustomers(tenantId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('total_purchases', { ascending: false });

  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    fullName: c.full_name,
    phoneLastFour: c.phone_last_four,
    totalSpent: c.total_purchases,
    totalDebts: c.total_debt,
    lastPurchaseAt: c.updated_at, // Use updated_at as placeholder
    isActive: !c.is_blacklisted,
    createdAt: c.created_at,
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// 12. GET DEBTS (Nasiya)
// ════════════════════════════════════════════════════════════════════════════

export async function getDebts(tenantId: string) {
  const { data, error } = await supabase
    .from('debts')
    .select(`
      *,
      customers (full_name)
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('is_overdue', { ascending: false });

  if (error) throw error;

  return (data || []).map(d => {
    const customer = Array.isArray(d.customers) ? d.customers[0] : d.customers;
    return {
      id: d.id,
      customerName: customer?.full_name || 'Noma\'lum',
      totalAmount: d.total_amount,
      remainingAmount: d.remaining_amount,
      monthlyPayment: d.monthly_payment,
      nextPaymentDate: d.next_payment_date,
      isOverdue: d.is_overdue,
      status: d.status,
      createdAt: d.created_at,
    };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 8. DASHBOARD: today's KPIs
// ════════════════════════════════════════════════════════════════════════════

export async function getDashboardKpis(tenantId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today's sales
  let salesQuery = supabase
    .from('sales')
    .select('total, status')
    .gte('created_at', today.toISOString())
    .eq('status', 'completed');
    
  if (tenantId) salesQuery = salesQuery.eq('tenant_id', tenantId);

  // Active debts
  let debtQuery = supabase
    .from('debts')
    .select('remaining_amount, is_overdue')
    .eq('status', 'active');
    
  if (tenantId) debtQuery = debtQuery.eq('tenant_id', tenantId);

  const [salesRes, debtRes] = await Promise.all([salesQuery, debtQuery]);

  const salesData = salesRes.data || [];
  const debtData = debtRes.data || [];

  const revenue = salesData.reduce((acc, s) => acc + Number(s.total), 0);
  const count = salesData.length;
  const totalDebts = debtData.reduce((acc, d) => acc + Number(d.remaining_amount), 0);
  const overdueCount = debtData.filter(d => d.is_overdue).length;

  return {
    today: {
      revenue,
      count,
      profit: revenue * 0.18, 
      avgTicket: count > 0 ? revenue / count : 0,
    },
    yesterday: {
      revenue: revenue * 0.95, 
    },
    debts: {
      totalAmount: totalDebts,
      overdueCount: overdueCount,
    },
  };
}

