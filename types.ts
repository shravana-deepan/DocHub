
export enum SourceType {
  WHITEBOARD = 'whiteboard',
  LABEL = 'label',
  UNKNOWN = 'unknown'
}

export interface SyncConfig {
  webhookUrl: string;
  autoSync: boolean;
}

export interface PatientRecord {
  id: string;
  patient_name: string;
  identifier_id: string;
  uhid: string;
  attending_doctor: string;
  clinical_notes: string;
  source_type: SourceType;
  timestamp: string;
  synced?: boolean;
}

export interface OCRResult {
  patient_name: string;
  identifier_id: string;
  uhid: string;
  attending_doctor: string;
  clinical_notes: string;
  source_type: SourceType;
}
