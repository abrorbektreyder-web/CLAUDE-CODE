
import postgres from 'postgres';

async function runMigration() {
  const url = process.env.DIRECT_DATABASE_URL;
  if (!url) {
    console.error('DIRECT_DATABASE_URL not found');
    return;
  }

  const sqlCode = `
    CREATE TABLE IF NOT EXISTS expense_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50) DEFAULT 'operating',
      description TEXT,
      icon VARCHAR(50),
      color VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      category_id UUID REFERENCES expense_categories(id),
      amount DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      expense_date DATE DEFAULT CURRENT_DATE,
      description TEXT,
      created_by UUID NOT NULL,
      branch_id UUID,
      shift_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const tryUrl = async (dbUrl: string, label: string) => {
    console.log(`Trying to connect via ${label}...`);
    const sql = postgres(dbUrl, { ssl: 'require', connect_timeout: 15 });
    try {
      await sql.unsafe(sqlCode);
      console.log(`SUCCESS: Tables created via ${label}`);
      return true;
    } catch (err) {
      console.error(`FAILED: ${label} - ${err.message}`);
      return false;
    } finally {
      await sql.end();
    }
  };

  const success = await tryUrl(url, 'Port 5432');
  if (!success) {
    const altUrl = url.replace(':5432', ':6543');
    if (altUrl !== url) {
      await tryUrl(altUrl, 'Port 6543 (Pooling)');
    } else {
      console.log('No alternative port found in URL.');
    }
  }
}

runMigration();
