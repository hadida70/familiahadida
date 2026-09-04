export interface CustomList {
  id: string;
  name: string;
  icon: string;
  color?: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  username?: string;
  pin?: string;
  role: 'admin' | 'member';
  avatarColor: string;
  avatarInitial: string;
  iconName?: string;
  createdAt?: string;
}

export interface AuthSession {
  token: string;
  user: Member;
}

export interface GroceryItem {
  id: string;
  listId: string;
  title: string;
  category?: string;
  quantity?: string;
  notes?: string;
  assignedToId: string;
  completed: boolean;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  urgent?: boolean;
}

export interface PersonalRecord {
  id: string;
  memberId: string; // ID of the member this personal data belongs to
  category: string;
  subcategory: string;
  title?: string;
  notes?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string; // Path or URL to download/view the uploaded file
  fileDataUrl?: string; // base64 / data URL for preview fallback

  // Credit / Debit Card specific fields
  cardNumber?: string;       // e.g. "4580 9811 3659 9900"
  cardHolder?: string;       // e.g. "JAIME HADIDA"
  cardExp?: string;          // e.g. "12/30"
  cardCvc?: string;          // e.g. "261"
  cardBank?: string;         // e.g. "DREAMCARD VIP (MAX)", "ISRACARD"
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'isracard' | 'other';
  cardTheme?: 'black_vip' | 'isracard_white' | 'blue_metal' | 'gold_luxury' | 'titanium';
  cardAccountNo?: string;    // e.g. "18-001-0216582513"

  createdAt: string;
  updatedAt?: string;
}

export interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:mm format optional
  assignedToId?: string; // member id
  completed: boolean;
  completedAt?: string;
  category?: string; // e.g. 'Hogar', 'Salud', 'Compras', 'Trámites', 'General'
  urgent?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  address?: string;
  placeName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  assignedToId?: string; // member ID or 'all'
  category?: string; // e.g. 'General', 'Hogar', 'Urgente', 'Personal'
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PushNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type:
    | 'item_assigned'
    | 'item_updated'
    | 'admin_alert'
    | 'item_completed'
    | 'list_created'
    | 'personal_data_added'
    | 'task_created'
    | 'task_completed'
    | 'todo_added'
    | 'todo_completed';
  itemId?: string;
  listId?: string;
  taskId?: string;
}

export interface DataCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  subcategories: string[];
  isDefault?: boolean;
  createdAt?: string;
}

export interface AppData {
  members: Member[];
  lists: CustomList[];
  items: GroceryItem[];
  personalRecords?: PersonalRecord[];
  dataCategories?: DataCategory[];
  calendarTasks?: CalendarTask[];
  contacts?: Contact[];
  todos?: TodoItem[];
  notifications: PushNotification[];
}

