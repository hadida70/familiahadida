import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
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
} from './src/types';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'groceries_db.json');

// Initial seed data with members, default Supermercado list, contacts, and calendar tasks
const INITIAL_DATA: AppData = {
  members: [
    {
      id: 'member_jaime',
      name: 'JAIME',
      role: 'admin',
      avatarColor: 'bg-orange-500',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'member_sofi',
      name: 'SOFI',
      role: 'member',
      avatarColor: 'bg-purple-600',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'member_stephanie',
      name: 'STEPHANIE',
      role: 'member',
      avatarColor: 'bg-pink-600',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'member_sharon',
      name: 'SHARON',
      role: 'member',
      avatarColor: 'bg-rose-600',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'member_shirly',
      name: 'SHIRLY',
      role: 'member',
      avatarColor: 'bg-amber-500',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'member_moises',
      name: 'MOISES',
      role: 'member',
      avatarColor: 'bg-blue-600',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'member_mercedes',
      name: 'MERCEDES',
      role: 'member',
      avatarColor: 'bg-emerald-600',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'member_simon',
      name: 'SIMON',
      role: 'member',
      avatarColor: 'bg-red-600',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    },
  ],
  lists: [
    {
      id: 'list_supermercado',
      name: 'Supermercado',
      icon: '🛒',
      color: 'red',
      description: 'Compras del hogar y supermercado',
      createdAt: new Date().toISOString(),
    },
  ],
  items: [],
  personalRecords: [],
  dataCategories: [
    {
      id: 'cat_identificacion',
      name: 'Documentos de Identidad',
      icon: 'id-card',
      color: '#2563eb',
      description: 'Documentos oficiales de identidad, pasaportes y licencias',
      subcategories: [
        'Cédula / DNI',
        'Pasaporte',
        'Partida de Nacimiento',
        'Licencia de Conducir',
        'Visas / Residencia / Teudat Zehut',
        'Libreta Militar',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_salud',
      name: 'Salud y Médicos',
      icon: 'heart-pulse',
      color: '#e11d48',
      description: 'Expedientes de salud, carnets de vacunas y recetas',
      subcategories: [
        'Carnet de Vacunación',
        'Historial Clínico',
        'Recetas Médicas',
        'Exámenes de Laboratorio',
        'Alergias y Diagnósticos',
        'Odontología / Dental',
        'Póliza de Seguro Médico',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_finanzas',
      name: 'Finanzas y Bancos',
      icon: 'credit-card',
      color: '#059669',
      description: 'Información bancaria, impuestos y comprobantes financieros',
      subcategories: [
        'Tarjeta de Crédito',
        'Tarjeta de Débito',
        'Tarjetas de Crédito / Débito',
        'Cuentas Bancarias',
        'Declaraciones de Impuestos',
        'Comprobantes de Pago',
        'Inversiones y Ahorros',
        'Préstamos y Créditos',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_vehiculos',
      name: 'Vehículos y Transporte',
      icon: 'car',
      color: '#d97706',
      description: 'Títulos, seguros y mantenimientos vehiculares',
      subcategories: [
        'Título de Propiedad',
        'Póliza de Seguro Automotor',
        'Revisión Técnica / VTV',
        'Matrícula y Placas',
        'Multas / Trámites',
        'Mantenimiento y Reparaciones',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_educacion',
      name: 'Educación y Títulos',
      icon: 'graduation-cap',
      color: '#4f46e5',
      description: 'Diplomas, certificados académicos y constancias escolares',
      subcategories: [
        'Títulos y Diplomas',
        'Boletas de Calificaciones',
        'Certificados de Cursos',
        'Matrículas Escolares / Universitarias',
        'Carnet Estudiantil',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_seguros',
      name: 'Seguros y Pólizas',
      icon: 'shield-check',
      color: '#0891b2',
      description: 'Pólizas de seguro de vida, hogar, viaje y bienes',
      subcategories: [
        'Seguro de Vida',
        'Seguro de Hogar',
        'Seguro de Viaje',
        'Seguro de Responsabilidad Civil',
        'Asistencia en Viaje',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_hogar',
      name: 'Hogar y Propiedades',
      icon: 'home',
      color: '#ea580c',
      description: 'Contratos de vivienda, servicios y escrituras',
      subcategories: [
        'Contrato de Arrendamiento / Alquiler',
        'Escrituras de Propiedad',
        'Facturas de Servicios (Luz, Agua, Gas)',
        'Inventario del Hogar',
        'Garantías de Electrodomésticos',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_laboral',
      name: 'Laboral y Empleo',
      icon: 'briefcase',
      color: '#475569',
      description: 'Contratos laborales, nóminas y certificaciones de trabajo',
      subcategories: [
        'Contratos de Trabajo',
        'Recibos de Nómina / Pago',
        'Cartas de Recomendación',
        'Seguridad Social / Pensión',
        'Certificados Laborales',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cat_general',
      name: 'General y Varios',
      icon: 'folder',
      color: '#dc2626',
      description: 'Garantías, contratos varios y documentos generales',
      subcategories: [
        'Contratos Generales',
        'Garantías y Facturas',
        'Suscripciones y Membresías',
        'Fotografías Familiares',
        'Otros Documentos',
      ],
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
  ],
  calendarTasks: [
    {
      id: 'task_1',
      title: 'Revisión médica familiar',
      description: 'Chequeo rutinario y recetas médicas',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      assignedToId: 'member_jaime',
      completed: false,
      category: 'Salud',
      urgent: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task_2',
      title: 'Hacer compras de supermercado para la semana',
      description: 'Revisar la lista compartida de compras',
      date: new Date().toISOString().split('T')[0],
      time: '17:30',
      assignedToId: 'member_jaime',
      completed: false,
      category: 'Hogar',
      urgent: false,
      createdAt: new Date().toISOString(),
    },
  ],
  contacts: [
    {
      id: 'contact_jaime',
      name: 'Jaime Hadida',
      phone: '+58 414 1234567',
      email: 'jaimehadida70@gmail.com',
      notes: 'Administrador de la familia • Casa Hadida',
      address: 'Rehov HaDekel 7, Ashdod',
      placeName: 'Casa Hadida',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'contact_emergencia',
      name: 'Emergencias y Ambulancias',
      phone: '911',
      email: '',
      notes: 'Número de atención inmediata de emergencias médicas y auxilio vial',
      address: 'Centro de Emergencias y Rescate, Ashdod',
      placeName: 'Estación Central de Emergencias',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'contact_medico',
      name: 'Dr. Médico Familiar (Assuta)',
      phone: '+58 212 9998877',
      email: 'consultorio.medico@gmail.com',
      notes: 'Consultorio médico, citas de salud y pediatría',
      address: 'HaRefua 7, Campus Médico Assuta, Ashdod',
      placeName: 'Hospital Universitario Assuta',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'contact_farmacia',
      name: 'Farmacia de Turno & Salud',
      phone: '+58 212 5556677',
      email: 'pedidos@farmaciafamiliar.com',
      notes: 'Envío de medicamentos a domicilio las 24 horas',
      address: 'Sderot Menachem Begin 22, Ashdod',
      placeName: 'Farmacia Central 24h',
      createdAt: new Date().toISOString(),
    },
  ],
  todos: [
    {
      id: 'todo_1',
      text: 'Revisar documentación de viaje',
      completed: false,
      assignedToId: 'member_jaime',
      category: 'Importante',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'todo_2',
      text: 'Comprar pan fresco y leche',
      completed: true,
      completedAt: new Date().toISOString(),
      assignedToId: 'all',
      category: 'Hogar',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'todo_3',
      text: 'Organizar facturas del mes',
      completed: false,
      assignedToId: 'member_jaime',
      category: 'Finanzas',
      createdAt: new Date().toISOString(),
    },
  ],
  notifications: [],
};

// Database persistence helpers
function loadDatabase(): AppData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure lists array exists
      if (!parsed.lists || !Array.isArray(parsed.lists) || parsed.lists.length === 0) {
        parsed.lists = INITIAL_DATA.lists;
      }
      if (!parsed.personalRecords || !Array.isArray(parsed.personalRecords)) {
        parsed.personalRecords = [];
      }
      if (!parsed.calendarTasks || !Array.isArray(parsed.calendarTasks)) {
        parsed.calendarTasks = INITIAL_DATA.calendarTasks || [];
      }
      if (!parsed.contacts || !Array.isArray(parsed.contacts)) {
        parsed.contacts = INITIAL_DATA.contacts || [];
      }
      if (!parsed.todos || !Array.isArray(parsed.todos)) {
        parsed.todos = INITIAL_DATA.todos || [];
      }
      if (!parsed.dataCategories || !Array.isArray(parsed.dataCategories) || parsed.dataCategories.length === 0) {
        parsed.dataCategories = INITIAL_DATA.dataCategories || [];
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database file, resetting to initial data:', err);
  }
  saveDatabase(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveDatabase(data: AppData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

let dbData = loadDatabase();
// Clear existing items as explicitly requested
dbData.items = [];
dbData.personalRecords = dbData.personalRecords || [];
dbData.dataCategories = dbData.dataCategories && dbData.dataCategories.length > 0 ? dbData.dataCategories : (INITIAL_DATA.dataCategories || []);
dbData.calendarTasks = dbData.calendarTasks || INITIAL_DATA.calendarTasks || [];
dbData.contacts = dbData.contacts || INITIAL_DATA.contacts || [];
dbData.todos = dbData.todos || INITIAL_DATA.todos || [];
if (!dbData.lists || dbData.lists.length === 0) {
  dbData.lists = INITIAL_DATA.lists;
}
saveDatabase(dbData);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.static(path.join(process.cwd(), 'public')));

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
    ws.send(JSON.stringify({ type: 'INIT_SYNC', payload: dbData }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        console.log('WS received message:', msg.type);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    });
  });

  // REST API Routes

  // GET /api/data - Get complete state
  app.get('/api/data', (_req, res) => {
    res.json(dbData);
  });

  // POST /api/items - Add grocery item
  app.post('/api/items', (req, res) => {
    const { title, category, quantity, notes, assignedToId, urgent, listId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título del producto es requerido' });
    }

    const targetListId = listId || (dbData.lists && dbData.lists[0] ? dbData.lists[0].id : 'list_supermercado');

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

    dbData.items.unshift(newItem);

    // Create a push notification
    const assignedMember = dbData.members.find((m) => m.id === newItem.assignedToId);
    const targetList = dbData.lists.find((l) => l.id === targetListId);
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
    dbData.notifications.unshift(notif);

    saveDatabase(dbData);

    broadcast('ITEM_ADDED', { item: newItem });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newItem);
  });

  // PUT /api/items/:id - Update grocery item
  app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const index = dbData.items.findIndex((it) => it.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    const previousItem = dbData.items[index];
    const updatedItem: GroceryItem = {
      ...previousItem,
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };

    if (req.body.completed !== undefined && req.body.completed !== previousItem.completed) {
      updatedItem.completedAt = req.body.completed ? new Date().toISOString() : undefined;
    }

    dbData.items[index] = updatedItem;

    if (previousItem.assignedToId !== updatedItem.assignedToId) {
      const assignedMember = dbData.members.find((m) => m.id === updatedItem.assignedToId);
      const notif: PushNotification = {
        id: 'notif_' + Date.now(),
        recipientId: updatedItem.assignedToId,
        title: '🛒 Producto Reasignado',
        message: `Te asignaron: ${updatedItem.title}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'item_assigned',
        itemId: updatedItem.id,
        listId: updatedItem.listId,
      };
      dbData.notifications.unshift(notif);
      broadcast('PUSH_NOTIFICATION', { notification: notif });
    }

    saveDatabase(dbData);

    broadcast('ITEM_UPDATED', { item: updatedItem });
    res.json(updatedItem);
  });

  // DELETE /api/items/:id - Delete item
  app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    dbData.items = dbData.items.filter((it) => it.id !== id);
    saveDatabase(dbData);

    broadcast('ITEM_DELETED', { itemId: id });
    res.json({ success: true, itemId: id });
  });

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

    if (!dbData.lists) dbData.lists = [];
    dbData.lists.push(newList);

    // Notify all members
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
    dbData.notifications.unshift(notif);

    saveDatabase(dbData);

    broadcast('LIST_CREATED', { list: newList });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newList);
  });

  // PUT /api/lists/:id - Update custom list
  app.put('/api/lists/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.lists) dbData.lists = [];
    const index = dbData.lists.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Lista no encontrada' });
    }

    const updatedList: CustomList = {
      ...dbData.lists[index],
      ...req.body,
      id,
    };

    dbData.lists[index] = updatedList;
    saveDatabase(dbData);

    broadcast('LIST_UPDATED', { list: updatedList });
    res.json(updatedList);
  });

  // DELETE /api/lists/:id - Delete custom list
  app.delete('/api/lists/:id', (req, res) => {
    const { id } = req.params;

    if (!dbData.lists) dbData.lists = [];
    if (dbData.lists.length <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar la única lista restante' });
    }

    dbData.lists = dbData.lists.filter((l) => l.id !== id);
    // Delete all items that belonged to this list
    dbData.items = dbData.items.filter((it) => it.listId !== id);

    saveDatabase(dbData);

    broadcast('LIST_DELETED', { listId: id });
    res.json({ success: true, listId: id });
  });

  // POST /api/members - Add member
  app.post('/api/members', (req, res) => {
    const { name, avatarColor } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const newMember: Member = {
      id: 'member_' + Date.now(),
      name: name.trim().toUpperCase(),
      role: 'member',
      avatarColor: avatarColor || 'bg-red-600',
      avatarInitial: '',
      createdAt: new Date().toISOString(),
    };

    dbData.members.push(newMember);
    saveDatabase(dbData);

    broadcast('MEMBER_ADDED', { member: newMember });
    res.status(201).json(newMember);
  });

  // DELETE /api/members/:id - Delete member
  app.delete('/api/members/:id', (req, res) => {
    const { id } = req.params;
    if (id === 'member_jaime') {
      return res.status(400).json({ error: 'No se puede eliminar al Administrador principal' });
    }

    dbData.members = dbData.members.filter((m) => m.id !== id);
    // Reassign orphan items to Jaime
    dbData.items = dbData.items.map((it) => (it.assignedToId === id ? { ...it, assignedToId: 'member_jaime' } : it));

    saveDatabase(dbData);

    broadcast('MEMBER_DELETED', { memberId: id });
    res.json({ success: true, memberId: id });
  });

  // ================= CALENDAR TASKS ROUTES =================
  // GET /api/tasks
  app.get('/api/tasks', (_req, res) => {
    res.json(dbData.calendarTasks || []);
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

    if (!dbData.calendarTasks) dbData.calendarTasks = [];
    dbData.calendarTasks.unshift(newTask);

    // Push notification for the assigned member
    const assignedMember = dbData.members.find((m) => m.id === newTask.assignedToId);
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
    dbData.notifications.unshift(notif);

    saveDatabase(dbData);

    broadcast('TASK_ADDED', { task: newTask });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newTask);
  });

  // PUT /api/tasks/:id - Update task
  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.calendarTasks) dbData.calendarTasks = [];
    const index = dbData.calendarTasks.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const prevTask = dbData.calendarTasks[index];
    const updatedTask: CalendarTask = {
      ...prevTask,
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };

    if (req.body.completed !== undefined && req.body.completed !== prevTask.completed) {
      updatedTask.completedAt = req.body.completed ? new Date().toISOString() : undefined;
    }

    dbData.calendarTasks[index] = updatedTask;
    saveDatabase(dbData);

    broadcast('TASK_UPDATED', { task: updatedTask });
    res.json(updatedTask);
  });

  // DELETE /api/tasks/:id - Delete task
  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.calendarTasks) dbData.calendarTasks = [];
    dbData.calendarTasks = dbData.calendarTasks.filter((t) => t.id !== id);
    saveDatabase(dbData);

    broadcast('TASK_DELETED', { taskId: id });
    res.json({ success: true, taskId: id });
  });

  // ================= CONTACTS DIRECTORY ROUTES =================
  // GET /api/contacts
  app.get('/api/contacts', (_req, res) => {
    res.json(dbData.contacts || []);
  });

  // POST /api/contacts - Create contact
  app.post('/api/contacts', (req, res) => {
    const { name, phone, email, notes } = req.body;
    if (!name || !name.trim() || !phone || !phone.trim()) {
      return res.status(400).json({ error: 'El nombre y teléfono son obligatorios' });
    }

    const newContact: Contact = {
      id: 'contact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      notes: notes?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!dbData.contacts) dbData.contacts = [];
    dbData.contacts.push(newContact);
    saveDatabase(dbData);

    broadcast('CONTACT_ADDED', { contact: newContact });
    res.status(201).json(newContact);
  });

  // PUT /api/contacts/:id - Update contact
  app.put('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.contacts) dbData.contacts = [];
    const index = dbData.contacts.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    const updatedContact: Contact = {
      ...dbData.contacts[index],
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };

    dbData.contacts[index] = updatedContact;
    saveDatabase(dbData);

    broadcast('CONTACT_UPDATED', { contact: updatedContact });
    res.json(updatedContact);
  });

  // DELETE /api/contacts/:id - Delete contact
  app.delete('/api/contacts/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.contacts) dbData.contacts = [];
    dbData.contacts = dbData.contacts.filter((c) => c.id !== id);
    saveDatabase(dbData);

    broadcast('CONTACT_DELETED', { contactId: id });
    res.json({ success: true, contactId: id });
  });

  // ================= MINIMALIST TO-DO LIST ROUTES =================
  // GET /api/todos
  app.get('/api/todos', (_req, res) => {
    res.json(dbData.todos || []);
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

    if (!dbData.todos) dbData.todos = [];
    dbData.todos.unshift(newTodo);
    saveDatabase(dbData);

    broadcast('TODO_ADDED', { todo: newTodo });
    res.status(201).json(newTodo);
  });

  // PUT /api/todos/:id - Update todo
  app.put('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.todos) dbData.todos = [];
    const index = dbData.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const prevTodo = dbData.todos[index];
    const updatedTodo: TodoItem = {
      ...prevTodo,
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };

    if (req.body.completed !== undefined && req.body.completed !== prevTodo.completed) {
      updatedTodo.completedAt = req.body.completed ? new Date().toISOString() : undefined;
    }

    dbData.todos[index] = updatedTodo;
    saveDatabase(dbData);

    broadcast('TODO_UPDATED', { todo: updatedTodo });
    res.json(updatedTodo);
  });

  // DELETE /api/todos/:id - Delete single todo
  app.delete('/api/todos/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.todos) dbData.todos = [];
    dbData.todos = dbData.todos.filter((t) => t.id !== id);
    saveDatabase(dbData);

    broadcast('TODO_DELETED', { todoId: id });
    res.json({ success: true, todoId: id });
  });

  // POST /api/todos/clear-completed - Clear all completed todos
  app.post('/api/todos/clear-completed', (_req, res) => {
    if (!dbData.todos) dbData.todos = [];
    dbData.todos = dbData.todos.filter((t) => !t.completed);
    saveDatabase(dbData);

    broadcast('TODOS_CLEARED_COMPLETED', {});
    res.json({ success: true });
  });

  // ================= PERSONAL RECORDS ROUTES =================
  // GET /api/personal-records
  app.get('/api/personal-records', (_req, res) => {
    res.json(dbData.personalRecords || []);
  });

  // POST /api/personal-records - Add personal record
  app.post('/api/personal-records', (req, res) => {
    const {
      memberId,
      category,
      subcategory,
      title,
      notes,
      fileName,
      fileType,
      fileSize,
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

    if (!dbData.personalRecords) dbData.personalRecords = [];
    dbData.personalRecords.unshift(newRecord);

    const member = dbData.members.find((m) => m.id === memberId);
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
    dbData.notifications.unshift(notif);

    saveDatabase(dbData);

    broadcast('PERSONAL_RECORD_ADDED', { record: newRecord });
    broadcast('PUSH_NOTIFICATION', { notification: notif });

    res.status(201).json(newRecord);
  });

  // PUT /api/personal-records/:id - Update personal record
  app.put('/api/personal-records/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.personalRecords) dbData.personalRecords = [];

    const index = dbData.personalRecords.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const updatedRecord: PersonalRecord = {
      ...dbData.personalRecords[index],
      ...req.body,
      id,
      updatedAt: new Date().toISOString(),
    };

    dbData.personalRecords[index] = updatedRecord;
    saveDatabase(dbData);

    broadcast('PERSONAL_RECORD_UPDATED', { record: updatedRecord });
    res.json(updatedRecord);
  });

  // DELETE /api/personal-records/:id - Delete personal record
  app.delete('/api/personal-records/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.personalRecords) dbData.personalRecords = [];

    dbData.personalRecords = dbData.personalRecords.filter((r) => r.id !== id);
    saveDatabase(dbData);

    broadcast('PERSONAL_RECORD_DELETED', { recordId: id });
    res.json({ success: true, recordId: id });
  });

  // ================= DATA CATEGORIES & SUBCATEGORIES ROUTES =================
  // GET /api/data-categories
  app.get('/api/data-categories', (_req, res) => {
    res.json(dbData.dataCategories || []);
  });

  // POST /api/data-categories - Add new category
  app.post('/api/data-categories', (req, res) => {
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

    if (!dbData.dataCategories) dbData.dataCategories = [];
    dbData.dataCategories.push(newCategory);
    saveDatabase(dbData);

    broadcast('DATA_CATEGORY_ADDED', { category: newCategory });
    res.status(201).json(newCategory);
  });

  // PUT /api/data-categories/:id - Update category
  app.put('/api/data-categories/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.dataCategories) dbData.dataCategories = [];

    const index = dbData.dataCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const prevCategory = dbData.dataCategories[index];
    const oldName = prevCategory.name;
    const newName = req.body.name ? req.body.name.trim() : oldName;

    const updatedCategory: DataCategory = {
      ...prevCategory,
      ...req.body,
      name: newName,
      id,
    };

    if (Array.isArray(req.body.subcategories)) {
      updatedCategory.subcategories = req.body.subcategories
        .filter((s: string) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim());
    }

    dbData.dataCategories[index] = updatedCategory;

    // If category title/name changed, optionally cascade to personalRecords
    if (oldName !== newName && dbData.personalRecords) {
      let recordsChanged = false;
      dbData.personalRecords.forEach((rec) => {
        if (rec.category && rec.category.toLowerCase() === oldName.toLowerCase()) {
          rec.category = newName;
          recordsChanged = true;
          broadcast('PERSONAL_RECORD_UPDATED', { record: rec });
        }
      });
      if (recordsChanged) {
        // saved below
      }
    }

    saveDatabase(dbData);

    broadcast('DATA_CATEGORY_UPDATED', { category: updatedCategory });
    res.json(updatedCategory);
  });

  // PUT /api/data-categories/:id/subcategories/rename - Rename a subcategory
  app.put('/api/data-categories/:id/subcategories/rename', (req, res) => {
    const { id } = req.params;
    const { oldSubcategoryName, newSubcategoryName, updateRecords } = req.body;

    if (!oldSubcategoryName || !newSubcategoryName || !newSubcategoryName.trim()) {
      return res.status(400).json({ error: 'Nombres de subcategoría anterior y nuevo requeridos' });
    }

    if (!dbData.dataCategories) dbData.dataCategories = [];
    const index = dbData.dataCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const cat = dbData.dataCategories[index];
    const oldTrimmed = oldSubcategoryName.trim();
    const newTrimmed = newSubcategoryName.trim();

    if (cat.subcategories) {
      cat.subcategories = cat.subcategories.map((s) => (s.toLowerCase() === oldTrimmed.toLowerCase() ? newTrimmed : s));
    }

    // Cascade rename across records if requested
    if (updateRecords !== false && dbData.personalRecords) {
      dbData.personalRecords.forEach((rec) => {
        if (
          rec.category &&
          rec.category.toLowerCase() === cat.name.toLowerCase() &&
          rec.subcategory &&
          rec.subcategory.toLowerCase() === oldTrimmed.toLowerCase()
        ) {
          rec.subcategory = newTrimmed;
          broadcast('PERSONAL_RECORD_UPDATED', { record: rec });
        }
      });
    }

    saveDatabase(dbData);
    broadcast('DATA_CATEGORY_UPDATED', { category: cat });
    res.json(cat);
  });

  // POST /api/data-categories/:id/subcategories - Add subcategory to category
  app.post('/api/data-categories/:id/subcategories', (req, res) => {
    const { id } = req.params;
    const { subcategoryName } = req.body;

    if (!subcategoryName || !subcategoryName.trim()) {
      return res.status(400).json({ error: 'El nombre de la subcategoría es obligatorio' });
    }

    if (!dbData.dataCategories) dbData.dataCategories = [];
    const index = dbData.dataCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const trimmed = subcategoryName.trim();
    const cat = dbData.dataCategories[index];
    if (!cat.subcategories) cat.subcategories = [];

    // Avoid duplicate subcategories inside the same category (case-insensitive check)
    const exists = cat.subcategories.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      cat.subcategories.push(trimmed);
      saveDatabase(dbData);
      broadcast('DATA_CATEGORY_UPDATED', { category: cat });
    }

    res.json(cat);
  });

  // DELETE /api/data-categories/:id/subcategories/:subName - Remove subcategory from category
  app.delete('/api/data-categories/:id/subcategories/:subName', (req, res) => {
    const { id, subName } = req.params;
    const decodedSubName = decodeURIComponent(subName);

    if (!dbData.dataCategories) dbData.dataCategories = [];
    const index = dbData.dataCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const cat = dbData.dataCategories[index];
    if (cat.subcategories) {
      cat.subcategories = cat.subcategories.filter((s) => s.toLowerCase() !== decodedSubName.toLowerCase());
      saveDatabase(dbData);
      broadcast('DATA_CATEGORY_UPDATED', { category: cat });
    }

    res.json(cat);
  });

  // DELETE /api/data-categories/:id - Delete category
  app.delete('/api/data-categories/:id', (req, res) => {
    const { id } = req.params;
    if (!dbData.dataCategories) dbData.dataCategories = [];

    dbData.dataCategories = dbData.dataCategories.filter((c) => c.id !== id);
    saveDatabase(dbData);

    broadcast('DATA_CATEGORY_DELETED', { categoryId: id });
    res.json({ success: true, categoryId: id });
  });

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

    dbData.notifications.unshift(notif);
    saveDatabase(dbData);

    broadcast('PUSH_NOTIFICATION', { notification: notif });
    res.status(201).json(notif);
  });

  // POST /api/notifications/read - Mark notifications read
  app.post('/api/notifications/read', (req, res) => {
    const { memberId, notificationId } = req.body;

    if (notificationId) {
      dbData.notifications = dbData.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    } else if (memberId) {
      dbData.notifications = dbData.notifications.map((n) =>
        n.recipientId === memberId || n.recipientId === 'all' ? { ...n, read: true } : n
      );
    }

    saveDatabase(dbData);
    broadcast('NOTIFICATIONS_READ', { memberId, notificationId });
    res.json({ success: true });
  });

  // POST /api/reset - Reset sample data
  app.post('/api/reset', (_req, res) => {
    dbData = JSON.parse(JSON.stringify(INITIAL_DATA));
    saveDatabase(dbData);
    broadcast('INIT_SYNC', dbData);
    res.json({ success: true, message: 'Datos reiniciados limpiamente' });
  });

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
    console.log(`🛒 App running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
