
import { PatientRecord } from "../types";

/**
 * Validates if the provided URL looks like a Google Apps Script Web App URL.
 */
export const isValidWebAppUrl = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('https://script.google.com/macros/s/') && url.endsWith('/exec');
};

export const syncToGoogleSheets = async (webhookUrl: string, records: PatientRecord[]): Promise<boolean> => {
  if (!isValidWebAppUrl(webhookUrl)) return false;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(records.map(r => ({
        timestamp: r.timestamp,
        patient_name: r.patient_name,
        uhid: r.uhid,
        identifier_id: r.identifier_id,
        attending_doctor: r.attending_doctor,
        clinical_notes: r.clinical_notes,
        source_type: r.source_type,
        record_id: r.id
      }))),
    });
    return true;
  } catch (error) {
    console.error("Sync error:", error);
    return false;
  }
};

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * MedScan OCR Sync Script - v2.1 (Supports UHID)
 * 1. Open Sheet > Extensions > Apps Script
 * 2. Paste this code and Save.
 * 3. Deploy > New Deployment > Web App
 * 4. Execute as "Me", Access: "Anyone"
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Auto-setup headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = ["Timestamp", "Patient Name", "UHID (2-Letter Pattern)", "Hospital ID / IP No.", "Doctor", "Clinical Notes", "Source", "Internal ID"];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight("bold")
           .setBackground("#4285f4")
           .setFontColor("white");
      sheet.setFrozenRows(1);
    }

    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    if (!Array.isArray(data)) data = [data];
    
    data.forEach(function(row) {
      sheet.appendRow([
        row.timestamp || new Date().toISOString(),
        row.patient_name || "N/A",
        row.uhid || "N/A",
        row.identifier_id || "N/A",
        row.attending_doctor || "N/A",
        row.clinical_notes || "",
        row.source_type || "unknown",
        row.record_id || ""
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("MedScan Service Active. Please use POST for data sync.");
}
`;
