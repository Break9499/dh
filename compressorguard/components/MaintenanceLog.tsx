import React, { useState } from 'react';
import { AppState, Compressor, MaintenanceRecord } from '../types';
import { Wrench, Check, History, Save } from 'lucide-react';

interface MaintenanceLogProps {
  state: AppState;
  onAddRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
  targetCompressorId?: string;
}

const MaintenanceLog: React.FC<MaintenanceLogProps> = ({ state, onAddRecord, targetCompressorId }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    compressorId: targetCompressorId || (state.compressors[0]?.id || ''),
    description: '',
    technician: '当前用户',
    type: '常规保养',
    result: 'SUCCESS' as const
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRecord({
      ...formData,
      date: new Date().toISOString().split('T')[0],
    });
    setShowForm(false);
    // Reset form mostly
    setFormData(prev => ({ ...prev, description: '' }));
  };

  const filteredLogs = targetCompressorId 
    ? state.maintenanceLogs.filter(l => l.compressorId === targetCompressorId)
    : state.maintenanceLogs;

  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Wrench className="text-gray-500" />
          保养记录
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm hover:bg-brand-700 transition flex items-center gap-2"
        >
          {showForm ? '取消' : '新建保养记录'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">填写保养单</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">设备</label>
              <select 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                value={formData.compressorId}
                onChange={e => setFormData({...formData, compressorId: e.target.value})}
              >
                {state.compressors.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保养类型</label>
              <select 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="常规保养">常规保养 (机油/滤芯)</option>
                <option value="深度保养">深度保养</option>
                <option value="故障维修">故障维修</option>
                <option value="巡检">例行巡检</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">保养内容描述</label>
              <textarea 
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                rows={3}
                placeholder="例如：更换润滑油，清洗进气滤网，检查皮带张力..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">执行人</label>
              <input 
                type="text" 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                value={formData.technician}
                onChange={e => setFormData({...formData, technician: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结果</label>
              <select 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-2 border"
                value={formData.result}
                onChange={e => setFormData({...formData, result: e.target.value as any})}
              >
                <option value="SUCCESS">完成 - 设备正常</option>
                <option value="ISSUE">遗留问题 - 需进一步观察</option>
                <option value="PENDING">未完成 - 等待备件</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
              <Save size={18} />
              提交并重置周期
            </button>
          </div>
        </form>
      )}

      <div className="p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">执行人</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  暂无保养记录
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => {
                const comp = state.compressors.find(c => c.id === log.compressorId);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp?.name || '未知设备'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.description}>{log.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.technician}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.result === 'SUCCESS' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Check size={12} className="mr-1"/> 完成</span>}
                      {log.result === 'ISSUE' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">异常</span>}
                      {log.result === 'PENDING' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">待定</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceLog;