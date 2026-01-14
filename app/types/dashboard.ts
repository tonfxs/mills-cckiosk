export interface SystemHealth {
  cpu: number;
  memory: number;
  storage: number;
  connectivity: string;
  battery: number;
}

export interface Transaction {
  id: string;
  time: string;
  amount: number;
  items: number;
  status: 'completed' | 'refunded' | 'pending';
}

export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  threshold: number;
  status: 'good' | 'low' | 'critical';
}

export interface Alert {
  id: number;
  type: 'warning' | 'info' | 'error';
  message: string;
  time: string;
}

export interface KioskData {
  status: 'online' | 'offline';
  ordersPickedUp: number;
  todayTransactions: number;
  returnItemsReceived: number;
  entriesSubmitted: number;
  systemHealth: SystemHealth;
  recentTransactions: Transaction[];
  inventory: InventoryItem[];
  alerts: Alert[];
}