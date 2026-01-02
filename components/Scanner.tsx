
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, CheckCircle2, AlertCircle, Activity, Plus, Image as ImageIcon } from 'lucide-react';
import { processMedicalImage } from '../services/geminiService';
import { OCRResult } from '../types';

interface QueuedImage {
  id: string;
  data: string;
  mimeType: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface ScannerProps {
  onDataExtracted: (data: OCRResult) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onDataExtracted }) => {
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: Explicitly cast files to File[] to ensure the 'file' object in forEach has the correct properties
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: QueuedImage = {
          id: crypto.randomUUID(),
          data: reader.result as string,
          mimeType: file.type,
          status: 'pending'
        };
        setQueue(prev => [...prev, newImage]);
        setError(null);
      };
      // Fix: file is now correctly typed as File, which satisfies the Blob parameter requirement
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(img => img.id !== id));
  };

  const startBatchProcessing = async () => {
    if (queue.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    const updatedQueue = [...queue];
    
    for (let i = 0; i < updatedQueue.length; i++) {
      const current = updatedQueue[i];
      if (current.status === 'completed') continue;

      try {
        setQueue(prev => prev.map(img => 
          img.id === current.id ? { ...img, status: 'processing' } : img
        ));

        const result = await processMedicalImage(current.data, current.mimeType);
        onDataExtracted(result);

        setQueue(prev => prev.map(img => 
          img.id === current.id ? { ...img, status: 'completed' } : img
        ));
      } catch (err: any) {
        setQueue(prev => prev.map(img => 
          img.id === current.id ? { ...img, status: 'error' } : img
        ));
        setError(`Failed processing some images. Check the queue.`);
      }
    }

    setIsProcessing(false);
    // Auto-clear completed images after a delay
    setTimeout(() => {
      setQueue(prev => prev.filter(img => img.status !== 'completed'));
    }, 2000);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Batch Document Scan</h2>
          <p className="text-xs text-slate-500 font-medium">Extracting Names, UHID (pattern AB12...), and IDs from labels & boards.</p>
        </div>
        {queue.length > 0 && !isProcessing && (
          <button 
            onClick={() => setQueue([])}
            className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear Queue
          </button>
        )}
      </div>

      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all group ${
          isProcessing ? 'border-slate-100 cursor-not-allowed' : 'border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30'
        }`}
      >
        <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
          <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
        </div>
        <p className="text-slate-600 font-bold text-sm">Add Multiple Documents</p>
        <p className="text-slate-400 text-[10px] mt-1">Select one or more photos from your device</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple
          className="hidden" 
        />
      </div>

      {queue.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Upload Queue ({queue.length})
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {queue.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                <img src={img.data} className="w-full h-full object-cover" alt="Preview" />
                
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                  img.status === 'processing' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {img.status === 'pending' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFromQueue(img.id); }}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {img.status === 'processing' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
                  {img.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                  {img.status === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={startBatchProcessing}
            disabled={isProcessing || !queue.some(i => i.status === 'pending')}
            className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:bg-slate-200 transition-all shadow-xl active:scale-95"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing Batch...</>
            ) : (
              <><Activity className="w-5 h-5" /> Start Extraction</>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs uppercase tracking-tight">System Alert</p>
            <p className="text-[11px] leading-relaxed opacity-80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
