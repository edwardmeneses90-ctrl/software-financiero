const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables desde .env.local
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABLES = ['transactions', 'categories', 'weekly_targets', 'checklist_items', 'users'];
const BACKUP_DIR = path.join(__dirname, '../backups');

async function backup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  console.log('📦 Iniciando backup automático...\n');
  
  for (const table of TABLES) {
    console.log(`  ⏳ Exportando ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    
    if (error) {
      console.error(`  ❌ Error en ${table}:`, error.message);
      continue;
    }
    
    const filePath = path.join(BACKUP_DIR, `${timestamp}_${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ✅ Guardado: ${filePath.replace(process.cwd() + '/', '')} (${data.length} registros)`);
  }
  
  console.log('\n🎉 Backup completado correctamente.');
}

backup();