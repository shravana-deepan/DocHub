
import React, { useState } from 'react';
import { PatientRecord, SourceType } from '../types';
import { FileJson, FileSpreadsheet, Trash2, Search, Filter } from 'lucide-react';

interface RecordTableProps {
  records: PatientRecord[];
  onDelete: (id: string) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

const RecordTable: React.FC<RecordTableProps> = ({ records, onDelete, onExportJSON, onExportCSV }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<SourceType | 'all'>('all');

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.identifier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.attending_doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = typeFilter === 'all' || r.source_type === typeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Extracted Records</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patients, doctors..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="all">All Sources</option>
            <option value={SourceType.LABEL}>Labels</option>
            <option value={SourceType.WHITEBOARD}>Whiteboards</option>
          </select>

          <button 
            onClick={onExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          
          <button 
            onClick={onExportJSON}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <FileJson className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Patient Info</th>
              <th className="px-6 py-4">Identifiers</th>
              <th className="px-6 py-4">Clinician</th>
              <th className="px-6 py-4">Notes / Surgery</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{record.patient_name || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                    {record.identifier_id || '---'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {record.attending_doctor || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                    {record.clinical_notes || 'No notes'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      record.source_type === SourceType.LABEL 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {record.source_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(record.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                  No records found matching your criteria.
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
