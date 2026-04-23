import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  date,
  customType,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { citext, bytea, tsvector } from '../lib/custom-types';
import {
  idColumn,
  timestamps,
  softDelete,
  phoneCondition,
  phoneStatus,
} from './_shared';
import { tenants, branches } from './tenants';

// ════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

export const categories = pgTable(
  'categories',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),

    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull().default('accessory'),
    icon: varchar('icon', { length: 50 }),
    color: varchar('color', { length: 7 }),
    sortOrder: integer('sort_order').notNull().default(0),

    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_categories_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
    parentIdx: index('idx_categories_parent')
      .on(table.parentId)
      .where(sql`deleted_at IS NULL`),
    slugUnique: uniqueIndex('idx_categories_slug').on(table.tenantId, table.slug),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ════════════════════════════════════════════════════════════════════════════

export const suppliers = pgTable(
  'suppliers',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 150 }).notNull(),
    contactPerson: varchar('contact_person', { length: 150 }),
    phone: varchar('phone', { length: 20 }),
    email: citext('email'),
    address: text('address'),
    inn: varchar('inn', { length: 20 }),

    paymentTermsDays: integer('payment_terms_days').default(0),
    creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
    currentBalance: decimal('current_balance', { precision: 15, scale: 2 }).default('0'),

    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_suppliers_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTS — General product catalog
// ════════════════════════════════════════════════════════════════════════════

export const products = pgTable(
  'products',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id),

    // Identification
    sku: varchar('sku', { length: 50 }).notNull(),
    barcode: varchar('barcode', { length: 50 }),

    // Product info
    name: varchar('name', { length: 200 }).notNull(),
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 100 }),
    description: text('description'),

    // Type & specs
    productType: varchar('product_type', { length: 20 }).notNull().default('accessory'),
    specifications: jsonb('specifications').default({}),

    // Pricing (RLS-protected)
    costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull(),
    retailPrice: decimal('retail_price', { precision: 15, scale: 2 }).notNull(),
    wholesalePrice: decimal('wholesale_price', { precision: 15, scale: 2 }),
    minPrice: decimal('min_price', { precision: 15, scale: 2 }),

    // Warranty
    warrantyMonths: integer('warranty_months').notNull().default(12),

    // Stock control
    minStock: integer('min_stock').notNull().default(5),

    // Media
    imageUrl: text('image_url'),
    images: jsonb('images').default([]),

    // Compatibility
    compatibleModels: jsonb('compatible_models').default([]),
    isOriginal: boolean('is_original'),

    // Status
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),

    // Search
    searchVector: tsvector('search_vector'),

    // Versioning
    version: integer('version').notNull().default(1),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_products_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
    skuUnique: uniqueIndex('idx_products_sku').on(table.tenantId, table.sku),
    barcodeIdx: index('idx_products_barcode')
      .on(table.tenantId, table.barcode)
      .where(sql`barcode IS NOT NULL AND deleted_at IS NULL`),
    categoryIdx: index('idx_products_category')
      .on(table.categoryId)
      .where(sql`deleted_at IS NULL`),
    typeIdx: index('idx_products_type')
      .on(table.tenantId, table.productType)
      .where(sql`deleted_at IS NULL`),
    searchIdx: index('idx_products_search').using('gin', table.searchVector),

    pricesCheck: check(
      'valid_prices',
      sql`cost_price >= 0 AND retail_price >= cost_price AND (min_price IS NULL OR min_price >= cost_price)`
    ),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// PHONE_UNITS — Each phone is a separate unit (IMEI-based)
// ════════════════════════════════════════════════════════════════════════════

export const phoneUnits = pgTable(
  'phone_units',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),

    // Identification (ENCRYPTED)
    imeiEncrypted: bytea('imei_encrypted').notNull(),
    imeiHash: varchar('imei_hash', { length: 64 }).notNull(),
    serialNumberEncrypted: bytea('serial_number_encrypted'),
    serialNumberHash: varchar('serial_number_hash', { length: 64 }),
    imeiLastFour: varchar('imei_last_four', { length: 4 }),

    // Specifications
    color: varchar('color', { length: 50 }),
    storageGb: integer('storage_gb'),
    ramGb: integer('ram_gb'),
    condition: phoneCondition('condition').notNull().default('new'),
    batteryHealth: integer('battery_health'),

    // Warranty
    warrantyMonths: integer('warranty_months').notNull().default(12),
    warrantyStartDate: date('warranty_start_date'),
    warrantyEndDate: date('warranty_end_date'),

    // Pricing
    costPrice: decimal('cost_price', { precision: 15, scale: 2 }).notNull(),
    retailPrice: decimal('retail_price', { precision: 15, scale: 2 }),

    // Status
    status: phoneStatus('status').notNull().default('in_stock'),
    reservedUntil: timestamp('reserved_until', { withTimezone: true }),
    reservedForCustomerId: uuid('reserved_for_customer_id'),

    // Sale info
    soldAt: timestamp('sold_at', { withTimezone: true }),
    soldToCustomerId: uuid('sold_to_customer_id'),
    soldInSaleId: uuid('sold_in_sale_id'),

    // Sourcing
    receivedAt: timestamp('received_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    receivedDocument: varchar('received_document', { length: 100 }),

    notes: text('notes'),
    version: integer('version').notNull().default(1),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_phone_units_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
    imeiHashUnique: uniqueIndex('idx_phone_units_imei_hash').on(
      table.tenantId,
      table.imeiHash
    ),
    serialHashIdx: index('idx_phone_units_serial_hash')
      .on(table.tenantId, table.serialNumberHash)
      .where(sql`serial_number_hash IS NOT NULL AND deleted_at IS NULL`),
    productIdx: index('idx_phone_units_product')
      .on(table.productId)
      .where(sql`deleted_at IS NULL`),
    statusIdx: index('idx_phone_units_status')
      .on(table.tenantId, table.status)
      .where(sql`deleted_at IS NULL`),
    branchStatusIdx: index('idx_phone_units_branch')
      .on(table.branchId, table.status)
      .where(sql`deleted_at IS NULL`),
    warrantyIdx: index('idx_phone_units_warranty_end')
      .on(table.tenantId, table.warrantyEndDate)
      .where(sql`status = 'sold' AND deleted_at IS NULL`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// PRODUCT_VARIANTS — For accessories with color/size variations
// ════════════════════════════════════════════════════════════════════════════

export const productVariants = pgTable(
  'product_variants',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    sku: varchar('sku', { length: 50 }).notNull(),
    barcode: varchar('barcode', { length: 50 }),

    // Variant attributes
    color: varchar('color', { length: 50 }),
    size: varchar('size', { length: 50 }),
    material: varchar('material', { length: 50 }),
    generation: varchar('generation', { length: 20 }),
    attributes: jsonb('attributes').default({}),

    // Pricing override
    costPrice: decimal('cost_price', { precision: 15, scale: 2 }),
    retailPrice: decimal('retail_price', { precision: 15, scale: 2 }),

    isActive: boolean('is_active').notNull().default(true),

    ...timestamps,
    ...softDelete,
  },
  (table) => ({
    tenantIdx: index('idx_variants_tenant')
      .on(table.tenantId)
      .where(sql`deleted_at IS NULL`),
    productIdx: index('idx_variants_product')
      .on(table.productId)
      .where(sql`deleted_at IS NULL`),
    skuUnique: uniqueIndex('idx_variants_sku').on(table.tenantId, table.sku),
    barcodeIdx: index('idx_variants_barcode')
      .on(table.tenantId, table.barcode)
      .where(sql`barcode IS NOT NULL AND deleted_at IS NULL`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// STOCK_LEVELS — Quantity per variant per branch
// ════════════════════════════════════════════════════════════════════════════

export const stockLevels = pgTable(
  'stock_levels',
  {
    id: idColumn,
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),

    quantity: integer('quantity').notNull().default(0),
    reservedQuantity: integer('reserved_quantity').notNull().default(0),
    // available_quantity is GENERATED column — read-only, computed by DB

    minStock: integer('min_stock'),
    maxStock: integer('max_stock'),

    version: integer('version').notNull().default(1),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    variantBranchUnique: uniqueIndex('idx_stock_variant_branch').on(
      table.variantId,
      table.branchId
    ),
    tenantIdx: index('idx_stock_tenant').on(table.tenantId),
    branchIdx: index('idx_stock_branch').on(table.branchId),
    lowIdx: index('idx_stock_low')
      .on(table.tenantId, table.branchId)
      .where(sql`quantity <= 5`),

    quantityCheck: check('quantity_non_negative', sql`quantity >= 0`),
    reservedCheck: check('reserved_lte_quantity', sql`reserved_quantity <= quantity`),
  })
);

// ════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type PhoneUnit = typeof phoneUnits.$inferSelect;
export type NewPhoneUnit = typeof phoneUnits.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type StockLevel = typeof stockLevels.$inferSelect;
export type NewStockLevel = typeof stockLevels.$inferInsert;

// Safe types (without cost_price) — for cashier views
export type SafeProduct = Omit<Product, 'costPrice' | 'wholesalePrice'>;
export type SafePhoneUnit = Omit<PhoneUnit, 'costPrice'>;
