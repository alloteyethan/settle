const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const val = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL;

async function runMigration() {
  console.log('--- Supabase Migration Runner ---');
  if (!dbUrl) {
    console.warn('\n⚠️ DATABASE_URL is not set in .env.local.');
    console.log('To run migrations directly against your Supabase database:');
    console.log('1. Copy your Postgres connection string from Supabase Dashboard:');
    console.log('   Settings -> Database -> Connection string (URI)');
    console.log('2. Add it to .env.local:');
    console.log('   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"\n');
    console.log('Or apply the migration file directly via Supabase Dashboard SQL Editor:');
    console.log('   supabase/migrations/20260729000000_init_schema.sql');
    return;
  }

  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260729000000_init_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Executing migration on Supabase PostgreSQL...');
    await pool.query(sql);
    console.log('✅ Migration applied successfully!');

    const sellerCheck = await pool.query('SELECT count(*) FROM sellers');
    if (parseInt(sellerCheck.rows[0].count, 10) === 0) {
      console.log('Seeding initial sellers...');
      await pool.query(`
        INSERT INTO sellers (name, email, phone, password_hash, wallet_address, total_earnings)
        VALUES 
          ('Kwame Mensah', 'kwame@example.com', '+233540001122', 'cGFzc3dvcmQxMjNzZXR0bGVfc2FsdF8yMDI0', '0241234567 (MTN MoMo)', 1250.00),
          ('Abena Osei', 'abena@example.com', '+233200003344', 'cGFzc3dvcmQxMjNzZXR0bGVfc2FsdF8yMDI0', '0209876543 (Telecel Cash)', 840.00)
        ON CONFLICT DO NOTHING;
      `);
      console.log('✅ Seed data inserted successfully!');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
