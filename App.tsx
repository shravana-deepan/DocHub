
import React, { useState, useEffect } from 'react';
import { PatientRecord, OCRResult, SyncConfig } from './types';
import Scanner from './components/Scanner';
import StatsCards from './components/StatsCards';
import RecordTable from './components/RecordTable';
import SyncSettings from './components/SyncSettings';
import { downloadAsJSON, downloadAsCSV } from './utils/exportUtils';
import { syncToGoogleSheets, isValidWebAppUrl } from './services/syncService';
import { Stethoscope, Bell, Settings, LogOut, LayoutDashboard, Database, Cloud, AlertCircle, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({ webhookUrl: '', autoSync: false });
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load state
  useEffect(() => {
    const savedRecords = localStorage.getItem('medscan_records');
    const savedConfig = localStorage.getItem('medscan_sync_config');
    
    if (savedRecords) {
      try { setRecords(JSON.parse(savedRecords)); } catch (e) { console.error("Records parse error", e); }
    }
    if (savedConfig) {
      try { setSyncConfig(JSON.parse(savedConfig)); } catch (e) { console.error("Config parse error", e); }
    }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem('medscan_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('medscan_sync_config', JSON.stringify(syncConfig));
  }, [syncConfig]);

  const handleSync = async (recordIds: string[]) => {
    if (!isValidWebAppUrl(syncConfig.webhookUrl)) {
      setShowSettings(true);
      return;
    }

    setIsSyncing(true);
    const toSync = records.filter(r => recordIds.includes(r.id));
    
    const success = await syncToGoogleSheets(syncConfig.webhookUrl, toSync);
    
    if (success) {
      setRecords(prev => prev.map(r => 
        recordIds.includes(r.id) ? { ...r, synced: true } : r
      ));
    } else {
      alert("Critical: Could not connect to Google Sheets. Verify your Web App Deployment settings.");
    }
    setIsSyncing(false);
  };

  const handleDataExtracted = async (data: OCRResult) => {
    const newRecord: PatientRecord = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      synced: false
    };

    setRecords(prev => [newRecord, ...prev]);

    if (syncConfig.autoSync && isValidWebAppUrl(syncConfig.webhookUrl)) {
      setIsSyncing(true);
      const success = await syncToGoogleSheets(syncConfig.webhookUrl, [newRecord]);
      if (success) {
        setRecords(prev => prev.map(r => r.id === newRecord.id ? { ...r, synced: true } : r));
      }
      setIsSyncing(false);
    }
  };

  const deleteRecord = (id: string) => {
    if (confirm('Permanently delete this clinical record from local storage?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const isConfigured = isValidWebAppUrl(syncConfig.webhookUrl);

  return (
    <div className="min-h-screen flex bg-[#fbfcfd]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/50">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg tracking-tight">MedScan Pro</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-6">
          <button className="flex items-center gap-3 px-4 py-3 text-white bg-slate-800/50 rounded-2xl w-full text-left transition-all">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm">Main Terminal</span>
          </button>
          
          <button className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-2xl transition-all w-full text-left group">
            <Database className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
            <span className="font-semibold text-sm">Local Archives</span>
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl transition-all text-left group mt-4 ${
              isConfigured ? 'hover:bg-slate-800 hover:text-white' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            <Cloud className={`w-5 h-5 ${isConfigured ? 'text-slate-500 group-hover:text-blue-400' : 'text-blue-400 animate-pulse'}`} />
            <span className="font-semibold text-sm">Cloud Bridge</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/40 p-4 rounded-2xl mb-4 border border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium">{isConfigured ? 'Cloud Online' : 'Cloud Offline'}</span>
            </div>
          </div>
          <button className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-colors group">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Operations Master</h1>
            <p className="text-xs text-slate-500 font-medium">Session Active • Department: Surgical Records</p>
          </div>
          
          <div className="flex items-center gap-6">
            {!isConfigured && (
              <button 
                onClick={() => setShowSettings(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100 hover:bg-orange-100 transition-all"
              >
                <AlertCircle className="w-4 h-4" />
                Configure Sheet Integration
              </button>
            )}
            <div className="flex items-center gap-4">
              <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">Chief Admin</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Hub</p>
                </div>
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=administrator" 
                  alt="Admin" 
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 shadow-sm"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          <StatsCards records={records} />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-4 space-y-6 sticky top-28">
              <Scanner onDataExtracted={handleDataExtracted} />
              
              {isConfigured ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-start gap-4">
                  <div className="bg-emerald-500 p-2 rounded-xl text-white">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">Cloud Integration Active</h3>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      All new scans are being appended to your Google Sheet automatically. Your data is secure in the cloud.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="font-bold text-xl mb-3">Sync to Master Sheet</h3>
                    <p className="text-blue-100 text-sm mb-6 leading-relaxed">Connect your hospital spreadsheet to automate data logging and patient management.</p>
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="bg-white text-blue-600 px-6 py-3 rounded-2xl text-sm font-bold shadow-xl hover:bg-blue-50 transition-all active:scale-95"
                    >
                      Setup Integration
                    </button>
                  </div>
                  <Cloud className="absolute -right-12 -bottom-12 w-64 h-64 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                </div>
              )}
            </div>

            <div className="xl:col-span-8">
              <RecordTable 
                records={records} 
                onDelete={deleteRecord} 
                onExportJSON={() => downloadAsJSON(records)}
                onExportCSV={() => downloadAsCSV(records)}
                onSync={handleSync}
                isSyncing={isSyncing}
              />
            </div>
          </div>
        </div>
      </main>

      {showSettings && (
        <SyncSettings 
          config={syncConfig}
          onSave={(conf) => {
            setSyncConfig(conf);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;
