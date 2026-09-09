import React, { useState, useEffect } from 'react';
import {
  Plus,
  ShoppingCart,
  FileText,
  Calendar as CalendarIcon,
  Phone,
  Bell,
  Layers,
  Lock,
  CheckSquare,
  Key,
} from 'lucide-react';
import { useWebSocket } from './lib/useWebSocket';
import { GroceryItem, CustomList, PersonalRecord, CalendarTask, Contact, Member, TodoItem, PasswordItem } from './types';
import { Header } from './components/Header';
import { ListAccordion } from './components/ListAccordion';
import { NotificationBanner } from './components/NotificationBanner';
import { AddItemModal } from './components/AddItemModal';
import { CreateListModal } from './components/CreateListModal';
import { EditListModal } from './components/EditListModal';
import { AddMemberModal } from './components/AddMemberModal';
import { SendAlertModal } from './components/SendAlertModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ShareListModal } from './components/ShareListModal';
import { PersonalRecordsView } from './components/PersonalRecordsView';
import { AddPersonalRecordModal } from './components/AddPersonalRecordModal';
import { ManageDataCategoriesModal } from './components/ManageDataCategoriesModal';
import { CategoriesAdminView } from './components/CategoriesAdminView';
import { SendPersonalRecordModal } from './components/SendPersonalRecordModal';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { ContactsDirectoryView } from './components/ContactsDirectoryView';
import { AddContactModal } from './components/AddContactModal';
import { PinLockScreen } from './components/PinLockScreen';
import { AdminPinPromptModal } from './components/AdminPinPromptModal';
import { MinimalistTodoList } from './components/MinimalistTodoList';
import { PasswordsView } from './components/PasswordsView';
import { AddPasswordModal } from './components/AddPasswordModal';
import { PasswordPinPromptModal } from './components/PasswordPinPromptModal';

export default function App() {
  const {
    data,
    connected,
    activeMember,
    setActiveMember,
    token,
    login,
    logout,
    uploadFile,
    uploadMultipleFiles,
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
    addPassword,
    updatePassword,
    deletePassword,
    sendPushAlert,
    markNotificationsRead,
    resetDemoData,
    recentToast,
    clearToast,
    pushPermission,
    requestPushPermission,
  } = useWebSocket();

  // Authentication & Role State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hadida_family_auth') === 'authenticated' && !!localStorage.getItem('hadida_family_auth_token');
  });

  const [authRole, setAuthRole] = useState<'admin' | 'member'>(() => {
    return (localStorage.getItem('hadida_family_auth_role') as 'admin' | 'member') || 'admin';
  });

  const [isAdminPinPromptOpen, setIsAdminPinPromptOpen] = useState(false);
  const isAdmin = authRole === 'admin';

  // Navigation tab: 'calendar' (Home screen default), 'lists', 'personal_data', 'categories', 'contacts', 'todos', 'passwords'
  const [activeTab, setActiveTab] = useState<'calendar' | 'lists' | 'personal_data' | 'categories' | 'contacts' | 'todos' | 'passwords'>('calendar');

  // Modals state for Lists and Members
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isEditListOpen, setIsEditListOpen] = useState(false);
  const [editingList, setEditingList] = useState<CustomList | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSendAlertOpen, setIsSendAlertOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Personal Records Modals & Lightbox
  const [isAddPersonalRecordOpen, setIsAddPersonalRecordOpen] = useState(false);
  const [addRecordPreset, setAddRecordPreset] = useState<{ category?: string; subcategory?: string } | null>(null);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isSendPersonalRecordOpen, setIsSendPersonalRecordOpen] = useState(false);
  const [sendingPersonalRecord, setSendingPersonalRecord] = useState<PersonalRecord | null>(null);
  const [editingPersonalRecord, setEditingPersonalRecord] = useState<PersonalRecord | null>(null);
  const [viewingPhotoState, setViewingPhotoState] = useState<{ record: PersonalRecord; initialIndex: number } | null>(null);

  // Calendar Tasks Modals
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [defaultTaskDate, setDefaultTaskDate] = useState<string | undefined>(undefined);

  // Contacts Directory Modals
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Passwords Manager Modals & Security Pin
  const [isAddPasswordOpen, setIsAddPasswordOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordItem | null>(null);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [isPasswordPinPromptOpen, setIsPasswordPinPromptOpen] = useState(false);

  // Active custom list id (for accordion expand / operations)
  const [activeListId, setActiveListId] = useState<string>('list_supermercado');

  // Font size setting (for elderly readability)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Sync activeMember from saved storage if available
  useEffect(() => {
    const savedMemberId = localStorage.getItem('hadida_family_auth_member_id');
    if (savedMemberId && data.members && data.members.length > 0) {
      const found = data.members.find((m) => m.id === savedMemberId);
      if (found) {
        setActiveMember(found);
      }
    }
  }, [data.members]);

  // Ensure active list exists or fallback
  useEffect(() => {
    if (data.lists && data.lists.length > 0) {
      const exists = data.lists.some((l) => l.id === activeListId);
      if (!exists) {
        setActiveListId(data.lists[0].id);
      }
    }
  }, [data.lists, activeListId]);

  const activeList = data.lists.find((l) => l.id === activeListId) || data.lists[0];

  // Unlock from PinLockScreen
  const handleUnlock = (member: Member, isAdminUnlocked: boolean) => {
    setIsAuthenticated(true);
    setAuthRole(isAdminUnlocked ? 'admin' : 'member');
    localStorage.setItem('hadida_family_auth', 'authenticated');
    localStorage.setItem('hadida_family_auth_role', isAdminUnlocked ? 'admin' : 'member');
    localStorage.setItem('hadida_family_auth_member_id', member.id);
    setActiveMember(member);
  };

  // Lock and return to PinLockScreen
  const handleLock = () => {
    logout();
    setIsAuthenticated(false);
  };

  // Elevate from member to admin
  const handleElevateToAdmin = () => {
    setIsAdminPinPromptOpen(true);
  };

  const handleAdminPinSuccess = () => {
    setAuthRole('admin');
    localStorage.setItem('hadida_family_auth_role', 'admin');
    const jaime = data.members.find((m) => m.name.toUpperCase() === 'JAIME' || m.role === 'admin');
    if (jaime) {
      setActiveMember(jaime);
      localStorage.setItem('hadida_family_auth_member_id', jaime.id);
    } else if (activeMember) {
      setActiveMember({ ...activeMember, role: 'admin' });
    }
  };

  // Tab switching with PIN requirement for Passwords section
  const handleSelectTab = (tab: 'calendar' | 'lists' | 'personal_data' | 'categories' | 'contacts' | 'todos' | 'passwords') => {
    if (tab === 'passwords') {
      if (isPasswordUnlocked && activeTab === 'passwords') {
        return;
      }
      setIsPasswordPinPromptOpen(true);
    } else {
      // Switching away from passwords locks the password section again
      setIsPasswordUnlocked(false);
      setActiveTab(tab);
    }
  };

  const handlePasswordPinSuccess = () => {
    setIsPasswordUnlocked(true);
    setActiveTab('passwords');
    setIsPasswordPinPromptOpen(false);
  };

  const handleOpenEditList = (list: CustomList) => {
    setEditingList(list);
    setIsEditListOpen(true);
  };

  const handleOpenAddItemForList = (listId?: string) => {
    if (listId) setActiveListId(listId);
    setIsAddItemOpen(true);
  };

  const handleOpenShareForList = (listId?: string) => {
    if (listId) setActiveListId(listId);
    setIsShareOpen(true);
  };

  const handleQuickAddItem = (name: string, listId: string) => {
    addItem({
      title: name,
      quantity: '1',
      listId: listId,
      assignedToId: activeMember?.id || 'all',
    });
  };

  const handleToggleComplete = (item: GroceryItem) => {
    updateItem(item.id, { completed: !item.completed });
  };

  const handleReassign = (itemId: string, newMemberId: string) => {
    updateItem(itemId, { assignedToId: newMemberId });
  };

  // Personal Records Handlers
  const handleSavePersonalRecord = (record: Partial<PersonalRecord>) => {
    const targetId = editingPersonalRecord?.id || record.id;
    if (targetId) {
      updatePersonalRecord(targetId, record);
      setEditingPersonalRecord(null);
    } else {
      addPersonalRecord(record);
    }
  };

  const handleEditPersonalRecord = (record: PersonalRecord) => {
    setEditingPersonalRecord(record);
    setIsAddPersonalRecordOpen(true);
  };

  // Calendar Tasks Handlers
  const handleOpenAddTask = (date?: string) => {
    setEditingTask(null);
    setDefaultTaskDate(date || new Date().toISOString().split('T')[0]);
    setIsAddTaskOpen(true);
  };

  const handleEditTask = (task: CalendarTask) => {
    setEditingTask(task);
    setDefaultTaskDate(task.date);
    setIsAddTaskOpen(true);
  };

  const handleSaveTask = (taskData: Partial<CalendarTask>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      setEditingTask(null);
    } else {
      addTask(taskData);
    }
  };

  const handleToggleTaskComplete = (task: CalendarTask) => {
    updateTask(task.id, { completed: !task.completed });
  };

  const handleSendTaskAlert = (task: CalendarTask) => {
    const assignee = data.members.find((m) => m.id === task.assignedToId);
    sendPushAlert(
      task.assignedToId || 'all',
      `📅 Recordatorio de Tarea (${task.date})`,
      `Tarea: "${task.title}" asignada a ${assignee ? assignee.name : 'la familia'}`
    );
  };

  // Contacts Handlers
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setIsAddContactOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsAddContactOpen(true);
  };

  const handleSaveContact = (contactData: Partial<Contact>) => {
    if (editingContact) {
      updateContact(editingContact.id, contactData);
      setEditingContact(null);
    } else {
      addContact(contactData);
    }
  };

  // Passwords Handlers
  const handleOpenAddPassword = () => {
    setEditingPassword(null);
    setIsAddPasswordOpen(true);
  };

  const handleEditPassword = (password: PasswordItem) => {
    setEditingPassword(password);
    setIsAddPasswordOpen(true);
  };

  const handleSavePassword = (passwordData: Partial<PasswordItem>) => {
    if (editingPassword) {
      updatePassword(editingPassword.id, passwordData);
      setEditingPassword(null);
    } else {
      addPassword(passwordData);
    }
  };

  // If app is not authenticated, show PIN lock screen
  if (!isAuthenticated) {
    return (
      <PinLockScreen
        members={data.members}
        onUnlock={handleUnlock}
        onLogin={login}
        initialMember={activeMember}
      />
    );
  }

  const totalPersonalRecords = data.personalRecords ? data.personalRecords.length : 0;
  const totalCategories = data.dataCategories ? data.dataCategories.length : 0;
  const totalTasks = data.calendarTasks ? data.calendarTasks.length : 0;
  const totalContacts = data.contacts ? data.contacts.length : 0;
  const totalTodos = data.todos ? data.todos.length : 0;
  const pendingTodos = data.todos ? data.todos.filter((t) => !t.completed).length : 0;
  const totalPasswords = data.passwords ? data.passwords.length : 0;
  const totalItems = data.items ? data.items.filter((i) => !i.completed).length : 0;

  return (
    <div
      className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors pb-24 ${
        fontSize === 'large' ? 'text-lg' : fontSize === 'xlarge' ? 'text-xl' : 'text-base'
      }`}
    >
      {/* Header with Role Status & Lock / Profile switch button */}
      <Header
        connected={connected}
        isAdmin={isAdmin}
        activeMember={activeMember}
        onLock={handleLock}
        onRequestAdminUnlock={handleElevateToAdmin}
      />

      {/* Main Tab Navigation: Calendario (Home), Listas, Datos, Categorías, Contactos */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 sticky top-14 sm:top-16 z-20 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tab: CALENDARIO (Pantalla de inicio) */}
            <button
              onClick={() => handleSelectTab('calendar')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>CALENDARIO</span>
              {totalTasks > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'calendar'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalTasks}
                </span>
              )}
            </button>

            {/* Tab: LISTAS */}
            <button
              onClick={() => handleSelectTab('lists')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'lists'
                  ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>LISTAS</span>
              {totalItems > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'lists'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalItems}
                </span>
              )}
            </button>

            {/* Tab: DATOS PERSONALES */}
            <button
              onClick={() => handleSelectTab('personal_data')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'personal_data'
                  ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>DATOS</span>
              {totalPersonalRecords > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'personal_data'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalPersonalRecords}
                </span>
              )}
            </button>

            {/* Tab: CONTACTOS */}
            <button
              onClick={() => handleSelectTab('contacts')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'contacts'
                  ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>CONTACTOS</span>
              {totalContacts > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'contacts'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalContacts}
                </span>
              )}
            </button>

            {/* Tab: TO-DO (Minimalista) */}
            <button
              onClick={() => handleSelectTab('todos')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'todos'
                  ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>TO-DO</span>
              {pendingTodos > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'todos'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pendingTodos}
                </span>
              )}
            </button>

            {/* Tab: CONTRASEÑA (Al lado de TO-DO) */}
            <button
              onClick={() => handleSelectTab('passwords')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer border shrink-0 ${
                activeTab === 'passwords'
                  ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>CONTRASEÑA</span>
              {totalPasswords > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'passwords'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {totalPasswords}
                </span>
              )}
            </button>
          </div>

          {/* Quick Notification Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer shrink-0"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            {data.notifications.some((n) => !n.read) && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* Push Notification Banner */}
      <NotificationBanner
        recentToast={recentToast}
        onClearToast={clearToast}
        pushPermission={pushPermission}
        onRequestPermission={requestPushPermission}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 w-full flex-1 mt-4">
        {activeTab === 'calendar' ? (
          /* CALENDARIO MENSUAL CON OPCIÓN A COLOCAR TAREAS */
          <MonthlyCalendarView
            tasks={data.calendarTasks || []}
            members={data.members}
            activeMember={activeMember}
            isAdmin={isAdmin}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onToggleComplete={handleToggleTaskComplete}
            onDeleteTask={deleteTask}
            onSendTaskAlert={handleSendTaskAlert}
            fontSize={fontSize}
          />
        ) : activeTab === 'lists' ? (
          /* ACCORDION CUSTOM LISTS WITH PRODUCTS */
          <ListAccordion
            lists={data.lists}
            activeListId={activeListId}
            isAdmin={isAdmin}
            onSelectList={(id) => {
              setActiveListId((prev) => (prev === id ? '' : id));
            }}
            onOpenCreateList={() => setIsCreateListOpen(true)}
            onOpenEditList={handleOpenEditList}
            onDeleteList={deleteList}
            onOpenAddItem={handleOpenAddItemForList}
            onOpenShare={handleOpenShareForList}
            onQuickAddItem={handleQuickAddItem}
            items={data.items}
            currentMember={activeMember}
            members={data.members}
            onToggleComplete={handleToggleComplete}
            onReassign={handleReassign}
            onDeleteItem={deleteItem}
            fontSize={fontSize}
          />
        ) : activeTab === 'personal_data' ? (
          /* DATOS PERSONALES Y ADJUNTOS VIEW */
          <PersonalRecordsView
            records={data.personalRecords || []}
            members={data.members}
            categories={data.dataCategories || []}
            activeMember={activeMember}
            isAdmin={isAdmin}
            onSelectMember={setActiveMember}
            onOpenAddRecord={(preset) => {
              setEditingPersonalRecord(null);
              setAddRecordPreset(preset || null);
              setIsAddPersonalRecordOpen(true);
            }}
            onOpenSendRecord={(record) => {
              setSendingPersonalRecord(record || null);
              setIsSendPersonalRecordOpen(true);
            }}
            onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
            onAddCategory={addDataCategory}
            onAddSubcategory={addSubcategory}
            onEditRecord={handleEditPersonalRecord}
            onDeleteRecord={deletePersonalRecord}
            onViewPhoto={(record, attachmentIndex) =>
              setViewingPhotoState({ record, initialIndex: attachmentIndex || 0 })
            }
            onUpdateRecordTodos={(recordId, todos) =>
              updatePersonalRecord(recordId, { todos })
            }
          />
        ) : activeTab === 'categories' ? (
          /* PANEL DE ADMINISTRACIÓN DE CATEGORÍAS Y SUBCATEGORÍAS */
          <CategoriesAdminView
            categories={data.dataCategories || []}
            records={data.personalRecords || []}
            isAdmin={isAdmin}
            onRequestAdminUnlock={handleElevateToAdmin}
            onAddCategory={addDataCategory}
            onUpdateCategory={updateDataCategory}
            onDeleteCategory={deleteDataCategory}
            onAddSubcategory={addSubcategory}
            onRenameSubcategory={renameSubcategory}
            onDeleteSubcategory={deleteSubcategory}
            onNavigateToDataRecords={() => setActiveTab('personal_data')}
          />
        ) : activeTab === 'todos' ? (
          /* TO-DO LIST MINIMALISTA */
          <MinimalistTodoList
            todos={data.todos || []}
            members={data.members}
            activeMember={activeMember}
            isAdmin={isAdmin}
            onAddTodo={addTodo}
            onUpdateTodo={updateTodo}
            onDeleteTodo={deleteTodo}
            onClearCompleted={clearCompletedTodos}
          />
        ) : activeTab === 'passwords' ? (
          /* GESTOR DE CONTRASEÑAS TIPO TABLA (PROTEGIDO POR PIN) */
          isPasswordUnlocked ? (
            <PasswordsView
              passwords={data.passwords || []}
              members={data.members}
              activeMember={activeMember}
              isAdmin={isAdmin}
              onOpenAddPassword={handleOpenAddPassword}
              onEditPassword={handleEditPassword}
              onDeletePassword={deletePassword}
              onLock={() => {
                setIsPasswordUnlocked(false);
                setActiveTab('calendar');
              }}
              fontSize={fontSize}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto border border-red-200 dark:border-red-900/60 shadow-xs">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Sección Bloqueada
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Introduce tu PIN de seguridad (1474) para desbloquear y ver las contraseñas guardadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordPinPromptOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Desbloquear con PIN</span>
              </button>
            </div>
          )
        ) : (
          /* DIRECTORIO DE CONTACTOS TELEFÓNICOS */
          <ContactsDirectoryView
            contacts={data.contacts || []}
            isAdmin={isAdmin}
            onOpenAddContact={handleOpenAddContact}
            onEditContact={handleEditContact}
            onDeleteContact={deleteContact}
          />
        )}
      </main>

      {/* Modals for Lists */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={addItem}
        members={data.members}
        currentMember={activeMember}
        lists={data.lists}
        activeListId={activeListId || data.lists[0]?.id || 'list_supermercado'}
      />

      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreateList={createList}
      />

      <EditListModal
        isOpen={isEditListOpen}
        onClose={() => {
          setIsEditListOpen(false);
          setEditingList(null);
        }}
        list={editingList}
        onUpdateList={updateList}
        onDeleteList={deleteList}
        canDelete={isAdmin && (data.lists?.length || 0) > 1}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={addMember}
      />

      <SendAlertModal
        isOpen={isSendAlertOpen}
        onClose={() => setIsSendAlertOpen(false)}
        onSendAlert={sendPushAlert}
        members={data.members}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={data.notifications}
        activeMember={activeMember}
        onMarkAllRead={() => {
          if (activeMember) markNotificationsRead(activeMember.id);
        }}
      />

      <ShareListModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        items={data.items}
        members={data.members}
        activeMember={activeMember}
        activeList={activeList}
      />

      {/* Personal Record Add / Edit Modal */}
      <AddPersonalRecordModal
        isOpen={isAddPersonalRecordOpen}
        onClose={() => {
          setIsAddPersonalRecordOpen(false);
          setEditingPersonalRecord(null);
          setAddRecordPreset(null);
        }}
        onSave={handleSavePersonalRecord}
        onUploadFile={uploadFile}
        onUploadFiles={uploadMultipleFiles}
        members={data.members}
        activeMember={activeMember}
        editingRecord={editingPersonalRecord}
        records={data.personalRecords || []}
        categories={data.dataCategories || []}
        initialCategory={addRecordPreset?.category}
        initialSubcategory={addRecordPreset?.subcategory}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
        onAddSubcategory={addSubcategory}
        onPreviewAttachment={(att) =>
          setViewingPhotoState({
            record: {
              id: 'temp_preview',
              memberId: activeMember?.id || 'member_jaime',
              category: 'Vista Previa',
              subcategory: att.fileName,
              attachments: [att],
              createdAt: new Date().toISOString(),
            },
            initialIndex: 0,
          })
        }
      />

      {/* Categories and Subcategories Management Modal */}
      <ManageDataCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={data.dataCategories || []}
        records={data.personalRecords || []}
        onAddCategory={addDataCategory}
        onUpdateCategory={updateDataCategory}
        onDeleteCategory={deleteDataCategory}
        onAddSubcategory={addSubcategory}
        onRenameSubcategory={renameSubcategory}
        onDeleteSubcategory={deleteSubcategory}
      />

      {/* Send / Share Personal Record Modal */}
      <SendPersonalRecordModal
        isOpen={isSendPersonalRecordOpen}
        onClose={() => {
          setIsSendPersonalRecordOpen(false);
          setSendingPersonalRecord(null);
        }}
        record={sendingPersonalRecord}
        records={data.personalRecords || []}
        members={data.members}
        onSendAlert={sendPushAlert}
        onViewPhoto={(record, attachmentIndex) =>
          setViewingPhotoState({ record, initialIndex: attachmentIndex || 0 })
        }
      />

      {/* Full screen photo / document lightbox */}
      <PhotoLightboxModal
        record={viewingPhotoState?.record || null}
        initialIndex={viewingPhotoState?.initialIndex || 0}
        onClose={() => setViewingPhotoState(null)}
        onSendRecord={(record) => {
          setSendingPersonalRecord(record);
          setIsSendPersonalRecordOpen(true);
        }}
      />

      {/* Contacts Add / Edit Modal */}
      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => {
          setIsAddContactOpen(false);
          setEditingContact(null);
        }}
        onSaveContact={handleSaveContact}
        editingContact={editingContact}
      />

      {/* Passwords Add / Edit Modal */}
      <AddPasswordModal
        isOpen={isAddPasswordOpen}
        onClose={() => {
          setIsAddPasswordOpen(false);
          setEditingPassword(null);
        }}
        onSave={handleSavePassword}
        editingPassword={editingPassword}
        members={data.members}
        activeMember={activeMember}
      />

      {/* Admin PIN Prompt Modal */}
      <AdminPinPromptModal
        isOpen={isAdminPinPromptOpen}
        onClose={() => setIsAdminPinPromptOpen(false)}
        onSuccess={handleAdminPinSuccess}
      />

      {/* Password Section PIN Prompt Modal */}
      <PasswordPinPromptModal
        isOpen={isPasswordPinPromptOpen}
        onClose={() => setIsPasswordPinPromptOpen(false)}
        onSuccess={handlePasswordPinSuccess}
        activeMember={activeMember}
        onLogin={login}
      />
    </div>
  );
}
