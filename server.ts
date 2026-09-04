import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import multer from 'multer';
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
import {
  initDatabase,
  getAllAppData,
  getUserById,
  getUserByUsernameOrName,
  getAllUsers,
  createUser,
  updateUserPin,
  deleteUser,
  comparePin,
  insertGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  insertCustomList,
  updateCustomList,
  deleteCustomList,
  insertPersonalRecord,
  updatePersonalRecord,
  deletePersonalRecord,
  insertDataCategory,
  updateDataCategory,
  deleteDataCategory,
  insertCalendarTask,
  updateCalendarTask,
  deleteCalendarTask,
  insertContact,
  updateContact,
  deleteContact,
  insertTodo,
  updateTodo,
  deleteTodo,
  clearCompletedTodos,
  insertNotification,
  markNotificationsAsRead,
} from './database.ts';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'hadida_family_secure_jwt_secret_key_2026';
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage setup for document/image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Initialize SQLite database
initDatabase();

// Auth Middleware helpers
export interface AuthRequest extends Request {
  user?: Member;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.headers['x-auth-token']) {
    return req.headers['x-auth-token'] as string;
  }
  if (req.query && req.query.token) {
    return req.query.token as string;
  }
  return null;
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Por favor inicia sesión.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string; role: 'admin' | 'member' };
    const user = getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado o sesión inválida.' });
    }
    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      avatarColor: user.avatarColor,
      avatarInitial: user.avatarInitial,
      iconName: user.iconName,
      createdAt: user.createdAt,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión expirada o token inválido.' });
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado: Solo el administrador (Jaime) tiene permisos para realizar esta acción.',
      });
    }
    next();
  });
}

function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string; role: 'admin' | 'member' };
      const user = getUserById(decoded.id);
      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          avatarColor: user.avatarColor,
          avatarInitial: user.avatarInitial,
          iconName: user.iconName,
          createdAt: user.createdAt,
        };
      }
    } catch {
      // Ignore invalid optional token
    }
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use('/uploads', express.static(UPLOADS_DIR));

  const server = http.createServer(app);

  // WebSocket Server setup
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  function broadcast(type: string, payload: any) {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on('connection', (ws) => {
    // Send full initial state to newly connected client
    const currentData = getAllAppData();
    ws.send(JSON.stringify({ type: 'INIT_SYNC', payload: currentData }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        console.log('WS received message:', msg.type);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    });
  });

  // ================= AUTHENTICATION & USERS ROUTES =================

  // POST /api/auth/login - Secure login with PIN/Password
  app.post('/api/auth/login', (req, res) => {
    const { memberId, username, pin } = req.body;

    if (!pin || (!memberId && !username)) {
      return res.status(400).json({ error: 'Se requiere el usuario y el PIN de acceso.' });
    }

    const identifier = memberId || username;
    const user = getUserByUsernameOrName(identifier);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = comparePin(String(pin).trim(), user.pin_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'PIN o contraseña incorrecta.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userProfile: Member = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      avatarColor: user.avatarColor,
      avatarInitial: user.avatarInitial,
      iconName: user.iconName,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      token,
      user: userProfile,
    });
  });

  // GET /api/auth/me - Verify current session
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // POST /api/auth/users - Create new member (ADMIN ONLY: Jaime)
  app.post('/api/auth/users', requireAdmin, (req: AuthRequest, res) => {
    const { name, pin, role, avatarColor, avatarInitial } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del integrante es requerido.' });
    }

    const userPin = pin && String(pin).trim().length >= 4 ? String(pin).trim() : '1474';
    const newId = 'member_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    try {
      const newUser = createUser({
        id: newId,
        name: name.trim(),
        pin: userPin,
        role: role === 'admin' ? 'admin' : 'member',
        avatarColor: avatarColor || 'bg-red-600',
        avatarInitial: avatarInitial || name.trim()[0]?.toUpperCase() || '👤',
      });

      broadcast('MEMBER_ADDED', { member: newUser });
      res.status(201).json(newUser);
    } catch (err: any) {
      console.error('Error creating user:', err);
      res.status(500).json({ error: 'Error al crear el usuario en la base de datos.' });
    }
  });

  // DELETE /api/auth/users/:id - Delete member (ADMIN ONLY: Jaime)
  app.delete('/api/auth/users/:id', requireAdmin, (req: AuthRequest, res) => {
    const { id } = req.params;

    if (id === 'member_jaime' || (req.user && req.user.id === id)) {
      return res.status(400).json({ error: 'No se puede eliminar al Administrador principal.' });
    }

    const success = deleteUser(id);
    if (!success) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    broadcast('MEMBER_DELETED', { memberId: id });
    res.json({ success: true, memberId: id });
  });

  // PUT /api/auth/change-pin - Change current user's PIN
  app.put('/api/auth/change-pin', requireAuth, (req: AuthRequest, res) => {
    const { currentPin, newPin } = req.body;

    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ error: 'El nuevo PIN debe tener al menos 4 dígitos.' });
    }

    const user = getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Admins can bypass currentPin if resetting
    if (req.user!.role !== 'admin' || currentPin) {
      if (!currentPin || !comparePin(String(currentPin).trim(), user.pin_hash)) {
        return res.status(401).json({ error: 'El PIN actual es incorrecto.' });
      }
    }

    updateUserPin(user.id, String(newPin).trim());
    res.json({ success: true, message: 'PIN actualizado correctamente.' });
  });

  // Legacy members route compatibility
  app.post('/api/members', optionalAuth, (req: AuthRequest, res) => {
    // If not authenticated as admin, allow creation if no users exist or fallback
    const { name, avatarColor, pin } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const newMember = createUser({
      id: 'member_' + Date.now(),
      name: name.trim(),
      pin: pin || '1474',
      role: 'member',
      avatarColor: avatarColor || 'bg-red-600',
    });

    broadcast('MEMBER_ADDED', { member: newMember });
    res.status(201).json(newMember);
  });

  app.delete('/api/members/:id', optionalAuth, (req: AuthRequest, res) => {
    const { id } = req.params;
    if (id === 'member_jaime') {
      return res.status(400).json({ error: 'No se puede eliminar al Administrador principal' });
    }

    deleteUser(id);
    broadcast('MEMBER_DELETED', { memberId: id });
    res.json({ success: true, memberId: id });
  });

  // ================= FILE UPLOAD ROUTE (ADMIN ONLY) =================

  // POST /api/upload - Upload file to disk storage (Admin only)
  app.post('/api/upload', requireAdmin, upload.single('file'), (req: AuthRequest, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      fileName: req.file.originalname,
      fileUrl,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });
  });

  // GET /api/files/:filename - Serve file preview/download
  app.get('/api/files/:filename', (req, res) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado.' });
    }
    res.sendFile(filePath);
  });

  // ================= GENERAL DATA =================

  // GET /api/data - Get complete state
  app.get('/api/data', (_req, res) => {
    const fullData = getAllAppData();
    res.json(fullData);
  });

  // ================= GROCERY ITEMS ROUTES =================

  // POST /api/items - Add grocery item
  app.post('/api/items', (req, res) => {
    const { title, category, quantity, notes, assignedToId, urgent, listId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título del producto es requerido' });
    }

    const allData = getAllAppData();
    const targetListId = listId || (allData.lists && allData.lists[0] ? allData.lists[0].id : 'list_supermercado');

    const newItem: GroceryItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      listId: targetListId,
      title: title.trim(),
      category: category || 'General',
      quantity: quantity || '1',
      notes: notes || '',
      assignedToId: assignedToId || 'member_jaime',
      completed: false,
      createdBy: 'member_jaime',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      urgent: !!urgent,
    };

    insertGroceryItem(newItem);

    // Create a push notification
    const assignedMember = allData.members.find((m) => m.id === newItem.assignedToId);
    const targetList = allData.lists.find((l) => l.id === targetListId);
    const listName = targetList ? targetList.name : 'Supermercado';

    const notif: PushNotification = {
      id: 'notif_' + Date.now(),
      recipientId: newItem.assignedToId,
      title: `🛒 ${listName}: Nuevo producto`,
      message: `${newItem.title} (${newItem.quantity || '1'}) asignado a ${assignedMember ? assignedMember.name : 'ti'}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'item_assigned',
      itemId: newItem.id,
      listId: targetListId,
    };
    insertNotification(notif);

    broadcast('ITEM_ADDED', { item: newItem });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newItem);
  });

  // PUT /api/items/:id - Update grocery item
  app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const updated = updateGroceryItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    broadcast('ITEM_UPDATED', { item: updated });
    res.json(updated);
  });

  // DELETE /api/items/:id - Delete item
  app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    deleteGroceryItem(id);
    broadcast('ITEM_DELETED', { itemId: id });
    res.json({ success: true, itemId: id });
  });

  // ================= CUSTOM LISTS ROUTES =================

  // POST /api/lists - Create custom list
  app.post('/api/lists', (req, res) => {
    const { name, icon, color, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la lista es requerido' });
    }

    const newList: CustomList = {
      id: 'list_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      icon: icon || '📋',
      color: color || 'red',
      description: description?.trim() || '',
      createdBy: 'member_jaime',
      createdAt: new Date().toISOString(),
    };

    insertCustomList(newList);

    const notif: PushNotification = {
      id: 'notif_' + Date.now(),
      recipientId: 'all',
      title: '📋 Nueva Lista Creada',
      message: `Se creó la lista: "${newList.name}"`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'list_created',
      listId: newList.id,
    };
    insertNotification(notif);

    broadcast('LIST_CREATED', { list: newList });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newList);
  });

  // PUT /api/lists/:id - Update custom list
  app.put('/api/lists/:id', (req, res) => {
    const { id } = req.params;
    const updated = updateCustomList(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Lista no encontrada' });
    }

    broadcast('LIST_UPDATED', { list: updated });
    res.json(updated);
  });

  // DELETE /api/lists/:id - Delete custom list
  app.delete('/api/lists/:id', (req, res) => {
    const { id } = req.params;
    const success = deleteCustomList(id);
    if (!success) {
      return res.status(400).json({ error: 'No se puede eliminar la única lista restante' });
    }

    broadcast('LIST_DELETED', { listId: id });
    res.json({ success: true, listId: id });
  });

  // ================= CALENDAR TASKS ROUTES =================

  // GET /api/tasks
  app.get('/api/tasks', (_req, res) => {
    const data = getAllAppData();
    res.json(data.calendarTasks || []);
  });

  // POST /api/tasks - Create task
  app.post('/api/tasks', (req, res) => {
    const { title, description, date, time, assignedToId, category, urgent } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título de la tarea es requerido' });
    }

    const newTask: CalendarTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      description: description?.trim() || '',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '',
      assignedToId: assignedToId || 'member_jaime',
      completed: false,
      category: category || 'General',
      urgent: !!urgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    insertCalendarTask(newTask);

    const allData = getAllAppData();
    const assignedMember = allData.members.find((m) => m.id === newTask.assignedToId);
    const notif: PushNotification = {
      id: 'notif_' + Date.now(),
      recipientId: newTask.assignedToId,
      title: `📅 Nueva Tarea (${newTask.date})`,
      message: `${newTask.title} asignada a ${assignedMember ? assignedMember.name : 'ti'}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'task_created',
      taskId: newTask.id,
    };
    insertNotification(notif);

    broadcast('TASK_ADDED', { task: newTask });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newTask);
  });

  // PUT /api/tasks/:id - Update task
  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const updated = updateCalendarTask(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    broadcast('TASK_UPDATED', { task: updated });
    res.json(updated);
  });

  // DELETE /api/tasks/:id - Delete task
  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    deleteCalendarTask(id);
    broadcast('TASK_DELETED', { taskId: id });
    res.json({ success: true, taskId: id });
  });

  // ================= CONTACTS DIRECTORY ROUTES =================

  // GET /api/contacts
  app.get('/api/contacts', (_req, res) => {
    const data = getAllAppData();
    res.json(data.contacts || []);
  });

  // POST /api/contacts - Create contact
  app.post('/api/contacts', (req, res) => {
    const { name, phone, email, notes, address, placeName } = req.body;
    if (!name || !name.trim() || !phone || !phone.trim()) {
      return res.status(400).json({ error: 'El nombre y teléfono son obligatorios' });
    }

    const newContact: Contact = {
      id: 'contact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      notes: notes?.trim() || '',
      address: address?.trim() || '',
      placeName: placeName?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    insertContact(newContact);
    broadcast('CONTACT_ADDED', { contact: newContact });
    res.status(201).json(newContact);
  });

  // PUT /api/contacts/:id - Update contact
  app.put('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    const updated = updateContact(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    broadcast('CONTACT_UPDATED', { contact: updated });
    res.json(updated);
  });

  // DELETE /api/contacts/:id - Delete contact
  app.delete('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    deleteContact(id);
    broadcast('CONTACT_DELETED', { contactId: id });
    res.json({ success: true, contactId: id });
  });

  // ================= MINIMALIST TO-DO LIST ROUTES =================

  // GET /api/todos
  app.get('/api/todos', (_req, res) => {
    const data = getAllAppData();
    res.json(data.todos || []);
  });

  // POST /api/todos - Create todo
  app.post('/api/todos', (req, res) => {
    const { text, assignedToId, category, dueDate } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'El texto de la tarea es obligatorio' });
    }

    const newTodo: TodoItem = {
      id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: text.trim(),
      completed: false,
      assignedToId: assignedToId || 'all',
      category: category || 'General',
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    insertTodo(newTodo);
    broadcast('TODO_ADDED', { todo: newTodo });
    res.status(201).json(newTodo);
  });

  // PUT /api/todos/:id - Update todo
  app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    const updated = updateTodo(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    broadcast('TODO_UPDATED', { todo: updated });
    res.json(updated);
  });

  // DELETE /api/todos/:id - Delete single todo
  app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    deleteTodo(id);
    broadcast('TODO_DELETED', { todoId: id });
    res.json({ success: true, todoId: id });
  });

  // POST /api/todos/clear-completed - Clear all completed todos
  app.post('/api/todos/clear-completed', (_req, res) => {
    clearCompletedTodos();
    broadcast('TODOS_CLEARED_COMPLETED', {});
    res.json({ success: true });
  });

  // ================= PERSONAL RECORDS & DOCUMENTS ROUTES =================

  // GET /api/personal-records - View documents (Available for all authenticated members)
  app.get('/api/personal-records', (_req, res) => {
    const data = getAllAppData();
    res.json(data.personalRecords || []);
  });

  // POST /api/personal-records - Add personal record / document (ADMIN ONLY: Jaime)
  app.post('/api/personal-records', requireAdmin, (req: AuthRequest, res) => {
    const {
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
    } = req.body;

    if (!memberId || !category || !subcategory) {
      return res.status(400).json({ error: 'El integrante, la categoría y la subcategoría son requeridos' });
    }

    const newRecord: PersonalRecord = {
      id: 'precord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      memberId,
      category: category.trim(),
      subcategory: subcategory.trim(),
      title: title ? title.trim() : subcategory.trim(),
      notes: notes || '',
      fileName: fileName || '',
      fileType: fileType || '',
      fileSize: fileSize || 0,
      fileUrl: fileUrl || '',
      fileDataUrl: fileDataUrl || '',
      cardNumber: cardNumber || '',
      cardHolder: cardHolder || '',
      cardExp: cardExp || '',
      cardCvc: cardCvc || '',
      cardBank: cardBank || '',
      cardBrand: cardBrand || undefined,
      cardTheme: cardTheme || 'black_vip',
      cardAccountNo: cardAccountNo || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    insertPersonalRecord(newRecord);

    const allData = getAllAppData();
    const member = allData.members.find((m) => m.id === memberId);
    const memberName = member ? member.name : 'un integrante';

    const notif: PushNotification = {
      id: 'notif_' + Date.now(),
      recipientId: 'all',
      title: '📁 Dato Personal Registrado',
      message: `Se adjuntó ${newRecord.category} (${newRecord.subcategory}) para ${memberName}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'personal_data_added',
    };
    insertNotification(notif);

    broadcast('PERSONAL_RECORD_ADDED', { record: newRecord });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newRecord);
  });

  // PUT /api/personal-records/:id - Update personal record (ADMIN ONLY: Jaime)
  app.put('/api/personal-records/:id', requireAdmin, (req: AuthRequest, res) => {
    const { id } = req.params;
    const updated = updatePersonalRecord(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    broadcast('PERSONAL_RECORD_UPDATED', { record: updated });
    res.json(updated);
  });

  // DELETE /api/personal-records/:id - Delete personal record (ADMIN ONLY: Jaime)
  app.delete('/api/personal-records/:id', requireAdmin, (req: AuthRequest, res) => {
    const { id } = req.params;
    const { success, fileUrl } = deletePersonalRecord(id);

    if (!success) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    // Clean up disk file if present
    if (fileUrl && fileUrl.startsWith('/uploads/')) {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Error deleting file from disk:', e);
        }
      }
    }

    broadcast('PERSONAL_RECORD_DELETED', { recordId: id });
    res.json({ success: true, recordId: id });
  });

  // ================= DATA CATEGORIES & SUBCATEGORIES ROUTES =================

  // GET /api/data-categories
  app.get('/api/data-categories', (_req, res) => {
    const data = getAllAppData();
    res.json(data.dataCategories || []);
  });

  // POST /api/data-categories - Add new category (Admin only)
  app.post('/api/data-categories', requireAdmin, (req: AuthRequest, res) => {
    const { name, icon, color, description, subcategories } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
    }

    const newCategory: DataCategory = {
      id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      icon: icon || 'folder',
      color: color || '#dc2626',
      description: description?.trim() || '',
      subcategories: Array.isArray(subcategories)
        ? subcategories.filter((s: string) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim())
        : [],
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    insertDataCategory(newCategory);
    broadcast('DATA_CATEGORY_ADDED', { category: newCategory });
    res.status(201).json(newCategory);
  });

  // PUT /api/data-categories/:id - Update category (Admin only)
  app.put('/api/data-categories/:id', requireAdmin, (req: AuthRequest, res) => {
    const { id } = req.params;
    const updated = updateDataCategory(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    broadcast('DATA_CATEGORY_UPDATED', { category: updated });
    res.json(updated);
  });

  // PUT /api/data-categories/:id/subcategories/rename - Rename a subcategory (Admin only)
  app.put('/api/data-categories/:id/subcategories/rename', requireAdmin, (req: AuthRequest, res) => {
    const { id } = req.params;
    const { oldSubcategoryName, newSubcategoryName } = req.body;

    if (!oldSubcategoryName || !newSubcategoryName || !newSubcategoryName.trim()) {
      return res.status(400).json({ error: 'Nombres de subcategoría anterior y nuevo requeridos' });
    }

    const allData = getAllAppData();
    const cat = allData.dataCategories?.find((c) => c.id === id);
    if (!cat) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const oldTrimmed = oldSubcategoryName.trim();
    const newTrimmed = newSubcategoryName.trim();
    const updatedSubs = (cat.subcategories || []).map((s) => (s.toLowerCase() === oldTrimmed.toLowerCase() ? newTrimmed : s));

    const updated = updateDataCategory(id, { subcategories: updatedSubs });
    broadcast('DATA_CATEGORY_UPDATED', { category: updated });
    res.json(updated);
  });

  // POST /api/data-categories/:id/subcategories - Add subcategory (Admin only)
  app.post('/api/data-categories/:id/subcategories', requireAdmin, (req: AuthRequest, res) => {
    const { id } = req.params;
    const { subcategoryName } = req.body;

    if (!subcategoryName || !subcategoryName.trim()) {
      return res.status(400).json({ error: 'El nombre de la subcategoría es obligatorio' });
    }

    const allData = getAllAppData();
    const cat = allData.dataCategories?.find((c) => c.id === id);
    if (!cat) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const trimmed = subcategoryName.trim();
    const currentSubs = cat.subcategories || [];
    if (!currentSubs.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      currentSubs.push(trimmed);
      const updated = updateDataCategory(id, { subcategories: currentSubs });
      broadcast('DATA_CATEGORY_UPDATED', { category: updated });
      return res.json(updated);
    }

    res.json(cat);
  });

  // DELETE /api/data-categories/:id/subcategories/:subName - Remove subcategory (Admin only)
  app.delete('/api/data-categories/:id/subcategories/:subName', requireAdmin, (req: AuthRequest, res) => {
    const { id, subName } = req.params;
    const decodedSubName = decodeURIComponent(subName);

    const allData = getAllAppData();
    const cat = allData.dataCategories?.find((c) => c.id === id);
    if (!cat) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const updatedSubs = (cat.subcategories || []).filter((s) => s.toLowerCase() !== decodedSubName.toLowerCase());
    const updated = updateDataCategory(id, { subcategories: updatedSubs });
    broadcast('DATA_CATEGORY_UPDATED', { category: updated });
    res.json(updated);
  });

  // DELETE /api/data-categories/:id - Delete category (Admin only)
  app.delete('/api/data-categories/:id', requireAdmin, (req: AuthRequest, res) => {
    const { id } = req.params;
    deleteDataCategory(id);
    broadcast('DATA_CATEGORY_DELETED', { categoryId: id });
    res.json({ success: true, categoryId: id });
  });

  // ================= NOTIFICATIONS =================

  // POST /api/notifications/send - Admin push alert trigger
  app.post('/api/notifications/send', (req, res) => {
    const { recipientId, title, message } = req.body;

    if (!recipientId || !title || !message) {
      return res.status(400).json({ error: 'Destinatario, título y mensaje son requeridos' });
    }

    const notif: PushNotification = {
      id: 'notif_' + Date.now(),
      recipientId,
      title: title.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      type: 'admin_alert',
    };

    insertNotification(notif);
    broadcast('PUSH_NOTIFICATION', { notification: notif });
    res.status(201).json(notif);
  });

  // POST /api/notifications/read - Mark notifications read
  app.post('/api/notifications/read', (req, res) => {
    const { memberId, notificationId } = req.body;
    markNotificationsAsRead(memberId, notificationId);
    broadcast('NOTIFICATIONS_READ', { memberId, notificationId });
    res.json({ success: true });
  });

  // ================= SPA / VITE MIDDLEWARE =================

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🛒 Familia Hadida App running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
