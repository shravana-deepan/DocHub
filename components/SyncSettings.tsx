
import React, { useState, useEffect } from 'react';
import { SyncConfig, PatientRecord, SourceType } from '../types';
import { X, Copy, Check, Info, AlertTriangle, ExternalLink, Send, Loader2 } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, isValidWebAppUrl, syncToGoogleSheets } from '../services/syncService';

interface SyncSettingsProps {
  config: SyncConfig;
  onSave: (config: SyncConfig) => void;
  onClose: () => void;
}

const SyncSettings: React.FC<SyncSettingsProps> = ({ config, onSave, onClose }) => {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (webhookUrl && !isValidWebAppUrl(webhookUrl)) {
      if (webhookUrl.includes('docs.google.com/spreadsheets')) {
        setUrlError("Error: You pasted the Spreadsheet URL. You must paste the 'Web App URL' from the Deployment window.");
      } else {
        setUrlError("Invalid format. URL should end in '/exec'");
      }
    } else {
      setUrlError(null);
    }
  }, [webhookUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    if (!isValidWebAppUrl(webhookUrl)) return;
    setTestStatus('testing');
    
    // Fix: Added missing 'uhid' field and corrected 'source_type' to match 'PatientRecord' interface
    const dummyRecord: PatientRecord = {
      id: "test-" + Date.now(),
      patient_name: "TEST CONNECTION",
      identifier_id: "SYNC-TEST-001",
      uhid: "N/A",
      attending_doctor: "SYSTEM",
      clinical_notes: "This is a test row to verify Google Sheets connection.",
      source_type: SourceType.UNKNOWN,
      timestamp: new Date().toISOString()
    };

    const success = await syncToGoogleSheets(webhookUrl, [dummyRecord]);
    setTestStatus(success ? 'success' : 'error');
    if (success) setTimeout(() => setTestStatus('idle'), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cloud Integration</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Google Sheets Sync Engine</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-700">
                Deployment Web App URL
              </label>
              {webhookUrl && !urlError && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Valid Format</span>
              )}
            </div>
            
            <div className="relative">
              <input 
                type="url" 
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`w-full px-4 py-3.5 border rounded-2xl focus:ring-4 text-sm transition-all ${
                  urlError 
                    ? 'border-red-300 bg-red-50 focus:ring-red-100' 
                    : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'
                }`}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              {isValidWebAppUrl(webhookUrl) && (
                <button 
                  onClick={handleTest}
                  disabled={testStatus === 'testing'}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 disabled:bg-slate-300 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {testStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {testStatus === 'success' ? 'Row Added!' : 'Test Sync'}
                </button>
              )}
            </div>
            
            {urlError ? (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{urlError}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 ml-1">
                <Info className="w-3.5 h-3.5" />
                New data will always append to the next empty row.
              </p>
            )}
          </section>

          <section className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="autoSync"
                className="sr-only peer"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
            <div>
              <label htmlFor="autoSync" className="text-sm font-bold text-slate-800 block">
                Enable Automatic Sync
              </label>
              <p className="text-xs text-slate-500">Records upload immediately after a successful scan.</p>
            </div>
          </section>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-500" />
              Setup Guide (Follow exactly)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase">Phase 1: Scripting</div>
                <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl space-y-2">
                  <p>1. Open your Google Sheet.</p>
                  <p>2. Go to <b>Extensions > Apps Script</b>.</p>
                  <p>3. Delete existing code and paste this snippet:</p>
                  <button 
                    onClick={handleCopy}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-mono text-[10px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied to Clipboard' : 'Copy Automation Script'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-black text-slate-400 uppercase">Phase 2: Deployment</div>
                <div className="text-xs text-slate-600 bg-blue-50/30 border border-blue-100 p-4 rounded-xl space-y-2">
                  <p>1. Click <b>Deploy > New Deployment</b>.</p>
                  <p>2. Choose <b>Web App</b> type.</p>
                  <p>3. Execute as: <b>Me</b>.</p>
                  <p>4. Access: <b>Anyone</b> (crucial!).</p>
                  <p className="text-blue-700 font-bold">5. Copy the "Web App URL" into the box above.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button 
            disabled={!!urlError && webhookUrl !== ""}
            onClick={() => onSave({ webhookUrl, autoSync })}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-200 transition-all transform active:scale-[0.98]"
          >
            Update Configuration
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;
