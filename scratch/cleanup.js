const pg = require('pg');
const connectionString = "postgresql://postgres:SyncHR54102099@db.gmkrqshscvxxmocqdokk.supabase.co:5432/postgres";

async function run() {
  try {
    const client = new pg.Client({ connectionString });
    await client.connect();
    console.log('Conectado. Deletando mariana.souza@clearit.com.br da tabela public.profiles...');
    const res = await client.query("DELETE FROM public.profiles WHERE email = 'mariana.souza@clearit.com.br';");
    console.log('Registros deletados:', res.rowCount);
    await client.end();
    console.log('Limpeza de banco concluída!');
  } catch (err) {
    console.error('Erro na limpeza:', err);
  }
}
run();
