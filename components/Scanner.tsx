
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { processMedicalImage } from '../services/geminiService';
import { OCRResult } from '../types';

interface ScannerProps {
  onDataExtracted: (data: OCRResult) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onDataExtracted }) => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startProcessing = async () => {
    if (!image) return;
    setProcessing(true);
    setError(null);
    try {
      const mimeType = image.split(';')[0].split(':')[1];
      const result = await processMedicalImage(image, mimeType);
      onDataExtracted(result);
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">New Document Scan</h2>
          <p className="text-sm text-slate-500">Upload medical labels or whiteboard photos for automatic data extraction.</p>
        </div>
      </div>

      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
        >
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
          </div>
          <p className="text-slate-600 font-medium">Click to upload or drag and drop</p>
          <p className="text-slate-400 text-xs mt-1">Supports JPEG, PNG (Max 5MB)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
          <img src={image} alt="Preview" className="w-full h-auto max-h-[400px] object-contain mx-auto" />
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={clearImage}
              className="bg-white/90 hover:bg-white p-2 rounded-full text-slate-600 shadow-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center">
            {processing ? (
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">Analyzing document with Gemini AI...</p>
              </div>
            ) : (
              <button 
                onClick={startProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-xl flex items-center gap-2 transition-all transform hover:scale-105"
              >
                {/* Fix: Added missing Activity icon from lucide-react */}
                <Activity className="w-5 h-5" />
                Process Record
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Processing Error</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
