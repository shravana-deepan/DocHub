
export enum SourceType {
  WHITEBOARD = 'whiteboard',
  LABEL = 'label',
  UNKNOWN = 'unknown'
}

export interface PatientRecord {
  id: string;
  patient_name: string;
  identifier_id: string;
  attending_doctor: string;
  clinical_notes: string;
  source_type: SourceType;
  timestamp: string;
}

export interface OCRResult {
  patient_name: string;
  identifier_id: string;
  attending_doctor: string;
  clinical_notes: string;
  source_type: SourceType;
}
