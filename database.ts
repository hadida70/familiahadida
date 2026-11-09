import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import {
  AppData,
  CustomList,
  GroceryItem,
  Member,
  PersonalRecord,
  DataCategory,
  PushNotification,
  CalendarTask,
  Contact,
  TodoItem,
  PasswordItem,
} from './src/types.ts';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'database.sqlite');
const LEGACY_JSON_FILE = process.env.DB_FILE || path.join(process.cwd(), 'groceries_db.json');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const DEFAULT_PIN = '1474';

// Ensure directories exist
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// Optimize SQLite for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function convertJpegBufferToPdfBuffer(jpegBuf: Buffer): Buffer {
  // If already a PDF, return as-is
  if (
    jpegBuf.length > 4 &&
    jpegBuf[0] === 0x25 &&
    jpegBuf[1] === 0x50 &&
    jpegBuf[2] === 0x44 &&
    jpegBuf[3] === 0x46
  ) {
    return jpegBuf;
  }

  let width = 800;
  let height = 600;
  let bits = 8;
  let components = 3;

  if (jpegBuf.length > 4 && jpegBuf[0] === 0xff && jpegBuf[1] === 0xd8) {
    let pos = 2;
    while (pos + 4 < jpegBuf.length) {
      if (jpegBuf[pos] !== 0xff) {
        pos++;
        continue;
      }
      while (pos < jpegBuf.length && jpegBuf[pos] === 0xff) {
        pos++;
      }
      if (pos >= jpegBuf.length) break;
      const marker = jpegBuf[pos];
      pos++;

      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        continue;
      }
      if (pos + 2 > jpegBuf.length) break;
      const segLen = jpegBuf.readUInt16BE(pos);
      if (segLen < 2 || pos + segLen > jpegBuf.length) break;

      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc9 ||
        marker === 0xca
      ) {
        if (pos + 7 < jpegBuf.length) {
          bits = jpegBuf[pos + 2] || 8;
          height = jpegBuf.readUInt16BE(pos + 3) || 600;
          width = jpegBuf.readUInt16BE(pos + 5) || 800;
          components = jpegBuf[pos + 7] || 3;
          break;
        }
      }
      pos += segLen;
    }
  }

  const colorSpace =
    components === 1 ? '/DeviceGray' : components === 4 ? '/DeviceCMYK' : '/DeviceRGB';

  const maxPagePt = 792;
  const scale = maxPagePt / Math.max(width, height, 1);
  const pageW = Math.max(72, Number((width * scale).toFixed(2)));
  const pageH = Math.max(72, Number((height * scale).toFixed(2)));

  const chunks: Buffer[] = [];
  let offset = 0;
  const offsets: number[] = [0];

  const pushStr = (str: string) => {
    const b = Buffer.from(str, 'binary');
    chunks.push(b);
    offset += b.length;
  };
  const pushBuf = (b: Buffer) => {
    chunks.push(b);
    offset += b.length;
  };

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets[2] = offset;
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  offsets[3] = offset;
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pageW} ${pageH}] /Contents 5 0 R >>\nendobj\n`
  );

  offsets[4] = offset;
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace ${colorSpace} /BitsPerComponent ${bits} /Filter /DCTDecode /Length ${jpegBuf.length} >>\nstream\n`
  );
  pushBuf(jpegBuf);
  pushStr('\nendstream\nendobj\n');

  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBuf = Buffer.from(contentStream, 'binary');
  offsets[5] = offset;
  pushStr(`5 0 obj\n<< /Length ${contentBuf.length} >>\nstream\n`);
  pushBuf(contentBuf);
  pushStr('\nendstream\nendobj\n');

  const xrefOffset = offset;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pushStr(`${offStr} 00000 n \n`);
  }

  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.concat(chunks);
}

export function saveBase64ToDisk(dataUrl: string, recordId: string, index: number = 0): string | null {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
  try {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;
    const mime = matches[1];
    const base64Data = matches[2];
    const rawBuf = Buffer.from(base64Data, 'base64');

    const safeId = recordId.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (mime.includes('jpeg') || mime.includes('jpg') || (rawBuf[0] === 0xff && rawBuf[1] === 0xd8)) {
      const fileName = `migrated_${safeId}_${Date.now()}_${index}.pdf`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      fs.writeFileSync(filePath, convertJpegBufferToPdfBuffer(rawBuf));
      return `/uploads/${fileName}`;
    }

    let ext = '.pdf';
    if (mime.includes('png')) ext = '.png';
    else if (mime.includes('pdf')) ext = '.pdf';
    else if (mime.includes('webp')) ext = '.webp';
    else if (mime.includes('gif')) ext = '.gif';

    const fileName = `migrated_${safeId}_${Date.now()}_${index}${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, rawBuf);
    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Error saving base64 to disk:', err);
    return null;
  }
}

export function initDatabase() {
  // 1. Users / Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      avatar_color TEXT DEFAULT 'bg-red-600',
      avatar_initial TEXT DEFAULT '',
      icon_name TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  // 2. Custom Lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🛒',
      color TEXT DEFAULT 'red',
      description TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  // 3. Grocery Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS grocery_items (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      quantity TEXT DEFAULT '1',
      notes TEXT DEFAULT '',
      assigned_to_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_by TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      urgent INTEGER DEFAULT 0
    );
  `);

  // 4. Personal Records / Documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      title TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      record_type TEXT DEFAULT 'document',
      file_name TEXT DEFAULT '',
      file_type TEXT DEFAULT '',
      file_size INTEGER DEFAULT 0,
      file_url TEXT DEFAULT '',
      file_data_url TEXT DEFAULT '',
      attachments_json TEXT DEFAULT '[]',
      todos_json TEXT DEFAULT '[]',
      card_number TEXT DEFAULT '',
      card_holder TEXT DEFAULT '',
      card_exp TEXT DEFAULT '',
      card_cvc TEXT DEFAULT '',
      card_atm_pin TEXT DEFAULT '',
      card_bank TEXT DEFAULT '',
      card_brand TEXT DEFAULT '',
      card_theme TEXT DEFAULT 'black_vip',
      card_account_no TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  try {
    db.exec(`ALTER TABLE personal_records ADD COLUMN attachments_json TEXT DEFAULT '[]'`);
  } catch {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE personal_records ADD COLUMN todos_json TEXT DEFAULT '[]'`);
  } catch {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE personal_records ADD COLUMN record_type TEXT DEFAULT 'document'`);
  } catch {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE personal_records ADD COLUMN card_atm_pin TEXT DEFAULT ''`);
  } catch {
    // Column already exists
  }

  // 5. Data Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS data_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'folder',
      color TEXT DEFAULT '#dc2626',
      description TEXT DEFAULT '',
      subcategories_json TEXT DEFAULT '[]',
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 6. Calendar Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      time TEXT DEFAULT '',
      assigned_to_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      category TEXT DEFAULT 'General',
      urgent INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  // 7. Contacts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      address TEXT DEFAULT '',
      place_name TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  // 8. Todos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      assigned_to_id TEXT DEFAULT 'all',
      category TEXT DEFAULT 'General',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  // 9. Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      item_id TEXT,
      list_id TEXT,
      task_id TEXT
    );
  `);

  // 10. Passwords table
  db.exec(`
    CREATE TABLE IF NOT EXISTS passwords (
      id TEXT PRIMARY KEY,
      website TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      notes TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      member_id TEXT DEFAULT 'all',
      color TEXT DEFAULT 'yellow',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  try {
    db.exec(`ALTER TABLE passwords ADD COLUMN color TEXT DEFAULT 'yellow'`);
  } catch {
    // Column already exists
  }

  // Seed or Migrate if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedOrMigrateFromLegacy();
  }

  // Auto-migration: Extract and migrate any base64 images in personal_records to physical files in /uploads/
  try {
    const allRecords = db.prepare('SELECT id, file_url, file_data_url, attachments_json FROM personal_records').all() as any[];
    for (const r of allRecords) {
      let changed = false;
      let fileUrl = r.file_url || '';
      let attachments: any[] = [];
      if (r.attachments_json) {
        try {
          attachments = JSON.parse(r.attachments_json);
        } catch {
          attachments = [];
        }
      }

      // Check main file_data_url
      if (r.file_data_url && r.file_data_url.startsWith('data:')) {
        const savedUrl = saveBase64ToDisk(r.file_data_url, r.id, 0);
        if (savedUrl) {
          fileUrl = savedUrl;
          changed = true;
        }
      }

      // Check attachments
      if (Array.isArray(attachments)) {
        attachments = attachments.map((att, idx) => {
          if (att.fileDataUrl && att.fileDataUrl.startsWith('data:')) {
            const savedAttUrl = saveBase64ToDisk(att.fileDataUrl, `${r.id}_att`, idx);
            changed = true;
            return {
              ...att,
              fileUrl: savedAttUrl || att.fileUrl || '',
              fileDataUrl: '', // remove base64
            };
          }
          if (att.fileDataUrl && att.fileUrl) {
            changed = true;
            return {
              ...att,
              fileDataUrl: '',
            };
          }
          return att;
        });
      }

      if (changed) {
        db.prepare(`
          UPDATE personal_records
          SET file_url = ?, file_data_url = '', attachments_json = ?
          WHERE id = ?
        `).run(fileUrl, JSON.stringify(attachments), r.id);
      }
    }
  } catch (err) {
    console.error('Error in base64 migration:', err);
  }

  // Auto-migration: Ensure Cédula / DNI is migrated to Cédula in existing databases if present
  try {
    const identCat = db.prepare('SELECT * FROM data_categories WHERE id = ?').get('cat_identificacion') as any;
    if (identCat && identCat.subcategories_json && identCat.subcategories_json.includes('Cédula / DNI')) {
      const subs: string[] = JSON.parse(identCat.subcategories_json);
      const newSubs = subs.map((s) => (s === 'Cédula / DNI' ? 'Cédula' : s));
      db.prepare('UPDATE data_categories SET subcategories_json = ? WHERE id = ?').run(
        JSON.stringify(newSubs),
        'cat_identificacion'
      );
      db.prepare(`
        UPDATE personal_records
        SET subcategory = 'Cédula'
        WHERE subcategory = 'Cédula / DNI'
      `).run();
    }
  } catch (err) {
    console.error('Migration check error:', err);
  }

  // Auto-seed documents from ESCANEO PROFESIONAL folder
  try {
    seedEscaneoProfesionalDocuments();
  } catch (err) {
    console.error('Error seeding ESCANEO PROFESIONAL documents:', err);
  }

  // Auto-migration: Move Jaime's 'Finanzas y Bancos' records to 'Tarjetas de Crédito'
  try {
    migrateJaimeFinanzasToTarjetasDeCredito();
  } catch (err) {
    console.error('Error migrating Jaime Finanzas y Bancos to Tarjetas de Crédito:', err);
  }

  // Auto-migration: Convert all non-PDF attachments of all users to PDF
  try {
    migrateAllRecordsToPdf();
  } catch (err) {
    console.error('Error migrating all attachments to PDF:', err);
  }

  // Auto-migration: Remove unused categories and subcategories that have 0 records loaded
  try {
    pruneUnusedCategoriesAndSubcategories();
  } catch (err) {
    console.error('Error pruning unused categories and subcategories:', err);
  }
}

function migrateJaimeFinanzasToTarjetasDeCredito() {
  const nowIso = new Date().toISOString();

  // Move any remaining 'Finanzas y Bancos' records of Jaime to 'BANCO' -> 'Tarjeta de Crédito'
  const bankCat = db
    .prepare("SELECT name FROM data_categories WHERE id = 'cat_finanzas'")
    .get() as { name: string } | undefined;
  const targetCatName = bankCat?.name || 'BANCO';

  db.prepare(`
    UPDATE personal_records
    SET category = ?, subcategory = 'Tarjeta de Crédito', updated_at = ?
    WHERE member_id = 'member_jaime'
      AND (LOWER(category) LIKE '%finanzas y banco%' OR LOWER(category) = 'finanzas y bancos')
  `).run(targetCatName, nowIso);

  // If cat_finanzas is still named 'Finanzas y Bancos' and no records use 'Finanzas y Bancos', align its name to 'BANCO'
  const remainingFinanzas = db
    .prepare("SELECT COUNT(*) as c FROM personal_records WHERE LOWER(category) LIKE '%finanzas y banco%'")
    .get() as { c: number };
  if (remainingFinanzas.c === 0) {
    db.prepare(`
      UPDATE data_categories
      SET name = 'BANCO'
      WHERE id = 'cat_finanzas' AND LOWER(name) LIKE '%finanzas y banco%'
    `).run();
  }
}

function pruneUnusedCategoriesAndSubcategories() {
  const allRecords = db
    .prepare('SELECT category, subcategory FROM personal_records')
    .all() as Array<{ category: string; subcategory: string }>;

  if (allRecords.length === 0) return;

  const allCategories = db
    .prepare('SELECT id, name, subcategories_json FROM data_categories')
    .all() as Array<{ id: string; name: string; subcategories_json: string }>;

  const deleteCatStmt = db.prepare('DELETE FROM data_categories WHERE id = ?');
  const updateSubsStmt = db.prepare('UPDATE data_categories SET subcategories_json = ? WHERE id = ?');

  for (const cat of allCategories) {
    const catNameLower = (cat.name || '').trim().toLowerCase();
    const matchingRecords = allRecords.filter(
      (r) => (r.category || '').trim().toLowerCase() === catNameLower
    );

    if (matchingRecords.length === 0) {
      // Delete category that has 0 records loaded
      deleteCatStmt.run(cat.id);
      continue;
    }

    let currentSubs: string[] = [];
    if (cat.subcategories_json) {
      try {
        currentSubs = JSON.parse(cat.subcategories_json);
      } catch {
        currentSubs = [];
      }
    }

    const usedSubsMap = new Map<string, string>();
    for (const r of matchingRecords) {
      const subTrimmed = (r.subcategory || '').trim();
      if (subTrimmed) {
        const key = subTrimmed.toLowerCase();
        if (!usedSubsMap.has(key)) {
          const existingCanonical = currentSubs.find((s) => s.trim().toLowerCase() === key);
          usedSubsMap.set(key, existingCanonical ? existingCanonical.trim() : subTrimmed);
        }
      }
    }

    const activeSubs: string[] = [];
    for (const s of currentSubs) {
      const key = s.trim().toLowerCase();
      if (usedSubsMap.has(key) && !activeSubs.some((a) => a.toLowerCase() === key)) {
        activeSubs.push(usedSubsMap.get(key)!);
      }
    }
    for (const [key, val] of usedSubsMap.entries()) {
      if (!activeSubs.some((a) => a.toLowerCase() === key)) {
        activeSubs.push(val);
      }
    }

    updateSubsStmt.run(JSON.stringify(activeSubs), cat.id);
  }
}

function migrateAllRecordsToPdf() {
  const allRecords = db
    .prepare('SELECT id, file_name, file_type, file_size, file_url, attachments_json FROM personal_records')
    .all() as Array<{
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    attachments_json: string;
  }>;

  const updateStmt = db.prepare(`
    UPDATE personal_records
    SET file_name = ?, file_type = ?, file_size = ?, file_url = ?, file_data_url = '', attachments_json = ?
    WHERE id = ?
  `);

  const toPdfDisplayName = (name: string, fallback: string): string => {
    const raw = (name || fallback || 'documento').trim();
    const withoutExt = raw.replace(/\.(jpg|jpeg|png|webp|gif|pdf)$/i, '');
    return `${withoutExt || 'documento'}.pdf`;
  };

  for (const r of allRecords) {
    let changed = false;
    let attachments: any[] = [];
    if (r.attachments_json) {
      try {
        attachments = JSON.parse(r.attachments_json);
      } catch {
        attachments = [];
      }
    }

    if ((!Array.isArray(attachments) || attachments.length === 0) && r.file_url) {
      attachments = [
        {
          id: 'att_' + r.id,
          fileName: r.file_name || path.basename(r.file_url),
          fileType: r.file_type || '',
          fileSize: r.file_size || 0,
          fileUrl: r.file_url,
          fileDataUrl: '',
        },
      ];
      changed = true;
    }

    if (Array.isArray(attachments) && attachments.length > 0) {
      attachments = attachments.map((att) => {
        if (!att || !att.fileUrl) return att;

        const diskFileName = path.basename(att.fileUrl);
        const isDiskPdf = diskFileName.toLowerCase().endsWith('.pdf');
        const pdfDiskFileName = isDiskPdf
          ? diskFileName
          : diskFileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '') + '.pdf';

        const srcPath = path.join(UPLOADS_DIR, diskFileName);
        const pdfPath = path.join(UPLOADS_DIR, pdfDiskFileName);

        if (!isDiskPdf || !fs.existsSync(pdfPath)) {
          if (fs.existsSync(srcPath)) {
            try {
              const srcBuf = fs.readFileSync(srcPath);
              const pdfBuf = convertJpegBufferToPdfBuffer(srcBuf);
              fs.writeFileSync(pdfPath, pdfBuf);
              changed = true;
            } catch (convErr) {
              console.error(`Error converting ${srcPath} to PDF:`, convErr);
            }
          }
        }

        const nextFileName = toPdfDisplayName(att.fileName, pdfDiskFileName);
        const nextFileUrl = `/uploads/${pdfDiskFileName}`;
        const nextFileType = 'application/pdf';
        const nextFileSize = fs.existsSync(pdfPath)
          ? fs.statSync(pdfPath).size
          : att.fileSize || 0;

        if (
          att.fileName !== nextFileName ||
          att.fileUrl !== nextFileUrl ||
          att.fileType !== nextFileType ||
          att.fileSize !== nextFileSize ||
          att.fileDataUrl
        ) {
          changed = true;
        }

        return {
          ...att,
          fileName: nextFileName,
          fileType: nextFileType,
          fileSize: nextFileSize,
          fileUrl: nextFileUrl,
          fileDataUrl: '',
        };
      });

      const primary = attachments[0];
      if (
        primary &&
        (r.file_name !== primary.fileName ||
          r.file_type !== primary.fileType ||
          r.file_url !== primary.fileUrl ||
          r.file_size !== primary.fileSize)
      ) {
        changed = true;
      }

      if (changed && primary) {
        updateStmt.run(
          primary.fileName,
          primary.fileType,
          primary.fileSize,
          primary.fileUrl,
          JSON.stringify(attachments),
          r.id
        );
      }
    }
  }
}

function seedEscaneoProfesionalDocuments() {
  const escaneoDir = path.join(process.cwd(), 'ESCANEO PROFESIONAL');
  if (!fs.existsSync(escaneoDir)) return;

  const getCategoryName = (catId: string, fallback: string): string => {
    const row = db.prepare('SELECT name FROM data_categories WHERE id = ?').get(catId) as { name: string } | undefined;
    return row?.name || fallback;
  };

  const catIdentidad = getCategoryName('cat_identificacion', 'Documentos de Identidad');
  const catFinanzas = getCategoryName('cat_finanzas', 'BANCO');
  const catVehiculos = getCategoryName('cat_vehiculos', 'VEHICULOS');
  const catEducacion = getCategoryName('cat_educacion', 'Educación y Títulos');

  const copyEscaneoFile = (relPath: string, destFileName: string, label?: string) => {
    const srcPath = path.join(escaneoDir, relPath);
    if (!fs.existsSync(srcPath)) return null;
    const destPath = path.join(UPLOADS_DIR, destFileName);
    const stat = fs.statSync(srcPath);
    if (!fs.existsSync(destPath) || fs.statSync(destPath).size !== stat.size) {
      fs.copyFileSync(srcPath, destPath);
    }
    return {
      id: 'att_' + destFileName.replace(/[^a-zA-Z0-9]/g, '_'),
      fileName: path.basename(relPath),
      fileType: 'application/pdf',
      fileSize: stat.size,
      fileUrl: `/uploads/${destFileName}`,
      fileDataUrl: '',
      label: label || undefined,
    };
  };

  // Attach PDFs to existing Sofi credit cards if they already exist in DB
  const attachToExistingCard = (
    cardLast4: string,
    files: Array<{ relPath: string; destName: string; label?: string }>,
    fallbackRecord: {
      id: string;
      title: string;
      notes: string;
      cardNumber: string;
      cardHolder: string;
      cardExp: string;
      cardCvc: string;
      cardBank: string;
      cardBrand: string;
      cardAccountNo?: string;
    }
  ) => {
    const atts = files
      .map((f) => copyEscaneoFile(f.relPath, f.destName, f.label))
      .filter((a): a is NonNullable<typeof a> => a !== null);
    if (atts.length === 0) return;

    const existing = db
      .prepare("SELECT id FROM personal_records WHERE member_id = 'member_sofi' AND card_number LIKE ?")
      .get(`%${cardLast4}%`) as { id: string } | undefined;

    if (existing) {
      const primary = atts[0];
      db.prepare(`
        UPDATE personal_records
        SET file_name = ?, file_type = ?, file_size = ?, file_url = ?, attachments_json = ?
        WHERE id = ?
      `).run(primary.fileName, primary.fileType, primary.fileSize, primary.fileUrl, JSON.stringify(atts), existing.id);
    } else {
      const nowIso = new Date().toISOString();
      const primary = atts[0];
      db.prepare(`
        INSERT OR REPLACE INTO personal_records (
          id, member_id, category, subcategory, title, notes, record_type,
          file_name, file_type, file_size, file_url, file_data_url,
          attachments_json, todos_json,
          card_number, card_holder, card_exp, card_cvc, card_atm_pin,
          card_bank, card_brand, card_theme, card_account_no,
          created_at, updated_at
        ) VALUES (?, 'member_sofi', ?, 'Tarjeta de Crédito', ?, ?, 'card', ?, ?, ?, ?, '', ?, '[]', ?, ?, ?, ?, '', ?, ?, 'isracard_white', ?, ?, ?)
      `).run(
        fallbackRecord.id,
        catFinanzas,
        fallbackRecord.title,
        fallbackRecord.notes,
        primary.fileName,
        primary.fileType,
        primary.fileSize,
        primary.fileUrl,
        JSON.stringify(atts),
        fallbackRecord.cardNumber,
        fallbackRecord.cardHolder,
        fallbackRecord.cardExp,
        fallbackRecord.cardCvc,
        fallbackRecord.cardBank,
        fallbackRecord.cardBrand,
        fallbackRecord.cardAccountNo || '',
        nowIso,
        nowIso
      );
    }
  };

  attachToExistingCard(
    '1531',
    [
      { relPath: '8a58251a-e62c-4f26-8db0-06720a6c12eb.pdf', destName: 'escaneo_sofi_cal_1531_frente.pdf', label: 'Frente' },
      { relPath: '34c85392-cd0c-435e-813b-576de70a6431.pdf', destName: 'escaneo_sofi_cal_1531_dorso.pdf', label: 'Dorso (CVV)' },
    ],
    {
      id: 'escaneo_sofi_tarjeta_cal_shufersal',
      title: 'Tarjeta de Crédito (Cal Shufersal)',
      notes: 'Tarjeta Visa Cal / Shufersal de Sofi · Cuenta/Ref: 540-000427197.',
      cardNumber: '4580 1700 0338 1531',
      cardHolder: 'SOFI',
      cardExp: '11/31',
      cardCvc: '760',
      cardBank: 'CAL SUPERSAL',
      cardBrand: 'Visa',
      cardAccountNo: '540-000427197',
    }
  );

  attachToExistingCard(
    '9329',
    [
      { relPath: '69dbe3b7-7cb9-4048-a03b-157d9219e5be.pdf', destName: 'escaneo_sofi_max_9329_frente.pdf', label: 'Frente' },
      { relPath: 'c1c2a8aa-6a8b-45b1-973f-e974f6dade46.pdf', destName: 'escaneo_sofi_max_9329_dorso.pdf', label: 'Dorso (CVV)' },
    ],
    {
      id: 'escaneo_sofi_tarjeta_max',
      title: 'Tarjeta de Crédito (MAX)',
      notes: 'Tarjeta Visa MAX de Sofi.',
      cardNumber: '4580 5611 9469 9329',
      cardHolder: 'SOFI',
      cardExp: '08/27',
      cardCvc: '899',
      cardBank: 'MAX BEYAHAD',
      cardBrand: 'Visa',
    }
  );

  attachToExistingCard(
    '7688',
    [
      { relPath: 'ae74d76e-5d7d-4128-9d2b-0db2dbaf61d2.pdf', destName: 'escaneo_sofi_cal_7688_dorso.pdf', label: 'Dorso (Datos y CVV)' },
    ],
    {
      id: 'escaneo_sofi_tarjeta_cal_7688',
      title: 'Tarjeta de Crédito (Cal 7688)',
      notes: 'Tarjeta Visa Cal de Sofi · Cuenta/Ref: 540-000427197.',
      cardNumber: '4580 2802 0059 7688',
      cardHolder: 'SOFI',
      cardExp: '07/30',
      cardCvc: '172',
      cardBank: 'CAL CARREFOUR',
      cardBrand: 'Visa',
      cardAccountNo: '540-000427197',
    }
  );

  // Check if Jaime already has his 3-passport record
  const jaimeHasPasaporte = db
    .prepare("SELECT id FROM personal_records WHERE member_id = 'member_jaime' AND LOWER(subcategory) = 'pasaporte' AND id NOT LIKE 'escaneo_%'")
    .get();

  const docsToSeed: Array<{
    id: string;
    memberId: string;
    category: string;
    subcategory: string;
    title: string;
    notes: string;
    skip?: boolean;
    files: Array<{ relPath: string; destName: string; label?: string }>;
  }> = [
    // ================= JAIME =================
    {
      id: 'escaneo_jaime_cedula_ve',
      memberId: 'member_jaime',
      category: catIdentidad,
      subcategory: 'Cédula',
      title: 'Cédula de Identidad (Venezuela) - Jaime',
      notes: 'Cédula de Identidad venezolana escaneada de Jaime Hadida.',
      files: [{ relPath: 'JAIME DOC/CEDULA JAIME VE.pdf', destName: 'escaneo_cedula_jaime_ve.pdf', label: 'Cédula VE' }],
    },
    {
      id: 'escaneo_jaime_pasaportes',
      memberId: 'member_jaime',
      category: catIdentidad,
      subcategory: 'Pasaporte',
      title: 'Pasaportes (España, Israel, Venezuela) - Jaime',
      notes: 'Pasaportes escaneados de Jaime Hadida (España, Israel y Venezuela).',
      skip: Boolean(jaimeHasPasaporte),
      files: [
        { relPath: 'JAIME DOC/PASAPORTE JAIME IL.pdf', destName: 'escaneo_pasaporte_jaime_il.pdf', label: 'Israel' },
        { relPath: 'JAIME DOC/PASAPORTE JAIME ES.pdf', destName: 'escaneo_pasaporte_jaime_es.pdf', label: 'España' },
        { relPath: 'JAIME DOC/PASAPORTE JAIME VE.pdf', destName: 'escaneo_pasaporte_jaime_ve.pdf', label: 'Venezuela' },
      ],
    },
    {
      id: 'escaneo_jaime_gaceta_ve',
      memberId: 'member_jaime',
      category: catIdentidad,
      subcategory: 'Cédula',
      title: 'Gaceta Oficial de Naturalización (Venezuela) - Jaime',
      notes: 'Gaceta Oficial de la República de Venezuela.',
      files: [{ relPath: 'JAIME DOC/GACETA VE.pdf', destName: 'escaneo_gaceta_jaime_ve.pdf', label: 'Gaceta Oficial VE' }],
    },
    {
      id: 'escaneo_jaime_diploma',
      memberId: 'member_jaime',
      category: catEducacion,
      subcategory: 'Títulos y Diplomas',
      title: 'Diploma Profesional - Jaime',
      notes: 'Título / Diploma académico y profesional de Jaime Hadida.',
      files: [{ relPath: 'JAIME DOC/DIPLOMA JAIME.pdf', destName: 'escaneo_diploma_jaime.pdf', label: 'Diploma' }],
    },
    {
      id: 'escaneo_jaime_licencia_yaris',
      memberId: 'member_jaime',
      category: catVehiculos,
      subcategory: 'Matrícula y Placas',
      title: 'Licencia de Vehículo (Rishayon Rejev) Toyota Yaris HEV - Jaime',
      notes: 'Permiso de circulación israelí (רישיון רכב) Toyota Yaris HEV · Placa: 71-972-204 · Titular: Chaim (Jaime) Hadida.',
      files: [{ relPath: 'LICENCIA YARIS.pdf', destName: 'escaneo_licencia_yaris.pdf', label: 'Rishayon Rejev Yaris' }],
    },

    // ================= SOFI =================
    {
      id: 'escaneo_sofi_licencia',
      memberId: 'member_sofi',
      category: catIdentidad,
      subcategory: 'Licencia de Conducir',
      title: 'Licencia de Conducir - Sofi',
      notes: 'Licencia de conducir escaneada de Sofi.',
      files: [{ relPath: 'SOFI DOC/LICENCIA SOFI.pdf', destName: 'escaneo_licencia_sofi.pdf', label: 'Licencia' }],
    },
    {
      id: 'escaneo_sofi_partida_nac',
      memberId: 'member_sofi',
      category: catIdentidad,
      subcategory: 'Partida de Nacimiento',
      title: 'Partida de Nacimiento (Venezuela) - Sofi',
      notes: 'Partida de Nacimiento original de Sofi Estela Hassin Pinhas.',
      files: [{ relPath: 'SOFI DOC/PARTIDA NAC SOFI.pdf', destName: 'escaneo_partida_nac_sofi.pdf', label: 'Partida Nacimiento' }],
    },
    {
      id: 'escaneo_sofi_pasaportes',
      memberId: 'member_sofi',
      category: catIdentidad,
      subcategory: 'Pasaporte',
      title: 'Pasaportes (España, Israel, Venezuela) - Sofi',
      notes: 'Pasaportes escaneados de Sofi (España, Israel, Venezuela y expediente consular).',
      files: [
        { relPath: 'SOFI DOC/PASAPORTE SOFI IL.pdf', destName: 'escaneo_pasaporte_sofi_il.pdf', label: 'Israel' },
        { relPath: 'SOFI DOC/PASAPORTE SOFI ES.pdf', destName: 'escaneo_pasaporte_sofi_es.pdf', label: 'España' },
        { relPath: 'SOFI DOC/PASAPORTE SOFI VE.pdf', destName: 'escaneo_pasaporte_sofi_ve.pdf', label: 'Venezuela' },
        { relPath: 'DOC SOFI HASSIN.pdf', destName: 'escaneo_doc_sofi_hassin.pdf', label: 'Expediente VE' },
      ],
    },
    {
      id: 'escaneo_sofi_teudat_zeut',
      memberId: 'member_sofi',
      category: catIdentidad,
      subcategory: 'TEUDAT ZEUT',
      title: 'Teudat Zehut y Sefaj (Israel) - Sofi',
      notes: 'Documento de identidad israelí (Teudat Zehut frente, dorso y anexo Sefaj) de Sofi.',
      files: [
        { relPath: 'SOFI DOC/TEUDAT ZEUT SOFI.pdf', destName: 'escaneo_teudat_zeut_sofi_1.pdf', label: 'Teudat Zehut 1' },
        { relPath: 'SOFI DOC/TEUDAT ZEUT SOFI 2.pdf', destName: 'escaneo_teudat_zeut_sofi_2.pdf', label: 'Teudat Zehut 2' },
        { relPath: 'SOFI DOC/ZEFAJ SOFI.pdf', destName: 'escaneo_zefaj_sofi.pdf', label: 'Sefaj' },
      ],
    },

    // ================= SHARON =================
    {
      id: 'escaneo_sharon_cedula_ve',
      memberId: 'member_sharon',
      category: catIdentidad,
      subcategory: 'Cédula',
      title: 'Cédula de Identidad (Venezuela) - Sharon',
      notes: 'Cédula de Identidad venezolana escaneada de Sharon.',
      files: [{ relPath: 'SHARON DOC/CEDULA SHARON VE.pdf', destName: 'escaneo_cedula_sharon_ve.pdf', label: 'Cédula VE' }],
    },
    {
      id: 'escaneo_sharon_pasaportes',
      memberId: 'member_sharon',
      category: catIdentidad,
      subcategory: 'Pasaporte',
      title: 'Pasaportes (España, Israel, Venezuela) - Sharon',
      notes: 'Pasaportes escaneados de Sharon (España, Israel y Venezuela).',
      files: [
        { relPath: 'SHARON DOC/PASAPORTE SHARON IL.pdf', destName: 'escaneo_pasaporte_sharon_il.pdf', label: 'Israel' },
        { relPath: 'SHARON DOC/PASAPORTE SHARON ES.pdf', destName: 'escaneo_pasaporte_sharon_es.pdf', label: 'España' },
        { relPath: 'SHARON DOC/PASAPORTE SHARON VE.pdf', destName: 'escaneo_pasaporte_sharon_ve.pdf', label: 'Venezuela' },
      ],
    },

    // ================= SHIRLY =================
    {
      id: 'escaneo_shirly_partida_nac',
      memberId: 'member_shirly',
      category: catIdentidad,
      subcategory: 'Partida de Nacimiento',
      title: 'Partida de Nacimiento (Venezuela) - Shirly',
      notes: 'Partida de Nacimiento venezolana escaneada de Shirly.',
      files: [{ relPath: 'SHIRLY DOC/PARTIDA NAC SHIRLY VE.pdf', destName: 'escaneo_partida_nac_shirly_ve.pdf', label: 'Partida Nacimiento' }],
    },
    {
      id: 'escaneo_shirly_pasaportes',
      memberId: 'member_shirly',
      category: catIdentidad,
      subcategory: 'Pasaporte',
      title: 'Pasaportes (España, Israel, Venezuela) - Shirly',
      notes: 'Pasaportes escaneados de Shirly (España, Israel y Venezuela).',
      files: [
        { relPath: 'SHIRLY DOC/PASAPORTE SHIRLY IL.pdf', destName: 'escaneo_pasaporte_shirly_il.pdf', label: 'Israel' },
        { relPath: 'SHIRLY DOC/PASAPORTE SHIRLY ES.pdf', destName: 'escaneo_pasaporte_shirly_es.pdf', label: 'España' },
        { relPath: 'SHIRLY DOC/PASAPORTE SHIRLY VE.pdf', destName: 'escaneo_pasaporte_shirly_ve.pdf', label: 'Venezuela' },
      ],
    },
    {
      id: 'escaneo_shirly_teudat_zeut',
      memberId: 'member_shirly',
      category: catIdentidad,
      subcategory: 'TEUDAT ZEUT',
      title: 'Teudat Zehut PDF (Israel) - Shirly',
      notes: 'Documento de identidad israelí escaneado en PDF (completo, frente y anexo) de Shirly.',
      files: [
        { relPath: 'SHIRLY DOC/TEUDAT ZEUT SHIRLY.pdf', destName: 'escaneo_teudat_zeut_shirly.pdf', label: 'Completo' },
        { relPath: 'SHIRLY DOC/TEUDAT ZEUT SHILY FRONT.pdf', destName: 'escaneo_teudat_zeut_shirly_front.pdf', label: 'Frente' },
        { relPath: 'SHIRLY DOC/TEUDAT ZEUT SHILY 2.pdf', destName: 'escaneo_teudat_zeut_shirly_2.pdf', label: 'Anexo 2' },
      ],
    },

    // ================= STEPHANIE =================
    {
      id: 'escaneo_stephanie_cedula_ve',
      memberId: 'member_stephanie',
      category: catIdentidad,
      subcategory: 'Cédula',
      title: 'Cédula de Identidad (Venezuela) - Stephanie',
      notes: 'Cédula de Identidad venezolana escaneada de Stephanie.',
      files: [{ relPath: 'STEPHANIE DOC/CEDULA STEPANIE VE.pdf', destName: 'escaneo_cedula_stephanie_ve.pdf', label: 'Cédula VE' }],
    },
    {
      id: 'escaneo_stephanie_pasaportes',
      memberId: 'member_stephanie',
      category: catIdentidad,
      subcategory: 'Pasaporte',
      title: 'Pasaportes (España, Israel, Venezuela) - Stephanie',
      notes: 'Pasaportes escaneados de Stephanie (España, Israel y Venezuela).',
      files: [
        { relPath: 'STEPHANIE DOC/PASAPORTE STEPHANIE IL.pdf', destName: 'escaneo_pasaporte_stephanie_il.pdf', label: 'Israel' },
        { relPath: 'STEPHANIE DOC/PASAPORTE STEPHANIE ES.pdf', destName: 'escaneo_pasaporte_stephanie_es.pdf', label: 'España' },
        { relPath: 'STEPHANIE DOC/PASAPORTE STEPHANIE VE.pdf', destName: 'escaneo_pasaporte_stephanie_ve.pdf', label: 'Venezuela' },
      ],
    },
    {
      id: 'escaneo_stephanie_banco_leumi',
      memberId: 'member_stephanie',
      category: catFinanzas,
      subcategory: 'Cuentas Bancarias',
      title: 'Certificado de Titularidad Cuenta Banco Leumi - Stephanie',
      notes: 'Certificado oficial de titularidad de cuenta bancaria en Banco Leumi de Stephanie Hassine.',
      files: [
        {
          relPath: 'STEPHANIE DOC/Certificado_Titularidad_Cuenta_Banco_Leumi_Stephanie_Hassine.pdf',
          destName: 'escaneo_certificado_banco_leumi_stephanie.pdf',
          label: 'Certificado Banco Leumi',
        },
      ],
    },
    {
      id: 'escaneo_stephanie_bagrut',
      memberId: 'member_stephanie',
      category: catEducacion,
      subcategory: 'Títulos y Diplomas',
      title: 'Teudat Bagrut (Certificado de Bachillerato) - Stephanie',
      notes: 'Certificado académico Teudat Bagrut de Stephanie.',
      files: [{ relPath: 'STEPHANIE DOC/T BAGRUT STEPHANIE.pdf', destName: 'escaneo_bagrut_stephanie.pdf', label: 'Teudat Bagrut' }],
    },

    // ================= MERCEDES =================
    {
      id: 'escaneo_mercedes_cedula',
      memberId: 'member_mercedes',
      category: catIdentidad,
      subcategory: 'Cédula',
      title: 'Cédula de Identidad - Mercedes',
      notes: 'Cédula de Identidad escaneada de Mercedes.',
      files: [{ relPath: 'CEDULA MERCEDES.pdf', destName: 'escaneo_cedula_mercedes.pdf', label: 'Cédula' }],
    },

    // ================= MOISES =================
    {
      id: 'escaneo_moises_expediente_ve',
      memberId: 'member_moises',
      category: catIdentidad,
      subcategory: 'Pasaporte',
      title: 'Expediente Documentos Venezuela (Pasaporte, Cédula, Gaceta y Cita) - Moisés',
      notes: 'Compilación de documentos de Moisés Hadida Serruya (Pasaporte VE N° 091849665, Cédula V-9.732.326 / E-1.063.398, Gaceta Oficial N° 2.289 y Planilla SAIME Atenas).',
      files: [{ relPath: 'DOC MOISES HADIDA ATN.pdf', destName: 'escaneo_doc_moises_hadida.pdf', label: 'Expediente VE' }],
    },
  ];

  const nowIso = new Date().toISOString();
  const upsertStmt = db.prepare(`
    INSERT OR IGNORE INTO personal_records (
      id, member_id, category, subcategory, title, notes, record_type,
      file_name, file_type, file_size, file_url, file_data_url,
      attachments_json, todos_json,
      card_number, card_holder, card_exp, card_cvc, card_atm_pin,
      card_bank, card_brand, card_theme, card_account_no,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'document', ?, ?, ?, ?, '', ?, '[]', '', '', '', '', '', '', '', 'black_vip', '', ?, ?)
  `);

  const seedTx = db.transaction(() => {
    for (const doc of docsToSeed) {
      if (doc.skip) continue;
      const attachments = doc.files
        .map((f) => copyEscaneoFile(f.relPath, f.destName, f.label))
        .filter((a): a is NonNullable<typeof a> => a !== null);

      if (attachments.length === 0) continue;

      const primary = attachments[0];
      upsertStmt.run(
        doc.id,
        doc.memberId,
        doc.category,
        doc.subcategory,
        doc.title,
        doc.notes,
        primary.fileName,
        primary.fileType,
        primary.fileSize,
        primary.fileUrl,
        JSON.stringify(attachments),
        nowIso,
        nowIso
      );
    }
  });

  seedTx();
}

function hashPin(pin: string): string {
  return bcrypt.hashSync(pin, 10);
}

export function comparePin(pin: string, hash: string): boolean {
  return bcrypt.compareSync(pin, hash);
}

function seedOrMigrateFromLegacy() {
  console.log('🔄 Inicializando base de datos SQLite...');

  let legacyData: Partial<AppData> | null = null;
  if (fs.existsSync(LEGACY_JSON_FILE)) {
    try {
      const content = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
      legacyData = JSON.parse(content);
      console.log('📦 Migrando datos existentes de groceries_db.json a SQLite...');
    } catch (err) {
      console.error('Error al leer groceries_db.json legacy:', err);
    }
  }

  const defaultPinHash = hashPin(DEFAULT_PIN);

  // Default initial members
  const initialMembers: Member[] = legacyData?.members && legacyData.members.length > 0
    ? legacyData.members
    : [
        { id: 'member_jaime', name: 'JAIME', role: 'admin', avatarColor: 'bg-orange-500', avatarInitial: 'J' },
        { id: 'member_sofi', name: 'SOFI', role: 'member', avatarColor: 'bg-purple-600', avatarInitial: 'S' },
        { id: 'member_stephanie', name: 'STEPHANIE', role: 'member', avatarColor: 'bg-pink-600', avatarInitial: 'S' },
        { id: 'member_sharon', name: 'SHARON', role: 'member', avatarColor: 'bg-rose-600', avatarInitial: 'S' },
        { id: 'member_shirly', name: 'SHIRLY', role: 'member', avatarColor: 'bg-amber-500', avatarInitial: 'S' },
        { id: 'member_moises', name: 'MOISES', role: 'member', avatarColor: 'bg-blue-600', avatarInitial: 'M' },
        { id: 'member_mercedes', name: 'MERCEDES', role: 'member', avatarColor: 'bg-emerald-600', avatarInitial: 'M' },
        { id: 'member_simon', name: 'SIMON', role: 'member', avatarColor: 'bg-red-600', avatarInitial: 'S' },
      ];

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, username, pin_hash, role, avatar_color, avatar_initial, icon_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUserTx = db.transaction((members: Member[]) => {
    for (const m of members) {
      const uname = m.name.toLowerCase().replace(/\s+/g, '');
      const role = (m.id === 'member_jaime' || m.name.toUpperCase() === 'JAIME' || m.role === 'admin') ? 'admin' : 'member';
      insertUser.run(
        m.id,
        m.name.toUpperCase(),
        uname,
        defaultPinHash,
        role,
        m.avatarColor || 'bg-red-600',
        m.avatarInitial || m.name[0] || '👤',
        m.iconName || '',
        m.createdAt || new Date().toISOString()
      );
    }
  });
  insertUserTx(initialMembers);

  // Migrate Lists
  const initialLists: CustomList[] = legacyData?.lists && legacyData.lists.length > 0
    ? legacyData.lists
    : [
        {
          id: 'list_supermercado',
          name: 'Supermercado',
          icon: '🛒',
          color: 'red',
          description: 'Compras del hogar y supermercado',
          createdAt: new Date().toISOString(),
        },
      ];

  const insertList = db.prepare(`
    INSERT OR REPLACE INTO lists (id, name, icon, color, description, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertListTx = db.transaction((lists: CustomList[]) => {
    for (const l of lists) {
      insertList.run(l.id, l.name, l.icon || '🛒', l.color || 'red', l.description || '', l.createdBy || 'member_jaime', l.createdAt || new Date().toISOString());
    }
  });
  insertListTx(initialLists);

  // Migrate Grocery Items
  if (legacyData?.items && Array.isArray(legacyData.items)) {
    const insertItem = db.prepare(`
      INSERT OR REPLACE INTO grocery_items (id, list_id, title, category, quantity, notes, assigned_to_id, completed, completed_at, created_by, created_at, updated_at, urgent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItemTx = db.transaction((items: GroceryItem[]) => {
      for (const it of items) {
        insertItem.run(
          it.id,
          it.listId || 'list_supermercado',
          it.title,
          it.category || 'General',
          it.quantity || '1',
          it.notes || '',
          it.assignedToId || 'member_jaime',
          it.completed ? 1 : 0,
          it.completedAt || null,
          it.createdBy || 'member_jaime',
          it.createdAt || new Date().toISOString(),
          it.updatedAt || new Date().toISOString(),
          it.urgent ? 1 : 0
        );
      }
    });
    insertItemTx(legacyData.items);
  }

  // Migrate Personal Records
  if (legacyData?.personalRecords && Array.isArray(legacyData.personalRecords)) {
    const insertRecord = db.prepare(`
      INSERT OR REPLACE INTO personal_records (id, member_id, category, subcategory, title, notes, file_name, file_type, file_size, file_url, file_data_url, card_number, card_holder, card_exp, card_cvc, card_bank, card_brand, card_theme, card_account_no, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertRecordTx = db.transaction((records: PersonalRecord[]) => {
      for (const r of records) {
        insertRecord.run(
          r.id,
          r.memberId,
          r.category,
          r.subcategory,
          r.title || '',
          r.notes || '',
          r.fileName || '',
          r.fileType || '',
          r.fileSize || 0,
          r.fileUrl || '',
          r.fileDataUrl || '',
          r.cardNumber || '',
          r.cardHolder || '',
          r.cardExp || '',
          r.cardCvc || '',
          r.cardBank || '',
          r.cardBrand || '',
          r.cardTheme || 'black_vip',
          r.cardAccountNo || '',
          r.createdAt || new Date().toISOString(),
          r.updatedAt || null
        );
      }
    });
    insertRecordTx(legacyData.personalRecords);
  }

  // Migrate or Seed Data Categories
  const initialCategories: DataCategory[] = legacyData?.dataCategories && legacyData.dataCategories.length > 0
    ? legacyData.dataCategories
    : [
        {
          id: 'cat_identificacion',
          name: 'Documentos de Identidad',
          icon: 'id-card',
          color: '#2563eb',
          description: 'Documentos oficiales de identidad, pasaportes y licencias',
          subcategories: ['Cédula', 'Pasaporte', 'Partida de Nacimiento', 'Licencia de Conducir', 'Visas / Residencia / Teudat Zehut', 'Libreta Militar'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_salud',
          name: 'Salud y Médicos',
          icon: 'heart-pulse',
          color: '#e11d48',
          description: 'Expedientes de salud, carnets de vacunas y recetas',
          subcategories: ['Carnet de Vacunación', 'Historial Clínico', 'Recetas Médicas', 'Exámenes de Laboratorio', 'Alergias y Diagnósticos', 'Odontología / Dental', 'Póliza de Seguro Médico'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_finanzas',
          name: 'Finanzas y Bancos',
          icon: 'credit-card',
          color: '#059669',
          description: 'Información bancaria, impuestos y comprobantes financieros',
          subcategories: ['Cuentas Bancarias', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Tarjetas de Crédito / Débito', 'Declaraciones de Impuestos', 'Comprobantes de Pago', 'Inversiones y Ahorros', 'Préstamos y Créditos'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_vehiculos',
          name: 'Vehículos y Transporte',
          icon: 'car',
          color: '#d97706',
          description: 'Títulos, seguros y mantenimientos vehiculares',
          subcategories: ['Título de Propiedad', 'Póliza de Seguro Automotor', 'Revisión Técnica / VTV', 'Matrícula y Placas', 'Multas / Trámites', 'Mantenimiento y Reparaciones'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_educacion',
          name: 'Educación y Títulos',
          icon: 'graduation-cap',
          color: '#4f46e5',
          description: 'Diplomas, certificados académicos y constancias escolares',
          subcategories: ['Títulos y Diplomas', 'Boletas de Calificaciones', 'Certificados de Cursos', 'Matrículas Escolares / Universitarias', 'Carnet Estudiantil'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_seguros',
          name: 'Seguros y Pólizas',
          icon: 'shield-check',
          color: '#0891b2',
          description: 'Pólizas de seguro de vida, hogar, viaje y bienes',
          subcategories: ['Seguro de Vida', 'Seguro de Hogar', 'Seguro de Viaje', 'Seguro de Responsabilidad Civil', 'Asistencia en Viaje'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_hogar',
          name: 'Hogar y Propiedades',
          icon: 'home',
          color: '#ea580c',
          description: 'Contratos de vivienda, servicios y escrituras',
          subcategories: ['Contrato de Arrendamiento / Alquiler', 'Escrituras de Propiedad', 'Facturas de Servicios (Luz, Agua, Gas)', 'Inventario del Hogar', 'Garantías de Electrodomésticos'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_laboral',
          name: 'Laboral y Empleo',
          icon: 'briefcase',
          color: '#475569',
          description: 'Contratos laborales, nóminas y certificaciones de trabajo',
          subcategories: ['Contratos de Trabajo', 'Recibos de Nómina / Pago', 'Cartas de Recomendación', 'Seguridad Social / Pensión', 'Certificados Laborales'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cat_general',
          name: 'General y Varios',
          icon: 'folder',
          color: '#dc2626',
          description: 'Garantías, contratos varios y documentos generales',
          subcategories: ['Contratos Generales', 'Garantías y Facturas', 'Suscripciones y Membresías', 'Fotografías Familiares', 'Otros Documentos'],
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ];

  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO data_categories (id, name, icon, color, description, subcategories_json, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCategoryTx = db.transaction((cats: DataCategory[]) => {
    for (const c of cats) {
      insertCategory.run(c.id, c.name, c.icon || 'folder', c.color || '#dc2626', c.description || '', JSON.stringify(c.subcategories || []), c.isDefault ? 1 : 0, c.createdAt || new Date().toISOString());
    }
  });
  insertCategoryTx(initialCategories);

  // Migrate Calendar Tasks
  if (legacyData?.calendarTasks && Array.isArray(legacyData.calendarTasks)) {
    const insertTask = db.prepare(`
      INSERT OR REPLACE INTO calendar_tasks (id, title, description, date, time, assigned_to_id, completed, completed_at, category, urgent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTaskTx = db.transaction((tasks: CalendarTask[]) => {
      for (const t of tasks) {
        insertTask.run(t.id, t.title, t.description || '', t.date, t.time || '', t.assignedToId || 'member_jaime', t.completed ? 1 : 0, t.completedAt || null, t.category || 'General', t.urgent ? 1 : 0, t.createdAt || new Date().toISOString(), t.updatedAt || null);
      }
    });
    insertTaskTx(legacyData.calendarTasks);
  }

  // Migrate Contacts
  if (legacyData?.contacts && Array.isArray(legacyData.contacts)) {
    const insertContact = db.prepare(`
      INSERT OR REPLACE INTO contacts (id, name, phone, email, notes, address, place_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertContactTx = db.transaction((contacts: Contact[]) => {
      for (const c of contacts) {
        insertContact.run(c.id, c.name, c.phone, c.email || '', c.notes || '', c.address || '', c.placeName || '', c.createdAt || new Date().toISOString(), c.updatedAt || null);
      }
    });
    insertContactTx(legacyData.contacts);
  }

  // Migrate Todos
  if (legacyData?.todos && Array.isArray(legacyData.todos)) {
    const insertTodo = db.prepare(`
      INSERT OR REPLACE INTO todos (id, text, completed, assigned_to_id, category, due_date, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTodoTx = db.transaction((todos: TodoItem[]) => {
      for (const td of todos) {
        insertTodo.run(td.id, td.text, td.completed ? 1 : 0, td.assignedToId || 'all', td.category || 'General', td.dueDate || null, td.completedAt || null, td.createdAt || new Date().toISOString(), td.updatedAt || null);
      }
    });
    insertTodoTx(legacyData.todos);
  }

  // Migrate or Seed Passwords
  const pwdCount = db.prepare('SELECT COUNT(*) as c FROM passwords').get() as { c: number };
  if (pwdCount.c === 0) {
    const TABLE_PREFIX = '___EXCEL_TABLE_JSON___:';
    const streamingTable = {
      type: 'excel_table',
      headers: ['Servicio / Plataforma', 'Usuario / Correo', 'Contraseña / PIN', 'Detalles / Perfil'],
      rows: [
        ['Netflix 4K', 'familia@hadida.com', 'Hadida2026*', 'Perfil: Principal / PIN: 1474'],
        ['Disney+ & Star', 'familia@hadida.com', 'DisneyFam2026!', 'Disponible en Smart TVs'],
        ['Spotify Familiar', 'musica@hadida.com', 'SpotHadida99', 'Plan Familiar 6 cuentas'],
        ['Amazon Prime Video', 'compras@hadida.com', 'PrimeHadida!', 'Envíos y Series'],
        ['Max (HBO)', 'familia@hadida.com', 'MaxHadida2026', 'Películas y Estrenos'],
      ],
    };
    const homeAccessTable = {
      type: 'excel_table',
      headers: ['Dispositivo / Acceso', 'Ubicación', 'Código / PIN', 'Instrucciones'],
      rows: [
        ['Alarma Principal', 'Entrada Principal', '1474', 'Desactivar antes de 30 seg'],
        ['Portón Eléctrico', 'Garaje / Estacionamiento', '8842', 'Control remoto #1 y #2'],
        ['Cerradura Digital', 'Puerta Casa', '702026#', 'Presionar # al finalizar'],
        ['Router WiFi 5G', 'Sala Principal', 'HadidaFiber2026', 'Red Hadida_5G'],
      ],
    };
    const bankingTable = {
      type: 'excel_table',
      headers: ['Banco / Entidad', 'Titular', 'Nro Cuenta / Referencia', 'Tipo Cuenta', 'Notas'],
      rows: [
        ['Banco Principal', 'JAIME HADIDA', '0102-0001-9988-7766', 'Corriente', 'Para transferencias familiares'],
        ['Banco Secundario', 'FAMILIA HADIDA', '0134-2233-4455-6677', 'Ahorros', 'Fondo de emergencias'],
      ],
    };

    const insertPwd = db.prepare(`
      INSERT OR REPLACE INTO passwords (id, website, email, password, notes, category, member_id, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPwd.run('pwd_streaming', 'Cuentas de Streaming Familiar', '', '', TABLE_PREFIX + JSON.stringify(streamingTable), 'Streaming', 'all', 'green', new Date().toISOString(), new Date().toISOString());
    insertPwd.run('pwd_accesos_hogar', 'Accesos y Códigos del Hogar', '', '', TABLE_PREFIX + JSON.stringify(homeAccessTable), 'Hogar', 'all', 'blue', new Date().toISOString(), new Date().toISOString());
    insertPwd.run('pwd_wifi', 'WiFi Red Principal (Hadida_5G)', '', '', '📶 Red: Hadida_Fiber_5G\n🔑 Clave: HadidaFamily2026!\n📌 Ubicación del Router: Sala de estar\n\nRed Invitados: Hadida_Guest (Sin clave)', 'Hogar', 'all', 'yellow', new Date().toISOString(), new Date().toISOString());
    insertPwd.run('pwd_bancos', 'Cuentas Bancarias y Referencias', '', '', TABLE_PREFIX + JSON.stringify(bankingTable), 'Finanzas', 'member_jaime', 'purple', new Date().toISOString(), new Date().toISOString());
  }

  console.log('✅ Base de datos SQLite inicializada y migrada con éxito.');
}

// ================= DAO / Helper Queries =================

export function getAllAppData(): AppData {
  const usersRows = db.prepare('SELECT id, name, username, role, avatar_color as avatarColor, avatar_initial as avatarInitial, icon_name as iconName, created_at as createdAt FROM users ORDER BY name ASC').all() as Member[];
  const listsRows = db.prepare('SELECT id, name, icon, color, description, created_by as createdBy, created_at as createdAt FROM lists ORDER BY created_at ASC').all() as CustomList[];
  const itemsRows = db.prepare('SELECT id, list_id as listId, title, category, quantity, notes, assigned_to_id as assignedToId, completed, completed_at as completedAt, created_by as createdBy, created_at as createdAt, updated_at as updatedAt, urgent FROM grocery_items ORDER BY created_at DESC').all() as any[];
  const recordsRows = db.prepare('SELECT id, member_id as memberId, category, subcategory, title, notes, record_type as recordType, file_name as fileName, file_type as fileType, file_size as fileSize, file_url as fileUrl, file_data_url as fileDataUrl, attachments_json as attachmentsJson, todos_json as todosJson, card_number as cardNumber, card_holder as cardHolder, card_exp as cardExp, card_cvc as cardCvc, card_atm_pin as cardAtmPin, card_bank as cardBank, card_brand as cardBrand, card_theme as cardTheme, card_account_no as cardAccountNo, created_at as createdAt, updated_at as updatedAt FROM personal_records ORDER BY created_at DESC').all() as any[];
  const catRows = db.prepare('SELECT id, name, icon, color, description, subcategories_json, is_default as isDefault, created_at as createdAt FROM data_categories ORDER BY is_default DESC, name ASC').all() as any[];
  const taskRows = db.prepare('SELECT id, title, description, date, time, assigned_to_id as assignedToId, completed, completed_at as completedAt, category, urgent, created_at as createdAt, updated_at as updatedAt FROM calendar_tasks ORDER BY date ASC, time ASC').all() as any[];
  const contactRows = db.prepare('SELECT id, name, phone, email, notes, address, place_name as placeName, created_at as createdAt, updated_at as updatedAt FROM contacts ORDER BY name ASC').all() as Contact[];
  const todoRows = db.prepare('SELECT id, text, completed, assigned_to_id as assignedToId, category, due_date as dueDate, completed_at as completedAt, created_at as createdAt, updated_at as updatedAt FROM todos ORDER BY created_at DESC').all() as any[];
  const passwordRows = db.prepare('SELECT id, website, email, password, notes, category, member_id as memberId, color, created_at as createdAt, updated_at as updatedAt FROM passwords ORDER BY created_at DESC').all() as PasswordItem[];
  const notifRows = db.prepare('SELECT id, recipient_id as recipientId, title, message, timestamp, read, type, item_id as itemId, list_id as listId, task_id as taskId FROM notifications ORDER BY timestamp DESC LIMIT 50').all() as any[];

  return {
    members: usersRows,
    lists: listsRows,
    items: itemsRows.map((it) => ({ ...it, completed: Boolean(it.completed), urgent: Boolean(it.urgent) })),
    personalRecords: recordsRows.map((r) => {
      let attachments = [];
      if (r.attachmentsJson) {
        try {
          attachments = JSON.parse(r.attachmentsJson);
        } catch {
          attachments = [];
        }
      }
      if (!Array.isArray(attachments) || attachments.length === 0) {
        if (r.fileUrl) {
          attachments = [{
            id: 'att_' + r.id,
            fileName: r.fileName || 'Documento adjunto',
            fileType: r.fileType || '',
            fileSize: r.fileSize || 0,
            fileUrl: r.fileUrl || '',
            fileDataUrl: '',
          }];
        } else {
          attachments = [];
        }
      } else {
        attachments = attachments.map((att: any) => ({
          ...att,
          fileDataUrl: '',
        }));
      }

      let todos = [];
      if (r.todosJson) {
        try {
          todos = JSON.parse(r.todosJson);
        } catch {
          todos = [];
        }
      }
      if (!Array.isArray(todos)) {
        todos = [];
      }

      return {
        id: r.id,
        memberId: r.memberId,
        category: r.category,
        subcategory: r.subcategory,
        title: r.title,
        notes: r.notes,
        recordType: r.recordType || (attachments.length > 0 ? 'document' : todos.length > 0 ? 'list' : 'document'),
        attachments,
        fileName: r.fileName || (attachments[0]?.fileName || ''),
        fileType: r.fileType || (attachments[0]?.fileType || ''),
        fileSize: r.fileSize || (attachments[0]?.fileSize || 0),
        fileUrl: r.fileUrl || (attachments[0]?.fileUrl || ''),
        fileDataUrl: '',
        todos,
        cardNumber: r.cardNumber,
        cardHolder: r.cardHolder,
        cardExp: r.cardExp,
        cardCvc: r.cardCvc,
        cardAtmPin: r.cardAtmPin || '',
        cardBank: r.cardBank,
        cardBrand: r.cardBrand,
        cardTheme: r.cardTheme,
        cardAccountNo: r.cardAccountNo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    }),
    dataCategories: catRows.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      description: c.description,
      subcategories: c.subcategories_json ? JSON.parse(c.subcategories_json) : [],
      isDefault: Boolean(c.isDefault),
      createdAt: c.createdAt,
    })),
    calendarTasks: taskRows.map((t) => ({ ...t, completed: Boolean(t.completed), urgent: Boolean(t.urgent) })),
    contacts: contactRows,
    todos: todoRows.map((td) => ({ ...td, completed: Boolean(td.completed) })),
    passwords: passwordRows,
    notifications: notifRows.map((n) => ({ ...n, read: Boolean(n.read) })),
  };
}

// User Queries
export function getUserById(id: string): (Member & { pin_hash: string }) | undefined {
  return db.prepare('SELECT id, name, username, pin_hash, role, avatar_color as avatarColor, avatar_initial as avatarInitial, icon_name as iconName, created_at as createdAt FROM users WHERE id = ?').get(id) as any;
}

export function getUserByUsernameOrName(identifier: string): (Member & { pin_hash: string }) | undefined {
  return db.prepare(`
    SELECT id, name, username, pin_hash, role, avatar_color as avatarColor, avatar_initial as avatarInitial, icon_name as iconName, created_at as createdAt
    FROM users
    WHERE LOWER(username) = LOWER(?) OR LOWER(name) = LOWER(?) OR id = ?
  `).get(identifier, identifier, identifier) as any;
}

export function getAllUsers(): Member[] {
  return db.prepare('SELECT id, name, username, role, avatar_color as avatarColor, avatar_initial as avatarInitial, icon_name as iconName, created_at as createdAt FROM users ORDER BY name ASC').all() as Member[];
}

export function createUser(user: { id: string; name: string; username?: string; pin: string; role?: 'admin' | 'member'; avatarColor?: string; avatarInitial?: string }): Member {
  const pinHash = hashPin(user.pin);
  const role = user.role || 'member';
  const uname = user.username || user.name.toLowerCase().replace(/\s+/g, '');
  const color = user.avatarColor || 'bg-red-600';
  const initial = user.avatarInitial || user.name[0] || '👤';
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, username, pin_hash, role, avatar_color, avatar_initial, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.name.toUpperCase(), uname, pinHash, role, color, initial, createdAt);

  return {
    id: user.id,
    name: user.name.toUpperCase(),
    username: uname,
    role,
    avatarColor: color,
    avatarInitial: initial,
    createdAt,
  };
}

export function updateUserPin(userId: string, newPin: string): boolean {
  const pinHash = hashPin(newPin);
  const result = db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(pinHash, userId);
  return result.changes > 0;
}

export function deleteUser(id: string): boolean {
  if (id === 'member_jaime') return false;
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  // Reassign orphan items to Jaime
  db.prepare('UPDATE grocery_items SET assigned_to_id = ? WHERE assigned_to_id = ?').run('member_jaime', id);
  return result.changes > 0;
}

// Items
export function insertGroceryItem(item: GroceryItem) {
  db.prepare(`
    INSERT INTO grocery_items (id, list_id, title, category, quantity, notes, assigned_to_id, completed, completed_at, created_by, created_at, updated_at, urgent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.listId,
    item.title,
    item.category || 'General',
    item.quantity || '1',
    item.notes || '',
    item.assignedToId,
    item.completed ? 1 : 0,
    item.completedAt || null,
    item.createdBy,
    item.createdAt,
    item.updatedAt,
    item.urgent ? 1 : 0
  );
}

export function updateGroceryItem(id: string, updates: Partial<GroceryItem>) {
  const current = db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(id) as any;
  if (!current) return null;

  const title = updates.title !== undefined ? updates.title : current.title;
  const listId = updates.listId !== undefined ? updates.listId : current.list_id;
  const category = updates.category !== undefined ? updates.category : current.category;
  const quantity = updates.quantity !== undefined ? updates.quantity : current.quantity;
  const notes = updates.notes !== undefined ? updates.notes : current.notes;
  const assignedToId = updates.assignedToId !== undefined ? updates.assignedToId : current.assigned_to_id;
  const completed = updates.completed !== undefined ? (updates.completed ? 1 : 0) : current.completed;
  const completedAt = updates.completed !== undefined ? (updates.completed ? (updates.completedAt || new Date().toISOString()) : null) : current.completed_at;
  const urgent = updates.urgent !== undefined ? (updates.urgent ? 1 : 0) : current.urgent;
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE grocery_items
    SET title = ?, list_id = ?, category = ?, quantity = ?, notes = ?, assigned_to_id = ?, completed = ?, completed_at = ?, urgent = ?, updated_at = ?
    WHERE id = ?
  `).run(title, listId, category, quantity, notes, assignedToId, completed, completedAt, urgent, updatedAt, id);

  return {
    id,
    listId,
    title,
    category,
    quantity,
    notes,
    assignedToId,
    completed: Boolean(completed),
    completedAt,
    createdBy: current.created_by,
    createdAt: current.created_at,
    updatedAt,
    urgent: Boolean(urgent),
  };
}

export function deleteGroceryItem(id: string): boolean {
  const res = db.prepare('DELETE FROM grocery_items WHERE id = ?').run(id);
  return res.changes > 0;
}

// Lists
export function insertCustomList(list: CustomList) {
  db.prepare(`
    INSERT INTO lists (id, name, icon, color, description, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(list.id, list.name, list.icon, list.color || 'red', list.description || '', list.createdBy || 'member_jaime', list.createdAt);
}

export function updateCustomList(id: string, updates: Partial<CustomList>) {
  const current = db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as any;
  if (!current) return null;

  const name = updates.name !== undefined ? updates.name : current.name;
  const icon = updates.icon !== undefined ? updates.icon : current.icon;
  const color = updates.color !== undefined ? updates.color : current.color;
  const description = updates.description !== undefined ? updates.description : current.description;

  db.prepare(`
    UPDATE lists SET name = ?, icon = ?, color = ?, description = ? WHERE id = ?
  `).run(name, icon, color, description, id);

  return { id, name, icon, color, description, createdBy: current.created_by, createdAt: current.created_at };
}

export function deleteCustomList(id: string): boolean {
  const listCount = db.prepare('SELECT COUNT(*) as count FROM lists').get() as { count: number };
  if (listCount.count <= 1) return false;

  db.prepare('DELETE FROM lists WHERE id = ?').run(id);
  db.prepare('DELETE FROM grocery_items WHERE list_id = ?').run(id);
  return true;
}

// Personal Records / Documents
export function insertPersonalRecord(record: PersonalRecord) {
  let attachments = record.attachments && record.attachments.length > 0
    ? record.attachments
    : (record.fileDataUrl || record.fileUrl
        ? [{
            id: 'att_' + Date.now(),
            fileName: record.fileName || 'Documento adjunto',
            fileType: record.fileType || '',
            fileSize: record.fileSize || 0,
            fileUrl: record.fileUrl || '',
            fileDataUrl: record.fileDataUrl || '',
          }]
        : []);

  // Migrate any base64 in attachments to disk file
  attachments = attachments.map((att: any, idx: number) => {
    let fileUrl = att.fileUrl || '';
    if (att.fileDataUrl && att.fileDataUrl.startsWith('data:')) {
      const savedUrl = saveBase64ToDisk(att.fileDataUrl, record.id, idx);
      if (savedUrl) fileUrl = savedUrl;
    }
    return {
      ...att,
      fileUrl,
      fileDataUrl: '', // do not save massive base64 to DB
    };
  });

  const firstAtt = attachments[0];
  const fileName = firstAtt ? firstAtt.fileName : (record.fileName || '');
  const fileType = firstAtt ? firstAtt.fileType || '' : (record.fileType || '');
  const fileSize = firstAtt ? firstAtt.fileSize || 0 : (record.fileSize || 0);
  let fileUrl = firstAtt ? firstAtt.fileUrl || '' : (record.fileUrl || '');
  if (!fileUrl && record.fileDataUrl && record.fileDataUrl.startsWith('data:')) {
    const savedUrl = saveBase64ToDisk(record.fileDataUrl, record.id, 0);
    if (savedUrl) fileUrl = savedUrl;
  }

  const attachmentsJson = JSON.stringify(attachments);
  const todosJson = JSON.stringify(record.todos || []);

  const recordType = record.recordType || (attachments.length > 0 ? 'document' : (record.todos && record.todos.length > 0 ? 'list' : 'document'));

  db.prepare(`
    INSERT OR REPLACE INTO personal_records (id, member_id, category, subcategory, title, notes, record_type, file_name, file_type, file_size, file_url, file_data_url, attachments_json, todos_json, card_number, card_holder, card_exp, card_cvc, card_atm_pin, card_bank, card_brand, card_theme, card_account_no, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.memberId,
    record.category,
    record.subcategory,
    record.title || '',
    record.notes || '',
    recordType,
    fileName,
    fileType,
    fileSize,
    fileUrl,
    '', // file_data_url is kept empty
    attachmentsJson,
    todosJson,
    record.cardNumber || '',
    record.cardHolder || '',
    record.cardExp || '',
    record.cardCvc || '',
    record.cardAtmPin || '',
    record.cardBank || '',
    record.cardBrand || '',
    record.cardTheme || 'black_vip',
    record.cardAccountNo || '',
    record.createdAt,
    record.updatedAt || null
  );
}

export function updatePersonalRecord(id: string, updates: Partial<PersonalRecord>) {
  const current = db.prepare('SELECT * FROM personal_records WHERE id = ?').get(id) as any;
  if (!current) return null;

  const memberId = updates.memberId !== undefined ? updates.memberId : current.member_id;
  const category = updates.category !== undefined ? updates.category : current.category;
  const subcategory = updates.subcategory !== undefined ? updates.subcategory : current.subcategory;
  const title = updates.title !== undefined ? updates.title : current.title;
  const notes = updates.notes !== undefined ? updates.notes : current.notes;
  const recordType = updates.recordType !== undefined ? updates.recordType : (current.record_type || 'document');

  let currentAttachments = [];
  if (current.attachments_json) {
    try {
      currentAttachments = JSON.parse(current.attachments_json);
    } catch {
      currentAttachments = [];
    }
  }

  let attachments = updates.attachments !== undefined
    ? updates.attachments
    : (currentAttachments.length > 0 ? currentAttachments : (current.file_url ? [{
        id: 'att_' + current.id,
        fileName: current.file_name || '',
        fileType: current.file_type || '',
        fileSize: current.file_size || 0,
        fileUrl: current.file_url || '',
        fileDataUrl: '',
      }] : []));

  // Migrate any base64 in attachments to disk
  attachments = attachments.map((att: any, idx: number) => {
    let fileUrl = att.fileUrl || '';
    if (att.fileDataUrl && att.fileDataUrl.startsWith('data:')) {
      const savedUrl = saveBase64ToDisk(att.fileDataUrl, id, idx);
      if (savedUrl) fileUrl = savedUrl;
    }
    return {
      ...att,
      fileUrl,
      fileDataUrl: '',
    };
  });

  const firstAtt = attachments[0];
  const fileName = firstAtt ? firstAtt.fileName : (updates.fileName !== undefined ? updates.fileName : current.file_name);
  const fileType = firstAtt ? firstAtt.fileType || '' : (updates.fileType !== undefined ? updates.fileType : current.file_type);
  const fileSize = firstAtt ? firstAtt.fileSize || 0 : (updates.fileSize !== undefined ? updates.fileSize : current.file_size);
  let fileUrl = firstAtt ? firstAtt.fileUrl || '' : (updates.fileUrl !== undefined ? updates.fileUrl : current.file_url);

  if (!fileUrl && updates.fileDataUrl && updates.fileDataUrl.startsWith('data:')) {
    const savedUrl = saveBase64ToDisk(updates.fileDataUrl, id, 0);
    if (savedUrl) fileUrl = savedUrl;
  }

  const attachmentsJson = JSON.stringify(attachments);

  let currentTodos = [];
  if (current.todos_json) {
    try {
      currentTodos = JSON.parse(current.todos_json);
    } catch {
      currentTodos = [];
    }
  }
  const todos = updates.todos !== undefined ? updates.todos : currentTodos;
  const todosJson = JSON.stringify(todos);

  const cardNumber = updates.cardNumber !== undefined ? updates.cardNumber : current.card_number;
  const cardHolder = updates.cardHolder !== undefined ? updates.cardHolder : current.card_holder;
  const cardExp = updates.cardExp !== undefined ? updates.cardExp : current.card_exp;
  const cardCvc = updates.cardCvc !== undefined ? updates.cardCvc : current.card_cvc;
  const cardAtmPin = updates.cardAtmPin !== undefined ? updates.cardAtmPin : (current.card_atm_pin || '');
  const cardBank = updates.cardBank !== undefined ? updates.cardBank : current.card_bank;
  const cardBrand = updates.cardBrand !== undefined ? updates.cardBrand : current.card_brand;
  const cardTheme = updates.cardTheme !== undefined ? updates.cardTheme : current.card_theme;
  const cardAccountNo = updates.cardAccountNo !== undefined ? updates.cardAccountNo : current.card_account_no;
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE personal_records
    SET member_id = ?, category = ?, subcategory = ?, title = ?, notes = ?, record_type = ?, file_name = ?, file_type = ?, file_size = ?, file_url = ?, file_data_url = '', attachments_json = ?, todos_json = ?, card_number = ?, card_holder = ?, card_exp = ?, card_cvc = ?, card_atm_pin = ?, card_bank = ?, card_brand = ?, card_theme = ?, card_account_no = ?, updated_at = ?
    WHERE id = ?
  `).run(
    memberId,
    category,
    subcategory,
    title,
    notes,
    recordType,
    fileName,
    fileType,
    fileSize,
    fileUrl,
    attachmentsJson,
    todosJson,
    cardNumber,
    cardHolder,
    cardExp,
    cardCvc,
    cardAtmPin,
    cardBank,
    cardBrand,
    cardTheme,
    cardAccountNo,
    updatedAt,
    id
  );

  return {
    id,
    memberId,
    category,
    subcategory,
    title,
    notes,
    recordType,
    attachments,
    fileName,
    fileType,
    fileSize,
    fileUrl,
    fileDataUrl: '',
    todos,
    cardNumber,
    cardHolder,
    cardExp,
    cardCvc,
    cardAtmPin,
    cardBank,
    cardBrand,
    cardTheme,
    cardAccountNo,
    createdAt: current.created_at,
    updatedAt,
  };
}

export function deletePersonalRecord(id: string): { success: boolean; fileUrls?: string[] } {
  const current = db.prepare('SELECT file_url, attachments_json FROM personal_records WHERE id = ?').get(id) as any;
  const fileUrls: string[] = [];
  if (current?.file_url) fileUrls.push(current.file_url);
  if (current?.attachments_json) {
    try {
      const atts = JSON.parse(current.attachments_json);
      if (Array.isArray(atts)) {
        atts.forEach((a) => {
          if (a.fileUrl && !fileUrls.includes(a.fileUrl)) {
            fileUrls.push(a.fileUrl);
          }
        });
      }
    } catch {}
  }
  const res = db.prepare('DELETE FROM personal_records WHERE id = ?').run(id);
  return { success: res.changes > 0, fileUrls };
}

// Data Categories
export function insertDataCategory(cat: DataCategory) {
  db.prepare(`
    INSERT INTO data_categories (id, name, icon, color, description, subcategories_json, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(cat.id, cat.name, cat.icon || 'folder', cat.color || '#dc2626', cat.description || '', JSON.stringify(cat.subcategories || []), cat.isDefault ? 1 : 0, cat.createdAt || new Date().toISOString());
}

export function updateDataCategory(id: string, updates: Partial<DataCategory>) {
  const current = db.prepare('SELECT * FROM data_categories WHERE id = ?').get(id) as any;
  if (!current) return null;

  const name = updates.name !== undefined ? updates.name : current.name;
  const icon = updates.icon !== undefined ? updates.icon : current.icon;
  const color = updates.color !== undefined ? updates.color : current.color;
  const description = updates.description !== undefined ? updates.description : current.description;
  const subcategoriesJson = updates.subcategories !== undefined ? JSON.stringify(updates.subcategories) : current.subcategories_json;

  db.prepare(`
    UPDATE data_categories SET name = ?, icon = ?, color = ?, description = ?, subcategories_json = ? WHERE id = ?
  `).run(name, icon, color, description, subcategoriesJson, id);

  return {
    id,
    name,
    icon,
    color,
    description,
    subcategories: JSON.parse(subcategoriesJson),
    isDefault: Boolean(current.is_default),
    createdAt: current.created_at,
  };
}

export function renameSubcategory(categoryId: string, oldSubName: string, newSubName: string, updateRecords: boolean = true) {
  const cat = db.prepare('SELECT * FROM data_categories WHERE id = ?').get(categoryId) as any;
  if (!cat) return null;

  const oldTrimmed = oldSubName.trim();
  const newTrimmed = newSubName.trim();
  const currentSubs: string[] = cat.subcategories_json ? JSON.parse(cat.subcategories_json) : [];

  let replaced = false;
  const updatedSubs = currentSubs.map((s) => {
    if (s.toLowerCase() === oldTrimmed.toLowerCase() || s.toLowerCase() === newTrimmed.toLowerCase()) {
      replaced = true;
      return newTrimmed;
    }
    return s;
  });

  if (!replaced) {
    updatedSubs.push(newTrimmed);
  }

  // Remove duplicate subcategories
  const uniqueSubs = Array.from(new Set(updatedSubs));

  db.prepare('UPDATE data_categories SET subcategories_json = ? WHERE id = ?').run(
    JSON.stringify(uniqueSubs),
    categoryId
  );

  if (updateRecords) {
    db.prepare(`
      UPDATE personal_records
      SET subcategory = ?
      WHERE (LOWER(category) = LOWER(?) OR category = ?)
        AND (LOWER(subcategory) = LOWER(?) OR subcategory = ?)
    `).run(newTrimmed, cat.name, cat.name, oldTrimmed, oldTrimmed);
  }

  return {
    id: categoryId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    description: cat.description,
    subcategories: uniqueSubs,
    isDefault: Boolean(cat.is_default),
    createdAt: cat.created_at,
  };
}

export function addSubcategoryToCategory(categoryId: string, subName: string) {
  const cat = db.prepare('SELECT * FROM data_categories WHERE id = ?').get(categoryId) as any;
  if (!cat) return null;

  const trimmed = subName.trim();
  const currentSubs: string[] = cat.subcategories_json ? JSON.parse(cat.subcategories_json) : [];

  if (!currentSubs.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
    currentSubs.push(trimmed);
    db.prepare('UPDATE data_categories SET subcategories_json = ? WHERE id = ?').run(
      JSON.stringify(currentSubs),
      categoryId
    );
  }

  return {
    id: categoryId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    description: cat.description,
    subcategories: currentSubs,
    isDefault: Boolean(cat.is_default),
    createdAt: cat.created_at,
  };
}

export function deleteSubcategoryFromCategory(categoryId: string, subName: string) {
  const cat = db.prepare('SELECT * FROM data_categories WHERE id = ?').get(categoryId) as any;
  if (!cat) return null;

  const trimmed = subName.trim().toLowerCase();
  const currentSubs: string[] = cat.subcategories_json ? JSON.parse(cat.subcategories_json) : [];
  const updatedSubs = currentSubs.filter((s) => s.toLowerCase() !== trimmed);

  db.prepare('UPDATE data_categories SET subcategories_json = ? WHERE id = ?').run(
    JSON.stringify(updatedSubs),
    categoryId
  );

  return {
    id: categoryId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    description: cat.description,
    subcategories: updatedSubs,
    isDefault: Boolean(cat.is_default),
    createdAt: cat.created_at,
  };
}

export function deleteDataCategory(id: string): boolean {
  const res = db.prepare('DELETE FROM data_categories WHERE id = ?').run(id);
  return res.changes > 0;
}

// Tasks
export function insertCalendarTask(task: CalendarTask) {
  db.prepare(`
    INSERT INTO calendar_tasks (id, title, description, date, time, assigned_to_id, completed, completed_at, category, urgent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(task.id, task.title, task.description || '', task.date, task.time || '', task.assignedToId || 'member_jaime', task.completed ? 1 : 0, task.completedAt || null, task.category || 'General', task.urgent ? 1 : 0, task.createdAt, task.updatedAt || null);
}

export function updateCalendarTask(id: string, updates: Partial<CalendarTask>) {
  const current = db.prepare('SELECT * FROM calendar_tasks WHERE id = ?').get(id) as any;
  if (!current) return null;

  const title = updates.title !== undefined ? updates.title : current.title;
  const description = updates.description !== undefined ? updates.description : current.description;
  const date = updates.date !== undefined ? updates.date : current.date;
  const time = updates.time !== undefined ? updates.time : current.time;
  const assignedToId = updates.assignedToId !== undefined ? updates.assignedToId : current.assigned_to_id;
  const completed = updates.completed !== undefined ? (updates.completed ? 1 : 0) : current.completed;
  const completedAt = updates.completed !== undefined ? (updates.completed ? (updates.completedAt || new Date().toISOString()) : null) : current.completed_at;
  const category = updates.category !== undefined ? updates.category : current.category;
  const urgent = updates.urgent !== undefined ? (updates.urgent ? 1 : 0) : current.urgent;
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE calendar_tasks
    SET title = ?, description = ?, date = ?, time = ?, assigned_to_id = ?, completed = ?, completed_at = ?, category = ?, urgent = ?, updated_at = ?
    WHERE id = ?
  `).run(title, description, date, time, assignedToId, completed, completedAt, category, urgent, updatedAt, id);

  return {
    id,
    title,
    description,
    date,
    time,
    assignedToId,
    completed: Boolean(completed),
    completedAt,
    category,
    urgent: Boolean(urgent),
    createdAt: current.created_at,
    updatedAt,
  };
}

export function deleteCalendarTask(id: string): boolean {
  const res = db.prepare('DELETE FROM calendar_tasks WHERE id = ?').run(id);
  return res.changes > 0;
}

// Contacts
export function insertContact(contact: Contact) {
  db.prepare(`
    INSERT INTO contacts (id, name, phone, email, notes, address, place_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(contact.id, contact.name, contact.phone, contact.email || '', contact.notes || '', contact.address || '', contact.placeName || '', contact.createdAt, contact.updatedAt || null);
}

export function updateContact(id: string, updates: Partial<Contact>) {
  const current = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any;
  if (!current) return null;

  const name = updates.name !== undefined ? updates.name : current.name;
  const phone = updates.phone !== undefined ? updates.phone : current.phone;
  const email = updates.email !== undefined ? updates.email : current.email;
  const notes = updates.notes !== undefined ? updates.notes : current.notes;
  const address = updates.address !== undefined ? updates.address : current.address;
  const placeName = updates.placeName !== undefined ? updates.placeName : current.place_name;
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE contacts SET name = ?, phone = ?, email = ?, notes = ?, address = ?, place_name = ?, updated_at = ? WHERE id = ?
  `).run(name, phone, email, notes, address, placeName, updatedAt, id);

  return { id, name, phone, email, notes, address, placeName, createdAt: current.created_at, updatedAt };
}

export function deleteContact(id: string): boolean {
  const res = db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return res.changes > 0;
}

// Todos
export function insertTodo(todo: TodoItem) {
  db.prepare(`
    INSERT INTO todos (id, text, completed, assigned_to_id, category, due_date, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(todo.id, todo.text, todo.completed ? 1 : 0, todo.assignedToId || 'all', todo.category || 'General', todo.dueDate || null, todo.completedAt || null, todo.createdAt, todo.updatedAt || null);
}

export function updateTodo(id: string, updates: Partial<TodoItem>) {
  const current = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as any;
  if (!current) return null;

  const text = updates.text !== undefined ? updates.text : current.text;
  const completed = updates.completed !== undefined ? (updates.completed ? 1 : 0) : current.completed;
  const completedAt = updates.completed !== undefined ? (updates.completed ? (updates.completedAt || new Date().toISOString()) : null) : current.completed_at;
  const assignedToId = updates.assignedToId !== undefined ? updates.assignedToId : current.assigned_to_id;
  const category = updates.category !== undefined ? updates.category : current.category;
  const dueDate = updates.dueDate !== undefined ? updates.dueDate : current.due_date;
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE todos SET text = ?, completed = ?, completed_at = ?, assigned_to_id = ?, category = ?, due_date = ?, updated_at = ? WHERE id = ?
  `).run(text, completed, completedAt, assignedToId, category, dueDate, updatedAt, id);

  return {
    id,
    text,
    completed: Boolean(completed),
    completedAt,
    assignedToId,
    category,
    dueDate,
    createdAt: current.created_at,
    updatedAt,
  };
}

export function deleteTodo(id: string): boolean {
  const res = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  return res.changes > 0;
}

export function clearCompletedTodos() {
  db.prepare('DELETE FROM todos WHERE completed = 1').run();
}

// Notifications
export function insertNotification(n: PushNotification) {
  db.prepare(`
    INSERT INTO notifications (id, recipient_id, title, message, timestamp, read, type, item_id, list_id, task_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(n.id, n.recipientId, n.title, n.message, n.timestamp, n.read ? 1 : 0, n.type, n.itemId || null, n.listId || null, n.taskId || null);
}

export function markNotificationsAsRead(recipientId?: string, notificationId?: string) {
  if (notificationId) {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notificationId);
  } else if (recipientId) {
    db.prepare('UPDATE notifications SET read = 1 WHERE recipient_id = ? OR recipient_id = "all"').run(recipientId);
  }
}

// Passwords
export function insertPassword(item: PasswordItem) {
  db.prepare(`
    INSERT INTO passwords (id, website, email, password, notes, category, member_id, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    item.website,
    item.email || '',
    item.password || '',
    item.notes || '',
    item.category || 'General',
    item.memberId || 'all',
    item.color || 'yellow',
    item.createdAt,
    item.updatedAt || null
  );
}

export function updatePassword(id: string, updates: Partial<PasswordItem>) {
  const current = db.prepare('SELECT * FROM passwords WHERE id = ?').get(id) as any;
  if (!current) return null;

  const website = updates.website !== undefined ? updates.website : current.website;
  const email = updates.email !== undefined ? updates.email : current.email;
  const password = updates.password !== undefined ? updates.password : current.password;
  const notes = updates.notes !== undefined ? updates.notes : current.notes;
  const category = updates.category !== undefined ? updates.category : current.category;
  const memberId = updates.memberId !== undefined ? updates.memberId : current.member_id;
  const color = updates.color !== undefined ? updates.color : (current.color || 'yellow');
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE passwords
    SET website = ?, email = ?, password = ?, notes = ?, category = ?, member_id = ?, color = ?, updated_at = ?
    WHERE id = ?
  `).run(website, email, password, notes, category, memberId, color, updatedAt, id);

  return {
    id,
    website,
    email,
    password,
    notes,
    category,
    memberId,
    color,
    createdAt: current.created_at,
    updatedAt,
  };
}

export function deletePassword(id: string): boolean {
  const res = db.prepare('DELETE FROM passwords WHERE id = ?').run(id);
  return res.changes > 0;
}
