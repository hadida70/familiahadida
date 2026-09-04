import { useEffect, useRef, useState, useCallback } from 'react';
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
} from '../types';
import { sounds } from './sound';

interface UseWebSocketReturn {
  data: AppData;
  connected: boolean;
  activeMember: Member | null;
  setActiveMember: (member: Member) => void;
  token: string | null;
  login: (memberIdOrUsername: string, pin: string) => Promise<{ success: boolean; error?: string; user?: Member }>;
  logout: () => void;
  uploadFile: (file: File) => Promise<{ fileName: string; fileUrl: string; fileType: string; fileSize: number } | null>;
  addItem: (item: Partial<GroceryItem>) => Promise<void>;
  updateItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  createList: (list: Partial<CustomList>) => Promise<void>;
  updateList: (id: string, updates: Partial<CustomList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addMember: (member: Partial<Member> & { pin?: string }) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addPersonalRecord: (record: Partial<PersonalRecord>) => Promise<void>;
  updatePersonalRecord: (id: string, updates: Partial<PersonalRecord>) => Promise<void>;
  deletePersonalRecord: (id: string) => Promise<void>;
  addDataCategory: (category: Partial<DataCategory>) => Promise<void>;
  updateDataCategory: (id: string, updates: Partial<DataCategory>) => Promise<void>;
  deleteDataCategory: (id: string) => Promise<void>;
  addSubcategory: (categoryId: string, subcategoryName: string) => Promise<void>;
  renameSubcategory: (categoryId: string, oldSubcategoryName: string, newSubcategoryName: string, updateRecords?: boolean) => Promise<void>;
  deleteSubcategory: (categoryId: string, subcategoryName: string) => Promise<void>;
  addTask: (task: Partial<CalendarTask>) => Promise<void>;
  updateTask: (id: string, updates: Partial<CalendarTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addContact: (contact: Partial<Contact>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addTodo: (todo: Partial<TodoItem>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  clearCompletedTodos: () => Promise<void>;
  sendPushAlert: (recipientId: string, title: string, message: string) => Promise<void>;
  markNotificationsRead: (memberId?: string, notificationId?: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  recentToast: PushNotification | null;
  clearToast: () => void;
  requestPushPermission: () => Promise<NotificationPermission>;
  pushPermission: NotificationPermission;
}

export function useWebSocket(): UseWebSocketReturn {
  const [data, setData] = useState<AppData>({
    members: [],
    lists: [],
    items: [],
    personalRecords: [],
    calendarTasks: [],
    contacts: [],
    todos: [],
    notifications: [],
  });
  const [connected, setConnected] = useState(false);
  const [activeMember, setActiveMemberState] = useState<Member | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hadida_family_auth_token') || null;
  });
  const [recentToast, setRecentToast] = useState<PushNotification | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const wsRef = useRef<WebSocket | null>(null);
  const activeMemberRef = useRef<Member | null>(activeMember);

  // Keep ref synchronized
  useEffect(() => {
    activeMemberRef.current = activeMember;
  }, [activeMember]);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const currentToken = token || localStorage.getItem('hadida_family_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    return headers;
  }, [token]);

  // Request browser Web Notification permissions
  const requestPushPermission = async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        return perm;
      } catch {
        return 'denied';
      }
    }
    return 'denied';
  };

  // Helper to trigger native browser notification if granted
  const triggerNativeNotification = useCallback((notif: PushNotification) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico',
        });
      } catch {
        // Fallback silently if blocked
      }
    }
  }, []);

  // Fetch initial REST backup data
  const fetchFullData = useCallback(async () => {
    try {
      const res = await fetch('/api/data', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json: AppData = await res.json();
        if (!json.lists) json.lists = [];
        if (!json.calendarTasks) json.calendarTasks = [];
        if (!json.contacts) json.contacts = [];
        if (!json.todos) json.todos = [];
        setData(json);

        // Restore active member if saved or pick default
        const savedMemberId = localStorage.getItem('hadida_family_auth_member_id') || localStorage.getItem('supermercado_active_member');
        if (savedMemberId) {
          const found = json.members.find((m) => m.id === savedMemberId);
          if (found) {
            setActiveMemberState(found);
            return;
          }
        }
        if (json.members.length > 0 && !activeMemberRef.current) {
          setActiveMemberState(json.members[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, [getAuthHeaders]);

  // Establish WebSocket connection with auto-reconnect
  useEffect(() => {
    fetchFullData();

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onclose = () => {
        setConnected(false);
        // Retry connection in 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        setConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const currentMember = activeMemberRef.current;

          switch (msg.type) {
            case 'INIT_SYNC':
              setData({
                ...msg.payload,
                lists: msg.payload.lists || [],
                items: msg.payload.items || [],
                calendarTasks: msg.payload.calendarTasks || [],
                contacts: msg.payload.contacts || [],
                todos: msg.payload.todos || [],
                notifications: msg.payload.notifications || [],
              });
              if (!activeMemberRef.current && msg.payload.members && msg.payload.members.length > 0) {
                const savedId = localStorage.getItem('hadida_family_auth_member_id') || localStorage.getItem('supermercado_active_member');
                const matched = msg.payload.members.find((m: Member) => m.id === savedId) || msg.payload.members[0];
                setActiveMemberState(matched);
              }
              break;

            case 'LIST_CREATED':
              setData((prev) => ({
                ...prev,
                lists: [...prev.lists.filter((l) => l.id !== msg.payload.list.id), msg.payload.list],
              }));
              sounds.playAddSound();
              break;

            case 'LIST_UPDATED':
              setData((prev) => ({
                ...prev,
                lists: prev.lists.map((l) => (l.id === msg.payload.list.id ? msg.payload.list : l)),
              }));
              break;

            case 'LIST_DELETED':
              setData((prev) => ({
                ...prev,
                lists: prev.lists.filter((l) => l.id !== msg.payload.listId),
                items: prev.items.filter((i) => i.listId !== msg.payload.listId),
              }));
              break;

            case 'ITEM_ADDED':
              setData((prev) => ({
                ...prev,
                items: [msg.payload.item, ...prev.items.filter((i) => i.id !== msg.payload.item.id)],
                notifications: msg.payload.notification
                  ? [msg.payload.notification, ...prev.notifications]
                  : prev.notifications,
              }));

              if (
                msg.payload.notification &&
                currentMember &&
                (msg.payload.notification.recipientId === currentMember.id ||
                  msg.payload.notification.recipientId === 'all' ||
                  currentMember.role === 'admin')
              ) {
                setRecentToast(msg.payload.notification);
                sounds.playNotificationSound();
                triggerNativeNotification(msg.payload.notification);
              }
              break;

            case 'ITEM_UPDATED':
              setData((prev) => ({
                ...prev,
                items: prev.items.map((i) => (i.id === msg.payload.item.id ? msg.payload.item : i)),
                notifications: msg.payload.notification
                  ? [msg.payload.notification, ...prev.notifications]
                  : prev.notifications,
              }));

              if (
                msg.payload.notification &&
                currentMember &&
                (msg.payload.notification.recipientId === currentMember.id ||
                  msg.payload.notification.recipientId === 'all' ||
                  currentMember.role === 'admin')
              ) {
                setRecentToast(msg.payload.notification);
                sounds.playNotificationSound();
                triggerNativeNotification(msg.payload.notification);
              }
              break;

            case 'ITEM_DELETED':
              setData((prev) => ({
                ...prev,
                items: prev.items.filter((i) => i.id !== msg.payload.itemId),
              }));
              break;

            case 'MEMBER_ADDED':
              setData((prev) => ({
                ...prev,
                members: [...prev.members.filter((m) => m.id !== msg.payload.member.id), msg.payload.member],
              }));
              break;

            case 'MEMBER_DELETED':
              setData((prev) => ({
                ...prev,
                members: prev.members.filter((m) => m.id !== msg.payload.memberId),
                personalRecords: (prev.personalRecords || []).filter((r) => r.memberId !== msg.payload.memberId),
              }));
              if (currentMember && currentMember.id === msg.payload.memberId) {
                setActiveMemberState(data.members[0] || null);
              }
              break;

            case 'PERSONAL_RECORD_ADDED':
              setData((prev) => ({
                ...prev,
                personalRecords: [
                  msg.payload.record,
                  ...(prev.personalRecords || []).filter((r) => r.id !== msg.payload.record.id),
                ],
              }));
              sounds.playAddSound();
              break;

            case 'PERSONAL_RECORD_UPDATED':
              setData((prev) => ({
                ...prev,
                personalRecords: (prev.personalRecords || []).map((r) =>
                  r.id === msg.payload.record.id ? msg.payload.record : r
                ),
              }));
              break;

            case 'PERSONAL_RECORD_DELETED':
              setData((prev) => ({
                ...prev,
                personalRecords: (prev.personalRecords || []).filter((r) => r.id !== msg.payload.recordId),
              }));
              break;

            case 'DATA_CATEGORY_ADDED':
              setData((prev) => ({
                ...prev,
                dataCategories: [
                  ...(prev.dataCategories || []).filter((c) => c.id !== msg.payload.category.id),
                  msg.payload.category,
                ],
              }));
              sounds.playAddSound();
              break;

            case 'DATA_CATEGORY_UPDATED':
              setData((prev) => ({
                ...prev,
                dataCategories: (prev.dataCategories || []).map((c) =>
                  c.id === msg.payload.category.id ? msg.payload.category : c
                ),
              }));
              break;

            case 'DATA_CATEGORY_DELETED':
              setData((prev) => ({
                ...prev,
                dataCategories: (prev.dataCategories || []).filter((c) => c.id !== msg.payload.categoryId),
              }));
              break;

            case 'TASK_ADDED':
              setData((prev) => ({
                ...prev,
                calendarTasks: [
                  msg.payload.task,
                  ...(prev.calendarTasks || []).filter((t) => t.id !== msg.payload.task.id),
                ],
              }));
              sounds.playAddSound();
              break;

            case 'TASK_UPDATED':
              setData((prev) => ({
                ...prev,
                calendarTasks: (prev.calendarTasks || []).map((t) =>
                  t.id === msg.payload.task.id ? msg.payload.task : t
                ),
              }));
              break;

            case 'TASK_DELETED':
              setData((prev) => ({
                ...prev,
                calendarTasks: (prev.calendarTasks || []).filter((t) => t.id !== msg.payload.taskId),
              }));
              break;

            case 'CONTACT_ADDED':
              setData((prev) => ({
                ...prev,
                contacts: [
                  msg.payload.contact,
                  ...(prev.contacts || []).filter((c) => c.id !== msg.payload.contact.id),
                ],
              }));
              sounds.playAddSound();
              break;

            case 'CONTACT_UPDATED':
              setData((prev) => ({
                ...prev,
                contacts: (prev.contacts || []).map((c) =>
                  c.id === msg.payload.contact.id ? msg.payload.contact : c
                ),
              }));
              break;

            case 'CONTACT_DELETED':
              setData((prev) => ({
                ...prev,
                contacts: (prev.contacts || []).filter((c) => c.id !== msg.payload.contactId),
              }));
              break;

            case 'TODO_ADDED':
              setData((prev) => ({
                ...prev,
                todos: [
                  msg.payload.todo,
                  ...(prev.todos || []).filter((t) => t.id !== msg.payload.todo.id),
                ],
              }));
              sounds.playAddSound();
              break;

            case 'TODO_UPDATED':
              setData((prev) => ({
                ...prev,
                todos: (prev.todos || []).map((t) =>
                  t.id === msg.payload.todo.id ? msg.payload.todo : t
                ),
              }));
              break;

            case 'TODO_DELETED':
              setData((prev) => ({
                ...prev,
                todos: (prev.todos || []).filter((t) => t.id !== msg.payload.todoId),
              }));
              break;

            case 'TODOS_CLEARED_COMPLETED':
              setData((prev) => ({
                ...prev,
                todos: (prev.todos || []).filter((t) => !t.completed),
              }));
              break;

            case 'PUSH_NOTIFICATION':
              setData((prev) => ({
                ...prev,
                notifications: [msg.payload.notification, ...prev.notifications],
              }));

              if (
                currentMember &&
                (msg.payload.notification.recipientId === currentMember.id ||
                  msg.payload.notification.recipientId === 'all' ||
                  currentMember.role === 'admin')
              ) {
                setRecentToast(msg.payload.notification);
                sounds.playUrgentSound();
                triggerNativeNotification(msg.payload.notification);
              }
              break;

            case 'NOTIFICATIONS_READ':
              setData((prev) => ({
                ...prev,
                notifications: prev.notifications.map((n) =>
                  msg.payload.notificationId && n.id === msg.payload.notificationId
                    ? { ...n, read: true }
                    : msg.payload.memberId && (n.recipientId === msg.payload.memberId || n.recipientId === 'all')
                    ? { ...n, read: true }
                    : n
                ),
              }));
              break;
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [fetchFullData, triggerNativeNotification]);

  const setActiveMember = (member: Member) => {
    setActiveMemberState(member);
    localStorage.setItem('hadida_family_auth_member_id', member.id);
    localStorage.setItem('supermercado_active_member', member.id);
  };

  // Auth Functions
  const login = async (memberIdOrUsername: string, pin: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: memberIdOrUsername, pin }),
      });

      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Error al iniciar sesión' };
      }

      setToken(json.token);
      localStorage.setItem('hadida_family_auth_token', json.token);
      localStorage.setItem('hadida_family_auth', 'authenticated');
      localStorage.setItem('hadida_family_auth_role', json.user.role);
      localStorage.setItem('hadida_family_auth_member_id', json.user.id);
      setActiveMemberState(json.user);

      // Refresh data
      fetchFullData();

      return { success: true, user: json.user };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('hadida_family_auth_token');
    localStorage.removeItem('hadida_family_auth');
    localStorage.removeItem('hadida_family_auth_role');
  };

  // Upload file helper
  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const currentToken = token || localStorage.getItem('hadida_family_auth_token');
      const headers: Record<string, string> = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al subir archivo');
      }

      return await res.json();
    } catch (err) {
      console.error('File upload error:', err);
      return null;
    }
  };

  const createList = async (list: Partial<CustomList>) => {
    try {
      await fetch('/api/lists', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...list,
          createdBy: activeMember ? activeMember.id : 'member_jaime',
        }),
      });
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  const updateList = async (id: string, updates: Partial<CustomList>) => {
    try {
      await fetch(`/api/lists/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating list:', err);
    }
  };

  const deleteList = async (id: string) => {
    try {
      await fetch(`/api/lists/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting list:', err);
    }
  };

  const addItem = async (item: Partial<GroceryItem>) => {
    try {
      await fetch('/api/items', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...item,
          createdBy: activeMember ? activeMember.id : 'member_jaime',
        }),
      });
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const updateItem = async (id: string, updates: Partial<GroceryItem>) => {
    try {
      await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const addMember = async (member: Partial<Member> & { pin?: string }) => {
    try {
      await fetch('/api/auth/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(member),
      });
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  const addPersonalRecord = async (record: Partial<PersonalRecord>) => {
    try {
      await fetch('/api/personal-records', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(record),
      });
    } catch (err) {
      console.error('Error adding personal record:', err);
    }
  };

  const updatePersonalRecord = async (id: string, updates: Partial<PersonalRecord>) => {
    try {
      await fetch(`/api/personal-records/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating personal record:', err);
    }
  };

  const deletePersonalRecord = async (id: string) => {
    try {
      await fetch(`/api/personal-records/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting personal record:', err);
    }
  };

  const addDataCategory = async (category: Partial<DataCategory>) => {
    try {
      await fetch('/api/data-categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(category),
      });
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const updateDataCategory = async (id: string, updates: Partial<DataCategory>) => {
    try {
      await fetch(`/api/data-categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const deleteDataCategory = async (id: string) => {
    try {
      await fetch(`/api/data-categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const addSubcategory = async (categoryId: string, subcategoryName: string) => {
    try {
      await fetch(`/api/data-categories/${categoryId}/subcategories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ subcategoryName }),
      });
    } catch (err) {
      console.error('Error adding subcategory:', err);
    }
  };

  const renameSubcategory = async (
    categoryId: string,
    oldSubcategoryName: string,
    newSubcategoryName: string,
    updateRecords: boolean = true
  ) => {
    try {
      await fetch(`/api/data-categories/${categoryId}/subcategories/rename`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldSubcategoryName, newSubcategoryName, updateRecords }),
      });
    } catch (err) {
      console.error('Error renaming subcategory:', err);
    }
  };

  const deleteSubcategory = async (categoryId: string, subcategoryName: string) => {
    try {
      await fetch(`/api/data-categories/${categoryId}/subcategories/${encodeURIComponent(subcategoryName)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting subcategory:', err);
    }
  };

  const addTask = async (task: Partial<CalendarTask>) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(task),
      });
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const updateTask = async (id: string, updates: Partial<CalendarTask>) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const addContact = async (contact: Partial<Contact>) => {
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contact),
      });
    } catch (err) {
      console.error('Error adding contact:', err);
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating contact:', err);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const addTodo = async (todo: Partial<TodoItem>) => {
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(todo),
      });
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const updateTodo = async (id: string, updates: Partial<TodoItem>) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Error updating todo:', err);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const clearCompletedTodos = async () => {
    try {
      await fetch('/api/todos/clear-completed', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error clearing completed todos:', err);
    }
  };

  const sendPushAlert = async (recipientId: string, title: string, message: string) => {
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientId, title, message }),
      });
    } catch (err) {
      console.error('Error sending alert:', err);
    }
  };

  const markNotificationsRead = async (memberId?: string, notificationId?: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ memberId, notificationId }),
      });
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const resetDemoData = async () => {
    try {
      await fetch('/api/reset', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Error resetting data:', err);
    }
  };

  const clearToast = () => {
    setRecentToast(null);
  };

  return {
    data,
    connected,
    activeMember,
    setActiveMember,
    token,
    login,
    logout,
    uploadFile,
    addItem,
    updateItem,
    deleteItem,
    createList,
    updateList,
    deleteList,
    addMember,
    deleteMember,
    addPersonalRecord,
    updatePersonalRecord,
    deletePersonalRecord,
    addDataCategory,
    updateDataCategory,
    deleteDataCategory,
    addSubcategory,
    renameSubcategory,
    deleteSubcategory,
    addTask,
    updateTask,
    deleteTask,
    addContact,
    updateContact,
    deleteContact,
    addTodo,
    updateTodo,
    deleteTodo,
    clearCompletedTodos,
    sendPushAlert,
    markNotificationsRead,
    resetDemoData,
    recentToast,
    clearToast,
    requestPushPermission,
    pushPermission,
  };
}
