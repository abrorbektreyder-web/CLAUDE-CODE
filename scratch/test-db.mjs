
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    console.log('Connecting to:', process.env.DATABASE_URL);
    const result = await sql`SELECT 1`;
    console.log('Success:', result);
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    await sql.end();
  }
}

test();
