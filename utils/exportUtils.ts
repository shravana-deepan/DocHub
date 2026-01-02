
import { PatientRecord } from "../types";

export const downloadAsJSON = (records: PatientRecord[]) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `medical_records_${new Date().toISOString()}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const downloadAsCSV = (records: PatientRecord[]) => {
  if (records.length === 0) return;

  const headers = ["ID", "Patient Name", "Identifier/UHID", "Attending Doctor", "Clinical Notes", "Source Type", "Timestamp"];
  const rows = records.map(r => [
    r.id,
    `"${r.patient_name.replace(/"/g, '""')}"`,
    `"${r.identifier_id.replace(/"/g, '""')}"`,
    `"${r.attending_doctor.replace(/"/g, '""')}"`,
    `"${r.clinical_notes.replace(/"/g, '""')}"`,
    r.source_type,
    r.timestamp
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `medical_records_${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
