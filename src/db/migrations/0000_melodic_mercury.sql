CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'view', 'login', 'logout', 'login_failed', 'export', 'import', 'restore', 'refund', 'discount_apply', 'price_change', 'shift_open', 'shift_close', 'cash_count', 'permission_grant', 'permission_revoke', 'data_decrypt');--> statement-breakpoint
CREATE TYPE "public"."debt_status" AS ENUM('active', 'overdue', 'paid', 'defaulted', 'restructured');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('incoming', 'outgoing', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'defect');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('telegram', 'sms', 'email', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('sale_made', 'daily_report', 'low_stock', 'debt_reminder', 'debt_overdue', 'warranty_expiring', 'shift_anomaly', 'large_refund_request', 'new_login_alert', 'system_alert');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'transfer', 'credit', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('sale', 'debt_payment', 'refund');--> statement-breakpoint
CREATE TYPE "public"."phone_condition" AS ENUM('new', 'opened', 'used', 'demo', 'refurbished');--> statement-breakpoint
CREATE TYPE "public"."phone_status" AS ENUM('in_stock', 'reserved', 'sold', 'returned', 'defective', 'transferred', 'demo_active', 'lost');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('free', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('draft', 'completed', 'partially_refunded', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('open', 'closed', 'forced_closed');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'cancelled', 'trial');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'tenant_owner', 'admin', 'manager', 'accountant', 'warehouse', 'cashier');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20),
	"address" text,
	"phone" varchar(20),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"is_main" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"opens_at" time DEFAULT '09:00',
	"closes_at" time DEFAULT '21:00',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subdomain" "citext" NOT NULL,
	"business_name" varchar(150) NOT NULL,
	"business_type" varchar(50) DEFAULT 'mobile_retail',
	"legal_name" varchar(200),
	"inn" varchar(20),
	"owner_email" "citext" NOT NULL,
	"owner_phone" varchar(20),
	"address" text,
	"country" varchar(2) DEFAULT 'UZ',
	"timezone" varchar(50) DEFAULT 'Asia/Tashkent',
	"currency" varchar(3) DEFAULT 'UZS',
	"locale" varchar(10) DEFAULT 'uz-UZ',
	"plan" "plan_tier" DEFAULT 'free' NOT NULL,
	"status" "tenant_status" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp with time zone DEFAULT NOW() + INTERVAL '14 days',
	"subscription_starts_at" timestamp with time zone,
	"subscription_ends_at" timestamp with time zone,
	"max_users" integer DEFAULT 2 NOT NULL,
	"max_branches" integer DEFAULT 1 NOT NULL,
	"max_products" integer DEFAULT 100 NOT NULL,
	"settings" jsonb DEFAULT '{"default_warranty_months":12,"default_credit_interest":3,"max_credit_months":12,"min_down_payment_percent":30,"low_stock_threshold":5,"fiscal_module_enabled":false,"trade_in_enabled":false}'::jsonb NOT NULL,
	"logo_url" text,
	"brand_color" varchar(7) DEFAULT '#FF6B35',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "valid_subdomain" CHECK (subdomain ~ '^[a-z0-9-]{3,30}$' AND subdomain NOT IN ('www', 'api', 'admin', 'app', 'dashboard'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"device_fingerprint" varchar(255),
	"device_name" varchar(100),
	"ip_address" "inet",
	"user_agent" text,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoke_reason" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" "citext",
	"phone" varchar(20) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"avatar_url" text,
	"password_hash" text,
	"pin_hash" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"recovery_codes" text[],
	"role" "user_role" NOT NULL,
	"branch_id" uuid,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_until" timestamp with time zone,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp with time zone,
	"last_login_ip" "inet",
	"last_login_user_agent" text,
	"last_active_at" timestamp with time zone,
	"allowed_devices" jsonb DEFAULT '[]'::jsonb,
	"telegram_chat_id" bigint,
	"telegram_username" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "email_or_phone" CHECK (email IS NOT NULL OR phone IS NOT NULL),
	CONSTRAINT "auth_method" CHECK ((role IN ('cashier') AND pin_hash IS NOT NULL) OR (role NOT IN ('cashier') AND password_hash IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"type" varchar(20) DEFAULT 'accessory' NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"supplier_id" uuid,
	"imei_encrypted" "bytea" NOT NULL,
	"imei_hash" varchar(64) NOT NULL,
	"serial_number_encrypted" "bytea",
	"serial_number_hash" varchar(64),
	"imei_last_four" varchar(4),
	"color" varchar(50),
	"storage_gb" integer,
	"ram_gb" integer,
	"condition" "phone_condition" DEFAULT 'new' NOT NULL,
	"battery_health" integer,
	"warranty_months" integer DEFAULT 12 NOT NULL,
	"warranty_start_date" date,
	"warranty_end_date" date,
	"cost_price" numeric(15, 2) NOT NULL,
	"retail_price" numeric(15, 2),
	"status" "phone_status" DEFAULT 'in_stock' NOT NULL,
	"reserved_until" timestamp with time zone,
	"reserved_for_customer_id" uuid,
	"sold_at" timestamp with time zone,
	"sold_to_customer_id" uuid,
	"sold_in_sale_id" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_document" varchar(100),
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"barcode" varchar(50),
	"color" varchar(50),
	"size" varchar(50),
	"material" varchar(50),
	"generation" varchar(20),
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"cost_price" numeric(15, 2),
	"retail_price" numeric(15, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid,
	"sku" varchar(50) NOT NULL,
	"barcode" varchar(50),
	"name" varchar(200) NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"description" text,
	"product_type" varchar(20) DEFAULT 'accessory' NOT NULL,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"cost_price" numeric(15, 2) NOT NULL,
	"retail_price" numeric(15, 2) NOT NULL,
	"wholesale_price" numeric(15, 2),
	"min_price" numeric(15, 2),
	"warranty_months" integer DEFAULT 12 NOT NULL,
	"min_stock" integer DEFAULT 5 NOT NULL,
	"image_url" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"compatible_models" jsonb DEFAULT '[]'::jsonb,
	"is_original" boolean,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"search_vector" "tsvector",
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "valid_prices" CHECK (cost_price >= 0 AND retail_price >= cost_price AND (min_price IS NULL OR min_price >= cost_price))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"min_stock" integer,
	"max_stock" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quantity_non_negative" CHECK (quantity >= 0),
	CONSTRAINT "reserved_lte_quantity" CHECK (reserved_quantity <= quantity)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"contact_person" varchar(150),
	"phone" varchar(20),
	"email" "citext",
	"address" text,
	"inn" varchar(20),
	"payment_terms_days" integer DEFAULT 0,
	"credit_limit" numeric(15, 2),
	"current_balance" numeric(15, 2) DEFAULT '0',
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"phone_encrypted" "bytea",
	"phone_hash" varchar(64) NOT NULL,
	"phone_last_four" varchar(4),
	"secondary_phone_encrypted" "bytea",
	"secondary_phone_hash" varchar(64),
	"passport_encrypted" "bytea",
	"passport_hash" varchar(64),
	"passport_last_four" varchar(4),
	"birth_date" date,
	"address" text,
	"email" "citext",
	"telegram_chat_id" bigint,
	"telegram_username" varchar(50),
	"total_purchases" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_debt" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_paid" numeric(15, 2) DEFAULT '0' NOT NULL,
	"purchase_count" integer DEFAULT 0 NOT NULL,
	"credit_score" integer DEFAULT 50 NOT NULL,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"blacklist_reason" text,
	"tags" text[],
	"notes" text,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "credit_score_range" CHECK (credit_score BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid,
	"phone_unit_id" uuid,
	"variant_id" uuid,
	"product_name" varchar(200) NOT NULL,
	"product_sku" varchar(50),
	"imei_last_four" varchar(4),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"cost_price" numeric(15, 2) NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"warranty_months" integer,
	"warranty_until" date,
	"refunded_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positive_quantity" CHECK (quantity > 0),
	CONSTRAINT "refund_lte_quantity" CHECK (refunded_quantity <= quantity)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"cashier_id" uuid NOT NULL,
	"shift_id" uuid,
	"customer_id" uuid,
	"receipt_number" bigserial,
	"idempotency_key" uuid,
	"subtotal" numeric(15, 2) NOT NULL,
	"discount_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"discount_percent" numeric(5, 2),
	"discount_reason" text,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"debt_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"change_due" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" "sale_status" DEFAULT 'completed' NOT NULL,
	"refunded_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"refunded_at" timestamp with time zone,
	"refunded_by" uuid,
	"refund_reason" text,
	"original_sale_id" uuid,
	"printed_at" timestamp with time zone,
	"print_count" integer DEFAULT 0 NOT NULL,
	"notification_sent_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "valid_total" CHECK (total = subtotal - discount_amount + tax_amount),
	CONSTRAINT "valid_payment" CHECK (paid_amount + debt_amount >= total)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cashier_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"shift_number" integer NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"opening_cash" numeric(15, 2) DEFAULT '0' NOT NULL,
	"expected_cash" numeric(15, 2),
	"closing_cash" numeric(15, 2),
	"cash_difference" numeric(15, 2),
	"total_sales_count" integer DEFAULT 0 NOT NULL,
	"total_sales_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_refunds_count" integer DEFAULT 0 NOT NULL,
	"total_refunds_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"closing_notes" text,
	"status" "shift_status" DEFAULT 'open' NOT NULL,
	"opened_ip" "inet",
	"closed_ip" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suspended_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cashier_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid,
	"cart_data" jsonb NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"label" varchar(100),
	"expires_at" timestamp with time zone DEFAULT NOW() + INTERVAL '24 hours' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "debt_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"debt_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"expected_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"paid_at" timestamp with time zone,
	"is_overdue" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"principal_amount" numeric(15, 2) NOT NULL,
	"interest_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"total_interest" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_months" integer NOT NULL,
	"monthly_payment" numeric(15, 2) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"remaining_amount" numeric(15, 2) NOT NULL,
	"next_payment_date" date,
	"next_payment_amount" numeric(15, 2),
	"payments_made" integer DEFAULT 0 NOT NULL,
	"payments_overdue" integer DEFAULT 0 NOT NULL,
	"status" "debt_status" DEFAULT 'active' NOT NULL,
	"is_overdue" boolean DEFAULT false NOT NULL,
	"overdue_days" integer DEFAULT 0 NOT NULL,
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"last_reminder_at" timestamp with time zone,
	"last_reminder_channel" "notification_channel",
	"paid_in_full_at" timestamp with time zone,
	"defaulted_at" timestamp with time zone,
	"default_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positive_months" CHECK (total_months > 0),
	CONSTRAINT "valid_debt_amounts" CHECK (paid_amount >= 0 AND paid_amount <= total_amount AND remaining_amount = total_amount - paid_amount)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"sale_id" uuid,
	"debt_id" uuid,
	"refund_for_sale_id" uuid,
	"method" "payment_method" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"card_last_four" varchar(4),
	"transaction_reference" varchar(100),
	"received_by" uuid NOT NULL,
	"shift_id" uuid,
	"branch_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "positive_amount" CHECK (amount > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"changes" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"session_id" uuid,
	"request_id" uuid,
	"severity" varchar(10) DEFAULT 'info' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"recipient_user_id" uuid,
	"recipient_customer_id" uuid,
	"recipient_address" varchar(200),
	"subject" varchar(200),
	"message" text NOT NULL,
	"payload" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"invoice_number" varchar(50),
	"subtotal" numeric(15, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total" numeric(15, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"ordered_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"received_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"movement_type" "movement_type" NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"phone_unit_id" uuid,
	"from_branch_id" uuid,
	"to_branch_id" uuid,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(15, 2),
	"reference_type" varchar(50),
	"reference_id" uuid,
	"document_number" varchar(100),
	"reason" text,
	"notes" text,
	"performed_by" uuid NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "warranty_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phone_unit_id" uuid,
	"sale_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"issue_description" text NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolution" varchar(50),
	"resolution_notes" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_by" uuid,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branches" ADD CONSTRAINT "branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_units" ADD CONSTRAINT "phone_units_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_units" ADD CONSTRAINT "phone_units_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_units" ADD CONSTRAINT "phone_units_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone_units" ADD CONSTRAINT "phone_units_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_phone_unit_id_phone_units_id_fk" FOREIGN KEY ("phone_unit_id") REFERENCES "public"."phone_units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales" ADD CONSTRAINT "sales_refunded_by_users_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suspended_sales" ADD CONSTRAINT "suspended_sales_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suspended_sales" ADD CONSTRAINT "suspended_sales_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suspended_sales" ADD CONSTRAINT "suspended_sales_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suspended_sales" ADD CONSTRAINT "suspended_sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debt_schedules" ADD CONSTRAINT "debt_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debt_schedules" ADD CONSTRAINT "debt_schedules_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debts" ADD CONSTRAINT "debts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debts" ADD CONSTRAINT "debts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debts" ADD CONSTRAINT "debts_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_refund_for_sale_id_sales_id_fk" FOREIGN KEY ("refund_for_sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_customer_id_customers_id_fk" FOREIGN KEY ("recipient_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_phone_unit_id_phone_units_id_fk" FOREIGN KEY ("phone_unit_id") REFERENCES "public"."phone_units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_branch_id_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_branch_id_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_phone_unit_id_phone_units_id_fk" FOREIGN KEY ("phone_unit_id") REFERENCES "public"."phone_units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_branches_tenant" ON "branches" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_branches_active" ON "branches" USING btree ("tenant_id","is_active") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_branches_code_unique" ON "branches" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_branches_one_main" ON "branches" USING btree ("tenant_id") WHERE is_main = TRUE AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tenants_subdomain" ON "tenants" USING btree ("subdomain") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tenants_status" ON "tenants" USING btree ("status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tenants_owner_email" ON "tenants" USING btree ("owner_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "sessions" USING btree ("user_id") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_token" ON "sessions" USING btree ("token_hash") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_expired" ON "sessions" USING btree ("expires_at") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_tenant" ON "users" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree (LOWER("email")) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_phone" ON "users" USING btree ("phone") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role_branch" ON "users" USING btree ("tenant_id","role","branch_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_phone_unique" ON "users" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email_unique" ON "users" USING btree ("tenant_id","email") WHERE email IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_categories_tenant" ON "categories" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_categories_parent" ON "categories" USING btree ("parent_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phone_units_tenant" ON "phone_units" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_phone_units_imei_hash" ON "phone_units" USING btree ("tenant_id","imei_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phone_units_serial_hash" ON "phone_units" USING btree ("tenant_id","serial_number_hash") WHERE serial_number_hash IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phone_units_product" ON "phone_units" USING btree ("product_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phone_units_status" ON "phone_units" USING btree ("tenant_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phone_units_branch" ON "phone_units" USING btree ("branch_id","status") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phone_units_warranty_end" ON "phone_units" USING btree ("tenant_id","warranty_end_date") WHERE status = 'sold' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variants_tenant" ON "product_variants" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variants_product" ON "product_variants" USING btree ("product_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_variants_sku" ON "product_variants" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variants_barcode" ON "product_variants" USING btree ("tenant_id","barcode") WHERE barcode IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_tenant" ON "products" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_products_sku" ON "products" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_barcode" ON "products" USING btree ("tenant_id","barcode") WHERE barcode IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" USING btree ("category_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_type" ON "products" USING btree ("tenant_id","product_type") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_search" ON "products" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_stock_variant_branch" ON "stock_levels" USING btree ("variant_id","branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_tenant" ON "stock_levels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_branch" ON "stock_levels" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_low" ON "stock_levels" USING btree ("tenant_id","branch_id") WHERE quantity <= 5;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_suppliers_tenant" ON "suppliers" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_tenant" ON "customers" USING btree ("tenant_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_customers_phone_hash" ON "customers" USING btree ("tenant_id","phone_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_passport_hash" ON "customers" USING btree ("tenant_id","passport_hash") WHERE passport_hash IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_telegram" ON "customers" USING btree ("telegram_chat_id") WHERE telegram_chat_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customers_blacklist" ON "customers" USING btree ("tenant_id") WHERE is_blacklisted = TRUE AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sale_items_sale" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sale_items_product" ON "sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sale_items_phone" ON "sale_items" USING btree ("phone_unit_id") WHERE phone_unit_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sale_items_variant" ON "sale_items" USING btree ("variant_id") WHERE variant_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sale_items_tenant" ON "sale_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_tenant" ON "sales" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_receipt" ON "sales" USING btree ("tenant_id","receipt_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_branch_date" ON "sales" USING btree ("branch_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_cashier_date" ON "sales" USING btree ("cashier_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_customer" ON "sales" USING btree ("customer_id") WHERE customer_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_shift" ON "sales" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_status" ON "sales" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_date" ON "sales" USING btree ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sales_idempotency" ON "sales" USING btree ("idempotency_key") WHERE idempotency_key IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_shifts_number" ON "shifts" USING btree ("tenant_id","shift_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_tenant" ON "shifts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_cashier" ON "shifts" USING btree ("cashier_id","opened_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_branch" ON "shifts" USING btree ("branch_id","opened_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shifts_open" ON "shifts" USING btree ("tenant_id","status") WHERE status = 'open';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_shifts_one_open_per_cashier" ON "shifts" USING btree ("cashier_id") WHERE status = 'open';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_suspended_tenant" ON "suspended_sales" USING btree ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_suspended_cashier" ON "suspended_sales" USING btree ("cashier_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_suspended_expires" ON "suspended_sales" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_schedules_unique" ON "debt_schedules" USING btree ("debt_id","installment_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedules_debt" ON "debt_schedules" USING btree ("debt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedules_due" ON "debt_schedules" USING btree ("tenant_id","due_date") WHERE paid_amount < expected_amount;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_debts_tenant" ON "debts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_debts_customer" ON "debts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_debts_status" ON "debts" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_debts_overdue" ON "debts" USING btree ("tenant_id","is_overdue") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_debts_next_payment" ON "debts" USING btree ("tenant_id","next_payment_date") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_tenant" ON "payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_sale" ON "payments" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_debt" ON "payments" USING btree ("debt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_shift" ON "payments" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payments_date" ON "payments" USING btree ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_tenant_date" ON "audit_logs" USING btree ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "audit_logs" USING btree ("user_id","created_at" DESC) WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_action" ON "audit_logs" USING btree ("tenant_id","action","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_severity" ON "audit_logs" USING btree ("tenant_id","severity","created_at" DESC) WHERE severity != 'info';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_tenant" ON "notifications" USING btree ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_pending" ON "notifications" USING btree ("status","created_at") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications" USING btree ("recipient_user_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_customer" ON "notifications" USING btree ("recipient_customer_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_reference" ON "notifications" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_po_number" ON "purchase_orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_tenant" ON "purchase_orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_po_status" ON "purchase_orders" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movements_tenant" ON "stock_movements" USING btree ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movements_product" ON "stock_movements" USING btree ("product_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movements_variant" ON "stock_movements" USING btree ("variant_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movements_phone" ON "stock_movements" USING btree ("phone_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movements_branch" ON "stock_movements" USING btree ("from_branch_id","to_branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movements_reference" ON "stock_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_warranty_claim_number" ON "warranty_claims" USING btree ("tenant_id","claim_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warranty_tenant" ON "warranty_claims" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warranty_phone" ON "warranty_claims" USING btree ("phone_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_warranty_status" ON "warranty_claims" USING btree ("tenant_id","status");