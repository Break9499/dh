export enum CompressorStatus {
  STOPPED = 'STOPPED',
  RUNNING = 'RUNNING',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
}

export enum UserRole {
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN'
}

export interface MaintenanceRecord {
  id: string;
  compressorId: string;
  date: string;
  type: string;
  description: string;
  technician: string;
  result: 'SUCCESS' | 'PENDING' | 'ISSUE';
}

export interface RunLog {
  id: string;
  compressorId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  isManual: boolean;
  operator: string;
}

export interface Compressor {
  id: string;
  name: string; // e.g., "CP-01"
  model: string;
  location: string;
  totalRunTimeMinutes: number; // Cumulative total
  currentCycleRunTimeMinutes: number; // Since last maintenance
  maintenanceThresholdMinutes: number; // Alert threshold (e.g. 30000 mins = 500h)
  status: CompressorStatus;
  lastMaintenanceDate: string;
  nextMaintenanceDue: boolean;
  installDate: string;
}

export interface AppState {
  compressors: Compressor[];
  maintenanceLogs: MaintenanceRecord[];
  runLogs: RunLog[];
  currentUserRole: UserRole;
  isSidebarOpen: boolean;
}