const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const connectionString = 'postgresql://postgres:SyncHR54102099@db.gmkrqshscvxxmocqdokk.supabase.co:5432/postgres';
  
  console.log('Tentando conectar ao PostgreSQL do Supabase...');
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Conectado com sucesso!');

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Lendo o arquivo de schema: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executando DDL no Supabase...');
    await client.query(sql);
    console.log('Tabelas criadas com sucesso!');

    const seedPath = path.join(__dirname, 'seed-data.sql');
    if (fs.existsSync(seedPath)) {
      console.log(`Lendo o arquivo de seed: ${seedPath}`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      console.log('Executando seed data no Supabase...');
      await client.query(seedSql);
      console.log('Dados de seed carregados com sucesso!');
    }

    // Let's check if tables exist
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tabelas existentes no schema public:');
    res.rows.forEach(row => console.log(` - ${row.table_name}`));

  } catch (err) {
    console.error('Erro durante a execução do setup:', err);
  } finally {
    await client.end();
    console.log('Conexão encerrada.');
  }
}

run();
