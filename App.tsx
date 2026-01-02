
import React, { useState, useEffect } from 'react';
import { PatientRecord, OCRResult } from './types';
import Scanner from './components/Scanner';
import StatsCards from './components/StatsCards';
import RecordTable from './components/RecordTable';
import { downloadAsJSON, downloadAsCSV } from './utils/exportUtils';
import { Stethoscope, Bell, Settings, LogOut, LayoutDashboard, History, Database, FileSpreadsheet } from 'lucide-react';

const App: React.FC = () => {
  const [records, setRecords] = useState<PatientRecord[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('medscan_records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved records");
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('medscan_records', JSON.stringify(records));
  }, [records]);

  const handleDataExtracted = (data: OCRResult) => {
    const newRecord: PatientRecord = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  const deleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const exportJSON = () => downloadAsJSON(records);
  const exportCSV = () => downloadAsCSV(records);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - Hidden on mobile, shown on md+ */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg tracking-tight">MedScan Pro</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-white bg-slate-800 rounded-lg group">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
            <Database className="w-5 h-5 group-hover:text-blue-400" />
            <span className="font-medium">Records</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
            <History className="w-5 h-5 group-hover:text-blue-400" />
            <span className="font-medium">Audit Logs</span>
          </a>
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
            <Settings className="w-5 h-5 group-hover:text-blue-400" />
            <span className="font-medium">Configuration</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors group">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900">MedScan</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-slate-900">Clinical Dashboard</h1>
            <p className="text-xs text-slate-500">Welcome back, Dr. Administrator</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <img 
                src="https://picsum.photos/seed/doctor/64/64" 
                alt="User profile" 
                className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
              />
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-slate-900">Dr. Sarah Chen</p>
                <p className="text-xs text-slate-500">Chief Medical Officer</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Patient Data OCR Assistant</h2>
            <p className="text-slate-500">Process medical documents instantly with Gemini-powered vision analysis.</p>
          </div>

          <StatsCards records={records} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-1">
              <Scanner onDataExtracted={handleDataExtracted} />
              
              <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2">Automated Sheet Sync</h3>
                  <p className="text-blue-100 text-sm mb-4">Exported records are formatted for immediate import into Google Sheets or Excel Hospital ERPs.</p>
                  <button onClick={exportCSV} className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors">
                    Download Master Log
                  </button>
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                  {/* Fix: Added missing FileSpreadsheet icon from lucide-react */}
                  <FileSpreadsheet className="w-40 h-40" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-2">
              <RecordTable 
                records={records} 
                onDelete={deleteRecord} 
                onExportJSON={exportJSON}
                onExportCSV={exportCSV}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
