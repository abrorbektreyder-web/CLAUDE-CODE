'use server';

import { createClient } from '@supabase/supabase-js';
import {
  hashSensitive,
  prepareEncryptedField,
  normalizePhone,
  isValidImei,
  isValidUzPhone
} from './lib/encryption';
import { sendTelegramAlert, formatSaleMessage } from '@/lib/telegram';
import { formatSum } from '@/lib/utils';

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
  let dbQuery = getSupabase()
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('is_active', true);

  if (query.trim()) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,sku.eq.${query},barcode.eq.${query}`);
  }

  const { data, error } = await dbQuery
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
      cost_price,
      retail_price,
      wholesale_price,
      min_stock,
      warranty_months,
      description,
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
    costPrice: p.cost_price,
    retailPrice: p.retail_price,
    wholesalePrice: p.wholesale_price,
    minStock: p.min_stock,
    warrantyMonths: p.warranty_months,
    description: p.description,
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
      customers (full_name, phone_last_four)
    `)
    .eq('tenant_id', tenantId)
    .order('is_overdue', { ascending: false });

  if (error) throw error;

  return (data || []).map(d => {
    const customer = Array.isArray(d.customers) ? d.customers[0] : d.customers;
    return {
      id: d.id,
      customerName: customer?.full_name || 'Noma\'lum',
      phoneLastFour: customer?.phone_last_four || '',
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

export async function getDebtDetails(debtId: string, tenantId: string) {
  const supabase = getSupabase();

  const [debtRes, paymentsRes, schedulesRes] = await Promise.all([
    supabase
      .from('debts')
      .select('*, customers(*)')
      .eq('id', debtId)
      .eq('tenant_id', tenantId)
      .single(),
    supabase
      .from('payments')
      .select('*')
      .eq('debt_id', debtId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),
    supabase
      .from('debt_schedules')
      .select('*')
      .eq('debt_id', debtId)
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: true })
  ]);

  if (debtRes.error) throw debtRes.error;

  const debt = debtRes.data;
  const customer = Array.isArray(debt.customers) ? debt.customers[0] : debt.customers;

  return {
    ...debt,
    customer,
    payments: paymentsRes.data || [],
    schedules: schedulesRes.data || []
  };
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

export async function getTenant(id: string) {
  const { data, error } = await getSupabase()
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    businessName: data.business_name,
    subdomain: data.subdomain,
    plan: data.plan,
    status: data.status,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 13. GET SALES (History)
// ════════════════════════════════════════════════════════════════════════════

export async function getSales(tenantId: string, limit = 50) {
  const supabase = getSupabase();

  // Fetch sales with customer info
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      customers (full_name, phone_last_four),
      debts (id, status, remaining_amount, total_amount, paid_amount),
      sale_items (product_name, quantity)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(s => {
    const customer = Array.isArray(s.customers) ? s.customers[0] : s.customers;
    // A sale can have one linked debt record when payment_method = 'credit'
    const debt = Array.isArray(s.debts) ? s.debts[0] : s.debts;

    return {
      id: s.id,
      receiptNumber: s.receipt_number,
      customerName: customer?.full_name || 'Mijoz ko\'rsatilmagan',
      customerPhone: customer?.phone_last_four ? `+998 ** *** ** ${customer.phone_last_four}` : '-',
      total: s.total,
      paymentMethod: s.payment_method,
      status: s.status,
      createdAt: s.created_at,
      // Debt-specific enrichment (only for credit sales)
      debtStatus: debt?.status || null,                    // 'active' | 'paid' | 'overdue' | null
      debtRemaining: debt?.remaining_amount ?? null,
      debtTotal: debt?.total_amount ?? null,
      debtPaid: debt?.paid_amount ?? null,
      saleItems: (s.sale_items || []).map((si: any) => 
        `${si.product_name} x${si.quantity}`
      ).join(', '),
      notes: s.notes,
    };
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 15. CREATE CUSTOMER (Standalone)
// ════════════════════════════════════════════════════════════════════════════

export async function createCustomer(data: {
  tenantId: string;
  fullName: string;
  phone: string;
  address?: string;
  passport?: string;
  notes?: string;
}) {
  const supabase = getSupabase();
  const normalizedPhone = normalizePhone(data.phone);
  
  if (!normalizedPhone) {
    throw new Error('Noto\'g\'ri telefon raqami');
  }

  const phoneHash = hashSensitive(normalizedPhone)!;

  // Check if exists
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', data.tenantId)
    .eq('phone_hash', phoneHash)
    .maybeSingle();

  if (existing) {
    throw new Error('Ushbu raqamli mijoz allaqachon mavjud');
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: data.tenantId,
      full_name: data.fullName,
      phone_hash: phoneHash,
      phone_last_four: normalizedPhone.slice(-4),
      address: data.address,
      passport_hash: data.passport ? hashSensitive(data.passport) : undefined,
      notes: data.notes,
      total_purchases: 0,
      total_debt: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return customer;
}

// ════════════════════════════════════════════════════════════════════════════
// 16. RECORD DEBT PAYMENT
// ════════════════════════════════════════════════════════════════════════════

export async function recordDebtPayment(data: {
  tenantId: string;
  debtId: string;
  amount: number;
  paymentMethod: string;
  cashierId: string;
  notes?: string;
}) {
  const supabase = getSupabase();

  // 1. Get debt info
  const { data: debt, error: debtError } = await supabase
    .from('debts')
    .select('id, customer_id, remaining_amount, paid_amount, total_amount')
    .eq('id', data.debtId)
    .eq('tenant_id', data.tenantId)
    .single();

  if (debtError || !debt) throw new Error('Qarz topilmadi');

  if (data.amount > Number(debt.remaining_amount)) {
    throw new Error('To\'lov summasi qolgan qarzdan ko\'p bo\'lishi mumkin emas');
  }

  // 2. Create payment record
  const prevRemaining = Number(debt.remaining_amount);
  const currentRemaining = Math.max(0, prevRemaining - data.amount);
  
  const historyNote = `[TIZIM] To'lovgacha qarz: ${formatSum(prevRemaining, false)} so'm. ` +
                     `To'landi: ${formatSum(data.amount, false)} so'm. ` +
                     `Qoldi: ${formatSum(currentRemaining, false)} so'm. ` +
                     (data.notes ? `\nIzoh: ${data.notes}` : '');

  const { data: payment, error: payError } = await supabase
    .from('payments')
    .insert({
      tenant_id: data.tenantId,
      debt_id: data.debtId,
      payment_type: 'debt_payment',
      amount: data.amount,
      method: data.paymentMethod,
      received_by: data.cashierId,
      notes: historyNote,
    })
    .select()
    .single();

  if (payError) throw payError;

  // 3. Update debt status
  const newPaidAmount = Number(debt.paid_amount) + data.amount;
  const newRemainingAmount = Math.max(0, Number(debt.remaining_amount) - data.amount);
  const newStatus = newRemainingAmount <= 0 ? 'paid' : 'active';

  const { error: updateDebtError } = await supabase
    .from('debts')
    .update({
      paid_amount: newPaidAmount,
      remaining_amount: newRemainingAmount,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.debtId);

  if (updateDebtError) throw updateDebtError;

  // 4. Update customer total debt
  const { data: customer } = await supabase
    .from('customers')
    .select('total_debt')
    .eq('id', debt.customer_id)
    .single();

  if (customer) {
    await supabase
      .from('customers')
      .update({
        total_debt: Math.max(0, Number(customer.total_debt) - data.amount),
      })
      .eq('id', debt.customer_id);
  }

  // 5. Update debt schedules (mark as paid)
  const { data: schedules } = await supabase
    .from('debt_schedules')
    .select('id, expected_amount, paid_amount')
    .eq('debt_id', data.debtId)
    .order('due_date', { ascending: true });

  if (schedules) {
    let remainingToApply = data.amount;
    for (const schedule of schedules) {
      if (remainingToApply <= 0) break;
      
      const unpaidInSchedule = Number(schedule.expected_amount) - Number(schedule.paid_amount || 0);
      if (unpaidInSchedule > 0) {
        const applyToThis = Math.min(remainingToApply, unpaidInSchedule);
        const totalPaidInSchedule = Number(schedule.paid_amount || 0) + applyToThis;
        const isFullyPaid = totalPaidInSchedule >= Number(schedule.expected_amount);
        
        await supabase
          .from('debt_schedules')
          .update({
            paid_amount: totalPaidInSchedule,
            paid_at: isFullyPaid ? new Date().toISOString() : null
          })
          .eq('id', schedule.id);
        
        remainingToApply -= applyToThis;
      }
    }
  }

  return payment;
}

// ════════════════════════════════════════════════════════════════════════════
// 17. CREATE BRANCH
// ════════════════════════════════════════════════════════════════════════════

export async function createBranch(data: {
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  type: string;
}) {
  const supabase = getSupabase();
  const { data: branch, error } = await supabase
    .from('branches')
    .insert({
      tenant_id: data.tenantId,
      name: data.name,
      address: data.address,
      phone: data.phone,
      type: data.type === 'Asosiy' ? 'main' : 'branch',
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return branch;
}

// ════════════════════════════════════════════════════════════════════════════
// 18. GET BRANCHES
// ════════════════════════════════════════════════════════════════════════════

export async function getBranches(tenantId: string) {
  const { data, error } = await getSupabase()
    .from('branches')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
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
    imei?: string;
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
  let cashierId = data.cashierId;

  // Validate UUID formats to prevent 22P02 error
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(cashierId)) {
    // If cashierId is not a UUID (it's likely a Better Auth string ID), 
    // we need to find the actual database user
    const { data: userData } = await supabase
      .from('users')
      .select('id, branch_id')
      .or(`id.eq.${cashierId},email.eq.${cashierId}`) // Try finding by ID or email
      .maybeSingle();

    if (userData) {
      cashierId = userData.id;
      if (!branchId || branchId === '00000000-0000-0000-0000-000000000000') {
        branchId = userData.branch_id;
      }
    }
  }

  if (!branchId || branchId === '00000000-0000-0000-0000-000000000000') {
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

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      tenant_id: data.tenantId,
      branch_id: branchId,
      cashier_id: cashierId,
      customer_id: customerId,
      subtotal: data.subtotal,
      total: data.total,
      payment_method: data.paymentMethod,
      paid_amount: data.paidAmount,
      debt_amount: data.debtAmount,
      notes: data.customerData?.imei ? `IMEI: ${data.customerData.imei}` : undefined,
      status: 'completed',
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // 3. Create sale items
  const itemsToInsert = data.items.map(item => ({
    tenant_id: data.tenantId,
    sale_id: sale.id,
    product_id: (item.productId && uuidRegex.test(item.productId)) ? item.productId : null,
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
      const months = Math.max(1, Number(data.debtMonths || 1));
      const debtAmount = Number(data.debtAmount);
      const monthlyPayment = Math.ceil(debtAmount / months);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      console.log(`[TIZIM] Qarz yaratilmoqda: Summa=${debtAmount}, Muddat=${months}, Oylik=${monthlyPayment}`);

      const { data: debt, error: debtError } = await supabase
        .from('debts')
        .insert({
          tenant_id: data.tenantId,
          customer_id: customerId,
          sale_id: sale.id,
          principal_amount: debtAmount,
          total_amount: debtAmount,
          total_months: months,
          monthly_payment: monthlyPayment,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          remaining_amount: debtAmount,
          paid_amount: 0,
          notes: data.customerData?.imei ? `IMEI: ${data.customerData.imei}` : undefined,
          status: 'active',
        })
        .select()
        .single();

      if (debtError) {
        console.error('[TIZIM] Debts insert error:', debtError);
        throw debtError;
      }

      // Create debt schedule
      const schedules = Array.from({ length: months }, (_, i) => {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        
        return {
          tenant_id: data.tenantId,
          debt_id: debt.id,
          installment_number: i + 1,
          due_date: dueDate.toISOString().split('T')[0],
          expected_amount: i === months - 1
            ? debtAmount - (monthlyPayment * (months - 1))
            : monthlyPayment,
          paid_amount: 0,
          is_overdue: false
        };
      });

      console.log(`[TIZIM] Grafik yaratilmoqda: ${schedules.length} ta oylik`);

      const { error: scheduleError } = await supabase
        .from('debt_schedules')
        .insert(schedules);

      if (scheduleError) {
        console.error('[TIZIM] Schedules insert error:', scheduleError);
        throw scheduleError;
      }

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

  // 5. Send Telegram Notification
  try {
    const { data: cashierData } = await supabase
      .from('users')
      .select('name')
      .eq('id', cashierId)
      .single();
      
    const { data: branchData } = await supabase
      .from('branches')
      .select('name')
      .eq('id', branchId)
      .single();

    const cashierName = cashierData?.name || 'Kassir';
    const branchNameStr = branchData?.name || 'Do\'kon';
    
    const message = formatSaleMessage(
      sale, 
      data.items, 
      cashierName, 
      branchNameStr, 
      data.customerData, 
      {
        debtMonths: data.debtMonths,
        paidAmount: data.paidAmount,
        debtAmount: data.debtAmount
      }
    );
    await sendTelegramAlert(data.tenantId, message);
  } catch (err) {
    console.error('[TIZIM] Telegram alert yuborishda xatolik:', err);
  }

  return {
    ...sale,
    items: data.items,
    customerName: data.customerData?.fullName || 'Mijoz',
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 19. SHIFT MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

export async function openShift(tenantId: string, cashierId: string, branchId: string, openingCash: number) {
  const supabase = getSupabase();
  
  // Check if already open
  const { data: existing } = await supabase
    .from('shifts')
    .select('*')
    .eq('cashier_id', cashierId)
    .eq('status', 'open')
    .maybeSingle();
    
  if (existing) {
    return existing; // Smena allaqachon ochiq bo'lsa, o'zini qaytaradi
  }

  // Get last shift number
  const { data: lastShift } = await supabase
    .from('shifts')
    .select('shift_number')
    .eq('tenant_id', tenantId)
    .order('shift_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const shiftNumber = lastShift ? Number(lastShift.shift_number) + 1 : 1;

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      tenant_id: tenantId,
      cashier_id: cashierId,
      branch_id: branchId,
      shift_number: shiftNumber,
      opening_cash: openingCash,
      status: 'open'
    })
    .select()
    .single();

  if (error) throw error;
  
  // Telegram notification
  try {
    const { data: cashier } = await supabase.from('users').select('name').eq('id', cashierId).single();
    const message = `🟢 <b>SMENA OCHILDI #${shiftNumber}</b>
━━━━━━━━━━━━━━━━━
👤 Kassir: ${cashier?.name || 'Kassir'}
💰 Kassa qoldig'i (boshlang'ich): ${formatSum(openingCash, false)} so'm
🕐 ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    await sendTelegramAlert(tenantId, message);
  } catch (e) {
    console.error('Telegram shift alert failed:', e);
  }

  return shift;
}

export async function closeShift(tenantId: string, shiftId: string, closingCash: number, expectedCash: number, closingNotes?: string) {
  const supabase = getSupabase();
  
  const cashDifference = closingCash - expectedCash;
  
  const { data: shift, error } = await supabase
    .from('shifts')
    .update({
      closing_cash: closingCash,
      expected_cash: expectedCash,
      cash_difference: cashDifference,
      closing_notes: closingNotes,
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    .eq('id', shiftId)
    .eq('tenant_id', tenantId)
    .select('*, users!shifts_cashier_id_fkey(name)')
    .single();

  if (error) throw error;
  
  // Telegram notification
  try {
    const cashierName = Array.isArray(shift.users) ? shift.users[0]?.name : shift.users?.name;
    const message = `🔴 <b>SMENA YOPILDI #${shift.shift_number}</b>
━━━━━━━━━━━━━━━━━
👤 Kassir: ${cashierName || 'Kassir'}
💰 Kassa qoldig'i (kutilgan): ${formatSum(expectedCash, false)} so'm
💰 Kassa qoldig'i (haqiqiy): ${formatSum(closingCash, false)} so'm
💰 Farq: ${formatSum(cashDifference, false)} so'm
🕐 ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}

📝 Izoh: ${closingNotes || '-'}`;
    await sendTelegramAlert(tenantId, message);
  } catch (e) {
    console.error('Telegram shift alert failed:', e);
  }

  return shift;
}


