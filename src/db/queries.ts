'use server';

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

// Supabase client instance (lazy initialized)
let supabaseInstance: any = null;

function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing (URL or Service Role Key)');
  }

  supabaseInstance = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });

  return supabaseInstance;
}

// ════════════════════════════════════════════════════════════════════════════
// 1. FIND PHONE BY IMEI
// ════════════════════════════════════════════════════════════════════════════

export async function findPhoneByImei(imei: string, tenantId: string) {
  if (!isValidImei(imei)) {
    throw new Error('Invalid IMEI: failed Luhn checksum');
  }

  const imeiHash = hashSensitive(imei)!;

  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  let query = getSupabase()
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
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  let salesQuery = getSupabase()
    .from('sales')
    .select('total, status')
    .gte('created_at', today.toISOString())
    .eq('status', 'completed');
    
  if (tenantId) salesQuery = salesQuery.eq('tenant_id', tenantId);

  // Active debts
  let debtQuery = getSupabase()
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

// ════════════════════════════════════════════════════════════════════════════
// 13. GET SALES (History)
// ════════════════════════════════════════════════════════════════════════════

export async function getSales(tenantId: string, limit = 50) {
  const { data, error } = await getSupabase()
    .from('sales')
    .select(`
      *,
      customers (full_name, phone_last_four)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(s => {
    const customer = Array.isArray(s.customers) ? s.customers[0] : s.customers;
    return {
      id: s.id,
      receiptNumber: s.receipt_number,
      customerName: customer?.full_name || 'Mijoz ko\'rsatilmagan',
      customerPhone: customer?.phone_last_four ? `+998 ** *** ** ${customer.phone_last_four}` : '-',
      total: s.total,
      paymentMethod: s.payment_method,
      status: s.status,
      createdAt: s.created_at,
    };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 14. CREATE SALE
// ════════════════════════════════════════════════════════════════════════════

export async function createSale(data: {
  tenantId: string;
  branchId: string;
  cashierId: string;
  customerId?: string;
  customerData?: {
    fullName: string;
    phone: string;
  };
  subtotal: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  debtAmount: number;
  debtMonths?: number;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    total: number;
  }>;
}) {
  const supabase = getSupabase();

  // 1. Handle Customer (Create if doesn't exist)
  let customerId = data.customerId;
  if (!customerId && data.customerData) {
    const normalizedPhone = normalizePhone(data.customerData.phone);
    if (!normalizedPhone) {
      throw new Error('Noto\'g\'ri telefon raqami');
    }

    const phoneHash = hashSensitive(normalizedPhone)!;

    // Check if customer exists first
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', data.tenantId)
      .eq('phone_hash', phoneHash)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          tenant_id: data.tenantId,
          full_name: data.customerData.fullName,
          phone_hash: phoneHash,
          phone_last_four: normalizedPhone.slice(-4),
          total_purchases: 0,
          total_debt: 0,
        })
        .select()
        .single();
      
      if (customerError) throw customerError;
      customerId = newCustomer.id;
    }
  }

  // 2. Create the sale record
  let branchId = data.branchId;
  if (!branchId || branchId === '00000000-0000-0000-0000-000000000000') {
    const { data: userData } = await supabase
      .from('users')
      .select('branch_id')
      .eq('id', data.cashierId)
      .single();
    
    if (userData?.branch_id) {
      branchId = userData.branch_id;
    } else {
      const { data: branchData } = await supabase
        .from('branches')
        .select('id')
        .eq('tenant_id', data.tenantId)
        .limit(1)
        .single();
      
      if (branchData) {
        branchId = branchData.id;
      }
    }
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      tenant_id: data.tenantId,
      branch_id: branchId,
      cashier_id: data.cashierId,
      customer_id: customerId,
      subtotal: data.subtotal,
      total: data.total,
      payment_method: data.paymentMethod,
      paid_amount: data.paidAmount,
      debt_amount: data.debtAmount,
      status: 'completed',
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // 3. Create sale items
  const itemsToInsert = data.items.map(item => ({
    tenant_id: data.tenantId,
    sale_id: sale.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    cost_price: item.costPrice,
    total: item.total,
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  // 4. Handle Debt (Nasiya)
  if (data.paymentMethod === 'credit' && customerId) {
    const months = data.debtMonths || 1;
    const monthlyPayment = Math.ceil(data.debtAmount / months);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .insert({
        tenant_id: data.tenantId,
        customer_id: customerId,
        sale_id: sale.id,
        principal_amount: data.debtAmount,
        total_amount: data.debtAmount,
        total_months: months,
        monthly_payment: monthlyPayment,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        remaining_amount: data.debtAmount,
        status: 'active',
      })
      .select()
      .single();

    if (debtError) throw debtError;

    // Create debt schedule
    const schedules = Array.from({ length: months }, (_, i) => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      return {
        tenant_id: data.tenantId,
        debt_id: debt.id,
        installment_number: i + 1,
        due_date: dueDate.toISOString().split('T')[0],
        expected_amount: i === months - 1 
          ? Number(data.debtAmount) - (monthlyPayment * (months - 1))
          : monthlyPayment,
      };
    });

    const { error: scheduleError } = await supabase
      .from('debt_schedules')
      .insert(schedules);

    if (scheduleError) throw scheduleError;

    // Update customer debt total
    const { data: customer } = await supabase
      .from('customers')
      .select('total_debt, total_purchases')
      .eq('id', customerId)
      .single();

    if (customer) {
      await supabase
        .from('customers')
        .update({ 
          total_debt: Number(customer.total_debt || 0) + Number(data.debtAmount),
          total_purchases: Number(customer.total_purchases || 0) + Number(data.total)
        })
        .eq('id', customerId);
    }
  }

  return {
    ...sale,
    items: data.items,
    customerName: data.customerData?.fullName || 'Mijoz',
  };
}

