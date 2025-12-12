import React, { useState } from 'react';
import { AppState, Compressor, CompressorStatus, UserRole } from '../types';
import { Play, Square, Settings, PenTool, AlertCircle, X, Plus, Save, Trash2, Edit } from 'lucide-react';

interface CompressorListProps {
  state: AppState;
  onToggleStatus: (id: string) => void;
  onMaintenanceClick: (id: string) => void;
  onAddCompressor: (data: { name: string; model: string; location: string; thresholdHours: number; installDate: string }) => void;
  onEditCompressor: (id: string, data: Partial<Compressor>) => void;
  onDeleteCompressor: (id: string) => void;
  userRole: UserRole;
}

const CompressorList: React.FC<CompressorListProps> = ({ state, onToggleStatus, onMaintenanceClick, onAddCompressor, onEditCompressor, onDeleteCompressor, userRole }) => {
  
  // State for Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompressorData, setNewCompressorData] = useState({
    name: '',
    model: '',
    location: '',
    thresholdHours: 500,
    installDate: new Date().toISOString().split('T')[0]
  });

  // State for Edit Modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    model: '',
    location: '',
    thresholdHours: 500,
    installDate: ''
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCompressor(newCompressorData);
    setShowAddModal(false);
    // Reset form
    setNewCompressorData({
      name: '',
      model: '',
      location: '',
      thresholdHours: 500,
      installDate: new Date().toISOString().split('T')[0]
    });
  };

  const openEditModal = (comp: Compressor) => {
    setEditingId(comp.id);
    setEditFormData({
      name: comp.name,
      model: comp.model,
      location: comp.location,
      thresholdHours: Math.round(comp.maintenanceThresholdMinutes / 60),
      installDate: comp.installDate
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEditCompressor(editingId, {
        name: editFormData.name,
        model: editFormData.model,
        location: editFormData.location,
        maintenanceThresholdMinutes: editFormData.thresholdHours * 60,
        installDate: editFormData.installDate
      });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">设备管理</h2>
        {userRole === UserRole.ADMIN && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm font-medium hover:bg-brand-700 transition shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            新增设备
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.compressors.map((comp) => (
          <div key={comp.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(comp.status)} animate-pulse`} />
                <div>
                  <h3 className="font-bold text-gray-900">{comp.name}</h3>
                  <p className="text-xs text-gray-500">{comp.model}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(comp.status)}`}>
                {getStatusText(comp.status)}
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">本周期运行时长:</span>
                <span className={`font-mono font-medium ${(comp.currentCycleRunTimeMinutes / comp.maintenanceThresholdMinutes) > 0.9 ? 'text-red-600' : 'text-gray-900'}`}>
                  {(comp.currentCycleRunTimeMinutes / 60).toFixed(1)} h
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full ${getProgressColor(comp.currentCycleRunTimeMinutes, comp.maintenanceThresholdMinutes)}`} 
                  style={{ width: `${Math.min(100, (comp.currentCycleRunTimeMinutes / comp.maintenanceThresholdMinutes) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>保养进度: {Math.round((comp.currentCycleRunTimeMinutes / comp.maintenanceThresholdMinutes) * 100)}%</span>
                <span>100%</span>
              </div>

              {comp.nextMaintenanceDue && (
                <div className="bg-red-50 text-red-700 text-xs p-2 rounded flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>已达保养阈值，请尽快安排维护！</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-start gap-2">
              {comp.status === CompressorStatus.RUNNING ? (
                 <button 
                   onClick={() => onToggleStatus(comp.id)}
                   className="p-2 border border-red-200 text-red-600 rounded hover:bg-red-50 tooltip"
                   title="停止运行"
                 >
                   <Square size={18} fill="currentColor" />
                 </button>
              ) : (
                <button 
                  onClick={() => onToggleStatus(comp.id)}
                  className="p-2 border border-green-200 text-green-600 rounded hover:bg-green-50 tooltip"
                  title="开始运行"
                  disabled={comp.status === CompressorStatus.MAINTENANCE}
                >
                  <Play size={18} fill="currentColor" />
                </button>
              )}
              <button 
                onClick={() => onMaintenanceClick(comp.id)}
                className="p-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50"
                title="保养记录"
              >
                <PenTool size={18} />
              </button>
              {userRole === UserRole.ADMIN && (
                <>
                  <button 
                    onClick={() => openEditModal(comp)}
                    className="p-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50"
                    title="编辑设备"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteCompressor(comp.id)}
                    className="p-2 border border-gray-200 text-red-500 rounded hover:bg-red-50"
                    title="删除设备"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Compressor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">新增压缩机设备</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备编号/名称</label>
                <input 
                  type="text" required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                  placeholder="例如：CP-04"
                  value={newCompressorData.name}
                  onChange={e => setNewCompressorData({...newCompressorData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
                  <input 
                    type="text" required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    placeholder="例如：Ariel JGJ"
                    value={newCompressorData.model}
                    onChange={e => setNewCompressorData({...newCompressorData, model: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">安装位置</label>
                  <input 
                    type="text" required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    placeholder="例如：2号站区"
                    value={newCompressorData.location}
                    onChange={e => setNewCompressorData({...newCompressorData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保养阈值 (小时)</label>
                  <input 
                    type="number" required min="10"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    value={newCompressorData.thresholdHours}
                    onChange={e => setNewCompressorData({...newCompressorData, thresholdHours: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">投入使用日期</label>
                  <input 
                    type="date" required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    value={newCompressorData.installDate}
                    onChange={e => setNewCompressorData({...newCompressorData, installDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 flex items-center gap-2 shadow-sm"
                >
                  <Save size={18} />
                  保存设备
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Compressor Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">编辑设备信息</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备编号/名称</label>
                <input 
                  type="text" required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                  value={editFormData.name}
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
                  <input 
                    type="text" required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    value={editFormData.model}
                    onChange={e => setEditFormData({...editFormData, model: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">安装位置</label>
                  <input 
                    type="text" required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    value={editFormData.location}
                    onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保养阈值 (小时)</label>
                  <input 
                    type="number" required min="10"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    value={editFormData.thresholdHours}
                    onChange={e => setEditFormData({...editFormData, thresholdHours: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">投入使用日期</label>
                  <input 
                    type="date" required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                    value={editFormData.installDate}
                    onChange={e => setEditFormData({...editFormData, installDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 flex items-center gap-2 shadow-sm"
                >
                  <Save size={18} />
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for styling
const getStatusColor = (status: CompressorStatus) => {
  switch(status) {
    case CompressorStatus.RUNNING: return 'bg-green-500';
    case CompressorStatus.STOPPED: return 'bg-gray-400';
    case CompressorStatus.MAINTENANCE: return 'bg-amber-500';
    case CompressorStatus.ERROR: return 'bg-red-500';
  }
};

const getStatusBadge = (status: CompressorStatus) => {
  switch(status) {
    case CompressorStatus.RUNNING: return 'bg-green-100 text-green-800';
    case CompressorStatus.STOPPED: return 'bg-gray-100 text-gray-800';
    case CompressorStatus.MAINTENANCE: return 'bg-amber-100 text-amber-800';
    case CompressorStatus.ERROR: return 'bg-red-100 text-red-800';
  }
};

const getStatusText = (status: CompressorStatus) => {
  switch(status) {
    case CompressorStatus.RUNNING: return '运行中';
    case CompressorStatus.STOPPED: return '已停机';
    case CompressorStatus.MAINTENANCE: return '保养中';
    case CompressorStatus.ERROR: return '故障';
  }
};

const getProgressColor = (current: number, max: number) => {
  const ratio = current / max;
  if (ratio >= 1) return 'bg-red-500';
  if (ratio >= 0.8) return 'bg-amber-500';
  return 'bg-brand-500';
};

export default CompressorList;