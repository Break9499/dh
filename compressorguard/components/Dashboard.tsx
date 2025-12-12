import React, { useMemo } from 'react';
import { AppState, Compressor, CompressorStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const stats = useMemo(() => {
    const total = state.compressors.length;
    const running = state.compressors.filter(c => c.status === CompressorStatus.RUNNING).length;
    const maintenanceDue = state.compressors.filter(c => c.nextMaintenanceDue).length;
    const totalRuntimeHours = state.compressors.reduce((acc, curr) => acc + curr.totalRunTimeMinutes, 0) / 60;

    return { total, running, maintenanceDue, totalRuntimeHours: totalRuntimeHours.toFixed(0) };
  }, [state.compressors]);

  const chartData = useMemo(() => {
    return state.compressors.map(c => ({
      name: c.name,
      runtime: parseFloat((c.currentCycleRunTimeMinutes / 60).toFixed(1)),
      threshold: parseFloat((c.maintenanceThresholdMinutes / 60).toFixed(1)),
      isDue: c.nextMaintenanceDue
    })).sort((a, b) => b.runtime - a.runtime);
  }, [state.compressors]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="运行中设备" 
          value={stats.running} 
          total={stats.total} 
          icon={<Activity className="text-green-500" />} 
          color="border-l-4 border-green-500"
        />
        <StatCard 
          title="待保养提醒" 
          value={stats.maintenanceDue} 
          icon={<AlertTriangle className="text-amber-500" />} 
          color="border-l-4 border-amber-500"
          highlight={stats.maintenanceDue > 0}
        />
        <StatCard 
          title="总运行工时 (H)" 
          value={stats.totalRuntimeHours} 
          icon={<Clock className="text-blue-500" />} 
          color="border-l-4 border-blue-500"
        />
        <StatCard 
          title="设备总数" 
          value={stats.total} 
          icon={<CheckCircle className="text-gray-500" />} 
          color="border-l-4 border-gray-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">当前保养周期运行工时统计 (小时)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip 
                  formatter={(value: number) => [`${value} 小时`, '当前运行']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="runtime" name="当前运行" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isDue ? '#ef4444' : '#0ea5e9'} />
                  ))}
                </Bar>
                <Bar dataKey="threshold" name="保养阈值" fill="#e5e7eb" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">提醒列表</h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {stats.maintenanceDue === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle className="w-12 h-12 mb-2 opacity-20" />
                <p>暂无紧急保养提醒</p>
              </div>
            ) : (
              <div className="space-y-3">
                {state.compressors.filter(c => c.nextMaintenanceDue).map(c => (
                  <div key={c.id} className="p-3 bg-red-50 border border-red-100 rounded-md flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">{c.name} - 需要保养</p>
                      <p className="text-xs text-red-600 mt-1">
                        已运行: {(c.currentCycleRunTimeMinutes / 60).toFixed(1)}h / 阈值: {(c.maintenanceThresholdMinutes / 60).toFixed(0)}h
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, total, icon, color, highlight = false }: any) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm ${color} ${highlight ? 'ring-2 ring-red-200' : ''}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-baseline mt-1">
          <h2 className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</h2>
          {total && <span className="ml-2 text-sm text-gray-400">/ {total}</span>}
        </div>
      </div>
      <div className="p-2 bg-gray-50 rounded-full">{icon}</div>
    </div>
  </div>
);

export default Dashboard;