
import React, { useState } from 'react';
import { PatientRecord, SourceType } from '../types';
import { FileJson, FileSpreadsheet, Trash2, Search, Cloud, CloudOff, CheckCircle2, Loader2, User } from 'lucide-react';

interface RecordTableProps {
  records: PatientRecord[];
  onDelete: (id: string) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onSync: (recordIds: string[]) => Promise<void>;
  isSyncing: boolean;
}

const RecordTable: React.FC<RecordTableProps> = ({ records, onDelete, onExportJSON, onExportCSV, onSync, isSyncing }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    return (
      r.patient_name.toLowerCase().includes(searchLower) ||
      r.identifier_id.toLowerCase().includes(searchLower) ||
      r.uhid.toLowerCase().includes(searchLower) ||
      r.attending_doctor.toLowerCase().includes(searchLower)
    );
  });

  const unsyncedCount = records.filter(r => !r.synced).length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Master Record Log</h2>
          <div className="flex items-center gap-2 mt-1">
            {unsyncedCount > 0 ? (
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest flex items-center gap-1">
                <CloudOff className="w-3 h-3" />
                {unsyncedCount} Records Local-Only
              </p>
            ) : (
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                All Records Cloud-Synced
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name, UHID, Doctor..." 
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none w-full md:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => onSync(records.filter(r => !r.synced).map(r => r.id))}
            disabled={isSyncing || unsyncedCount === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              unsyncedCount > 0 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
            Sync All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Patient / UHID</th>
              <th className="px-6 py-4">ID / IP No.</th>
              <th className="px-6 py-4">Clinician</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    {record.synced ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 mt-1 uppercase">Cloud</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center opacity-40">
                        <CloudOff className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] font-black text-slate-500 mt-1 uppercase">Local</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{record.patient_name || 'N/A'}</div>
                        <div className="text-[11px] font-mono text-blue-600 font-bold tracking-tight">
                          {record.uhid || 'UHID Missing'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                    {record.identifier_id || '---'}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    <div className="font-semibold text-slate-800">{record.attending_doctor}</div>
                    <div className="text-[10px] text-slate-400">{record.clinical_notes}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      record.source_type === SourceType.LABEL 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : 'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {record.source_type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => onDelete(record.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic text-sm">
                  No records found. Upload a label or board photo to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordTable;
