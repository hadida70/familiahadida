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
} from './src/types.ts';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'database.sqlite');
const LEGACY_JSON_FILE = process.env.DB_FILE || path.join(process.cwd(), 'groceries_db.json');
const DEFAULT_PIN = '1474';

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Optimize SQLite for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
      file_name TEXT DEFAULT '',
      file_type TEXT DEFAULT '',
      file_size INTEGER DEFAULT 0,
      file_url TEXT DEFAULT '',
      file_data_url TEXT DEFAULT '',
      card_number TEXT DEFAULT '',
      card_holder TEXT DEFAULT '',
      card_exp TEXT DEFAULT '',
      card_cvc TEXT DEFAULT '',
      card_bank TEXT DEFAULT '',
      card_brand TEXT DEFAULT '',
      card_theme TEXT DEFAULT 'black_vip',
      card_account_no TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

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

  // Seed or Migrate if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedOrMigrateFromLegacy();
  }
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
          subcategories: ['Cédula / DNI', 'Pasaporte', 'Partida de Nacimiento', 'Licencia de Conducir', 'Visas / Residencia / Teudat Zehut', 'Libreta Militar'],
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
          subcategories: ['Tarjeta de Crédito', 'Tarjeta de Débito', 'Tarjetas de Crédito / Débito', 'Cuentas Bancarias', 'Declaraciones de Impuestos', 'Comprobantes de Pago', 'Inversiones y Ahorros', 'Préstamos y Créditos'],
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

  console.log('✅ Base de datos SQLite inicializada y migrada con éxito.');
}

// ================= DAO / Helper Queries =================

export function getAllAppData(): AppData {
  const usersRows = db.prepare('SELECT id, name, username, role, avatar_color as avatarColor, avatar_initial as avatarInitial, icon_name as iconName, created_at as createdAt FROM users ORDER BY name ASC').all() as Member[];
  const listsRows = db.prepare('SELECT id, name, icon, color, description, created_by as createdBy, created_at as createdAt FROM lists ORDER BY created_at ASC').all() as CustomList[];
  const itemsRows = db.prepare('SELECT id, list_id as listId, title, category, quantity, notes, assigned_to_id as assignedToId, completed, completed_at as completedAt, created_by as createdBy, created_at as createdAt, updated_at as updatedAt, urgent FROM grocery_items ORDER BY created_at DESC').all() as any[];
  const recordsRows = db.prepare('SELECT id, member_id as memberId, category, subcategory, title, notes, file_name as fileName, file_type as fileType, file_size as fileSize, file_url as fileUrl, file_data_url as fileDataUrl, card_number as cardNumber, card_holder as cardHolder, card_exp as cardExp, card_cvc as cardCvc, card_bank as cardBank, card_brand as cardBrand, card_theme as cardTheme, card_account_no as cardAccountNo, created_at as createdAt, updated_at as updatedAt FROM personal_records ORDER BY created_at DESC').all() as any[];
  const catRows = db.prepare('SELECT id, name, icon, color, description, subcategories_json, is_default as isDefault, created_at as createdAt FROM data_categories ORDER BY is_default DESC, name ASC').all() as any[];
  const taskRows = db.prepare('SELECT id, title, description, date, time, assigned_to_id as assignedToId, completed, completed_at as completedAt, category, urgent, created_at as createdAt, updated_at as updatedAt FROM calendar_tasks ORDER BY date ASC, time ASC').all() as any[];
  const contactRows = db.prepare('SELECT id, name, phone, email, notes, address, place_name as placeName, created_at as createdAt, updated_at as updatedAt FROM contacts ORDER BY name ASC').all() as Contact[];
  const todoRows = db.prepare('SELECT id, text, completed, assigned_to_id as assignedToId, category, due_date as dueDate, completed_at as completedAt, created_at as createdAt, updated_at as updatedAt FROM todos ORDER BY created_at DESC').all() as any[];
  const notifRows = db.prepare('SELECT id, recipient_id as recipientId, title, message, timestamp, read, type, item_id as itemId, list_id as listId, task_id as taskId FROM notifications ORDER BY timestamp DESC LIMIT 50').all() as any[];

  return {
    members: usersRows,
    lists: listsRows,
    items: itemsRows.map((it) => ({ ...it, completed: Boolean(it.completed), urgent: Boolean(it.urgent) })),
    personalRecords: recordsRows,
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
  db.prepare(`
    INSERT INTO personal_records (id, member_id, category, subcategory, title, notes, file_name, file_type, file_size, file_url, file_data_url, card_number, card_holder, card_exp, card_cvc, card_bank, card_brand, card_theme, card_account_no, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.memberId,
    record.category,
    record.subcategory,
    record.title || '',
    record.notes || '',
    record.fileName || '',
    record.fileType || '',
    record.fileSize || 0,
    record.fileUrl || '',
    record.fileDataUrl || '',
    record.cardNumber || '',
    record.cardHolder || '',
    record.cardExp || '',
    record.cardCvc || '',
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
  const fileName = updates.fileName !== undefined ? updates.fileName : current.file_name;
  const fileType = updates.fileType !== undefined ? updates.fileType : current.file_type;
  const fileSize = updates.fileSize !== undefined ? updates.fileSize : current.file_size;
  const fileUrl = updates.fileUrl !== undefined ? updates.fileUrl : current.file_url;
  const fileDataUrl = updates.fileDataUrl !== undefined ? updates.fileDataUrl : current.file_data_url;
  const cardNumber = updates.cardNumber !== undefined ? updates.cardNumber : current.card_number;
  const cardHolder = updates.cardHolder !== undefined ? updates.cardHolder : current.card_holder;
  const cardExp = updates.cardExp !== undefined ? updates.cardExp : current.card_exp;
  const cardCvc = updates.cardCvc !== undefined ? updates.cardCvc : current.card_cvc;
  const cardBank = updates.cardBank !== undefined ? updates.cardBank : current.card_bank;
  const cardBrand = updates.cardBrand !== undefined ? updates.cardBrand : current.card_brand;
  const cardTheme = updates.cardTheme !== undefined ? updates.cardTheme : current.card_theme;
  const cardAccountNo = updates.cardAccountNo !== undefined ? updates.cardAccountNo : current.card_account_no;
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE personal_records
    SET member_id = ?, category = ?, subcategory = ?, title = ?, notes = ?, file_name = ?, file_type = ?, file_size = ?, file_url = ?, file_data_url = ?, card_number = ?, card_holder = ?, card_exp = ?, card_cvc = ?, card_bank = ?, card_brand = ?, card_theme = ?, card_account_no = ?, updated_at = ?
    WHERE id = ?
  `).run(
    memberId,
    category,
    subcategory,
    title,
    notes,
    fileName,
    fileType,
    fileSize,
    fileUrl,
    fileDataUrl,
    cardNumber,
    cardHolder,
    cardExp,
    cardCvc,
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
    fileName,
    fileType,
    fileSize,
    fileUrl,
    fileDataUrl,
    cardNumber,
    cardHolder,
    cardExp,
    cardCvc,
    cardBank,
    cardBrand,
    cardTheme,
    cardAccountNo,
    createdAt: current.created_at,
    updatedAt,
  };
}

export function deletePersonalRecord(id: string): { success: boolean; fileUrl?: string } {
  const current = db.prepare('SELECT file_url FROM personal_records WHERE id = ?').get(id) as any;
  const res = db.prepare('DELETE FROM personal_records WHERE id = ?').run(id);
  return { success: res.changes > 0, fileUrl: current?.file_url };
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
