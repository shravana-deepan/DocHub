
import React from 'react';
import { PatientRecord, SourceType } from '../types';
import { ClipboardList, Activity, UserCheck, BarChart3 } from 'lucide-react';

interface StatsCardsProps {
  records: PatientRecord[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ records }) => {
  const total = records.length;
  const labelsCount = records.filter(r => r.source_type === SourceType.LABEL).length;
  const whiteboardCount = records.filter(r => r.source_type === SourceType.WHITEBOARD).length;
  const todayCount = records.filter(r => {
    const today = new Date().toLocaleDateString();
    const recordDate = new Date(r.timestamp).toLocaleDateString();
    return today === recordDate;
  }).length;

  const stats = [
    { label: 'Total Scans', value: total, icon: ClipboardList, color: 'bg-blue-500' },
    { label: 'Today\'s Activity', value: todayCount, icon: Activity, color: 'bg-orange-500' },
    { label: 'Patient Labels', value: labelsCount, icon: UserCheck, color: 'bg-emerald-500' },
    { label: 'Whiteboards', value: whiteboardCount, icon: BarChart3, color: 'bg-purple-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className={`${stat.color} p-3 rounded-lg text-white`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
