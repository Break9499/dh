import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Compressor, CompressorStatus, MaintenanceRecord, RunLog, UserRole } from './types';
import { LayoutDashboard, Server, ClipboardList, Menu, X, Bell, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CompressorList from './components/CompressorList';
import MaintenanceLog from './components/MaintenanceLog';

// Mock Data Initialization
const INITIAL_COMPRESSORS: Compressor[] = [
  {
    id: 'c1', name: 'CP-Alpha', model: 'Ariel JJG-2', location: 'Station A',
    totalRunTimeMinutes: 28500, currentCycleRunTimeMinutes: 29500, maintenanceThresholdMinutes: 30000,
    status: CompressorStatus.RUNNING, lastMaintenanceDate: '2023-10-01', nextMaintenanceDue: false, installDate: '2022-01-15'
  },
  {
    id: 'c2', name: 'CP-Beta', model: 'Dresser-Rand', location: 'Station B',
    totalRunTimeMinutes: 12000, currentCycleRunTimeMinutes: 2000, maintenanceThresholdMinutes: 30000,
    status: CompressorStatus.STOPPED, lastMaintenanceDate: '2023-12-15', nextMaintenanceDue: false, installDate: '2022-06-20'
  },
  {
    id: 'c3', name: 'CP-Gamma', model: 'GE Gemini', location: 'Station A',
    totalRunTimeMinutes: 59000, currentCycleRunTimeMinutes: 30100, maintenanceThresholdMinutes: 30000,
    status: CompressorStatus.RUNNING, lastMaintenanceDate: '2023-08-10', nextMaintenanceDue: true, installDate: '2021-11-05'
  }
];

const INITIAL_LOGS: MaintenanceRecord[] = [
  { id: 'm1', compressorId: 'c1', date: '2023-10-01', type: '常规保养', description: '更换机油和滤芯', technician: '张三', result: 'SUCCESS' },
  { id: 'm2', compressorId: 'c3', date: '2023-08-10', type: '深度保养', description: '更换活塞环', technician: '李四', result: 'SUCCESS' }
];

const STORAGE_KEY = 'compressor_guard_data_v1';

const App: React.FC = () => {
  // State Management with Persistence Logic
  const [state, setState] = useState<AppState>(() => {
    // 1. 尝试从本地存储加载数据
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const savedState = parsedData.state as AppState;
        const lastTimestamp = parsedData.timestamp as number;
        
        // 2. 计算离线时长 (分钟)
        const now = Date.now();
        const elapsedMinutes = Math.max(0, Math.floor((now - lastTimestamp) / 60000));
        
        // 3. 如果有离线时间，补偿给所有“运行中”的设备
        if (elapsedMinutes > 0) {
          savedState.compressors = savedState.compressors.map(comp => {
            if (comp.status === CompressorStatus.RUNNING) {
              const newCurrentCycle = comp.currentCycleRunTimeMinutes + elapsedMinutes;
              return {
                ...comp,
                totalRunTimeMinutes: comp.totalRunTimeMinutes + elapsedMinutes,
                currentCycleRunTimeMinutes: newCurrentCycle,
                nextMaintenanceDue: newCurrentCycle >= comp.maintenanceThresholdMinutes
              };
            }
            return comp;
          });
        }
        return savedState;
      } catch (e) {
        console.error("Failed to load saved state:", e);
      }
    }

    // 4. 如果没有存档，使用初始数据
    return {
      compressors: INITIAL_COMPRESSORS,
      maintenanceLogs: INITIAL_LOGS,
      runLogs: [], 
      currentUserRole: UserRole.ADMIN,
      isSidebarOpen: true
    };
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'equipment' | 'maintenance'>('dashboard');

  // Persistence Effect: Save state whenever it changes
  useEffect(() => {
    const dataToSave = {
      state: state,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [state]);

  // Runtime Simulation Effect (Active Window)
  useEffect(() => {
    // 正常计时：每60000ms (1分钟) 检测一次，增加 1分钟运行时间
    const interval = setInterval(() => {
      setState(prevState => {
        const updatedCompressors = prevState.compressors.map(comp => {
          if (comp.status === CompressorStatus.RUNNING) {
            const newTotal = comp.totalRunTimeMinutes + 1; 
            const newCurrentCycle = comp.currentCycleRunTimeMinutes + 1;
            
            return {
              ...comp,
              totalRunTimeMinutes: newTotal,
              currentCycleRunTimeMinutes: newCurrentCycle,
              nextMaintenanceDue: newCurrentCycle >= comp.maintenanceThresholdMinutes
            };
          }
          return comp;
        });
        return { ...prevState, compressors: updatedCompressors };
      });
    }, 60000); 

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const toggleCompressorStatus = (id: string) => {
    setState(prev => {
      const now = new Date().toISOString();
      const target = prev.compressors.find(c => c.id === id);
      if (!target) return prev;

      const newStatus = target.status === CompressorStatus.RUNNING 
        ? CompressorStatus.STOPPED 
        : CompressorStatus.RUNNING;
      
      // Log logic
      let newRunLogs = [...prev.runLogs];
      if (newStatus === CompressorStatus.RUNNING) {
        newRunLogs.push({
          id: Date.now().toString(),
          compressorId: id,
          startTime: now,
          durationMinutes: 0,
          isManual: false,
          operator: '当前用户'
        });
      } else {
        // Find last open log and close it
        const lastLogIndex = newRunLogs.findIndex(l => l.compressorId === id && !l.endTime);
        if (lastLogIndex >= 0) {
          const startTime = new Date(newRunLogs[lastLogIndex].startTime).getTime();
          const duration = Math.round((new Date().getTime() - startTime) / 60000);
          newRunLogs[lastLogIndex] = {
            ...newRunLogs[lastLogIndex],
            endTime: now,
            durationMinutes: duration
          };
        }
      }

      const updatedCompressors = prev.compressors.map(c => 
        c.id === id ? { ...c, status: newStatus } : c
      );

      return { ...prev, compressors: updatedCompressors, runLogs: newRunLogs };
    });
  };

  const addMaintenanceRecord = (record: Omit<MaintenanceRecord, 'id'>) => {
    setState(prev => {
      const newRecord = { ...record, id: Date.now().toString() };
      const updatedCompressors = prev.compressors.map(c => {
        if (c.id === record.compressorId) {
          return {
            ...c,
            lastMaintenanceDate: record.date,
            currentCycleRunTimeMinutes: 0, // Reset cycle
            nextMaintenanceDue: false,
            status: CompressorStatus.STOPPED // Usually stopped after maintenance
          };
        }
        return c;
      });

      return {
        ...prev,
        maintenanceLogs: [newRecord, ...prev.maintenanceLogs],
        compressors: updatedCompressors
      };
    });
    setActiveView('dashboard'); // Redirect to dashboard to see cleared alert
  };

  const handleAddCompressor = (data: { name: string; model: string; location: string; thresholdHours: number; installDate: string }) => {
    setState(prev => {
      const newCompressor: Compressor = {
        id: `c${Date.now()}`,
        name: data.name,
        model: data.model,
        location: data.location,
        totalRunTimeMinutes: 0,
        currentCycleRunTimeMinutes: 0,
        maintenanceThresholdMinutes: data.thresholdHours * 60,
        status: CompressorStatus.STOPPED,
        lastMaintenanceDate: '-',
        nextMaintenanceDue: false,
        installDate: data.installDate
      };
      return {
        ...prev,
        compressors: [...prev.compressors, newCompressor]
      };
    });
  };

  const handleEditCompressor = (id: string, data: Partial<Compressor>) => {
    setState(prev => ({
        ...prev,
        compressors: prev.compressors.map(c => c.id === id ? { ...c, ...data } : c)
    }));
  };

  const handleDeleteCompressor = (id: string) => {
    if (window.confirm('确定要删除这台设备吗？此操作无法撤销。')) {
        setState(prev => ({
            ...prev,
            compressors: prev.compressors.filter(c => c.id !== id)
        }));
    }
  };

  // UI Components
  const NavItem = ({ view, icon: Icon, label }: { view: typeof activeView, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors duration-200 ${
        activeView === view 
          ? 'bg-brand-50 border-r-4 border-brand-500 text-brand-700' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
              东
            </div>
            <span className="text-base font-bold text-gray-800 tracking-tight leading-tight">东一联压缩机<br/>保养记录平台</span>
          </div>

          <nav className="flex-1 py-6 space-y-1">
            <NavItem view="dashboard" icon={LayoutDashboard} label="概览" />
            <NavItem view="equipment" icon={Server} label="设备管理" />
            <NavItem view="maintenance" icon={ClipboardList} label="保养记录" />
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">管理员</p>
                <p className="text-xs text-gray-500">admin@gas-station.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 z-10">
          <button 
            onClick={() => setState(s => ({ ...s, isSidebarOpen: !s.isSidebarOpen }))}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md"
          >
            {state.isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex-1"></div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-500">
              <Bell size={20} />
              {state.compressors.some(c => c.nextMaintenanceDue) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <Dashboard state={state} />}
            {activeView === 'equipment' && (
              <CompressorList 
                state={state} 
                onToggleStatus={toggleCompressorStatus}
                onMaintenanceClick={() => setActiveView('maintenance')}
                onAddCompressor={handleAddCompressor}
                onEditCompressor={handleEditCompressor}
                onDeleteCompressor={handleDeleteCompressor}
                userRole={state.currentUserRole} 
              />
            )}
            {activeView === 'maintenance' && (
              <MaintenanceLog 
                state={state} 
                onAddRecord={addMaintenanceRecord} 
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {state.isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setState(s => ({ ...s, isSidebarOpen: false }))}
        ></div>
      )}
    </div>
  );
};

export default App;