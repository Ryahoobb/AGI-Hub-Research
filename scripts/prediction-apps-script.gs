/**
 * AGI Hub Prediction Form - Apps Script Backend
 *
 * デプロイ手順:
 * 1. script.google.com で新規プロジェクト作成
 * 2. このコードを貼り付け
 * 3. 新しいGoogle Sheetを作成し、SHEET_IDを下記に設定
 * 4. デプロイ → 新しいデプロイ → 種類: ウェブアプリ
 *    - 実行するユーザー: 自分
 *    - アクセスできるユーザー: 全員（匿名含む）
 * 5. デプロイ後のWeb App URLを prediction.html の GAS_URL に設定
 */

const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // 要置換
const SHEET_NAME = 'responses';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // Validation
    const requiredFields = ['q1_agi_2030_pct', 'q2_agi_year', 'q3_job_change_pct', 'q4_compute_only_pct', 'q5_pdoom_pct', 'session_id', 'timestamp'];
    for (let i = 0; i < requiredFields.length; i++) {
      if (payload[requiredFields[i]] === undefined) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', reason: 'missing_field' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Range validation
    const pctFields = ['q1_agi_2030_pct', 'q3_job_change_pct', 'q4_compute_only_pct', 'q5_pdoom_pct'];
    for (let i = 0; i < pctFields.length; i++) {
      const v = Number(payload[pctFields[i]]);
      if (isNaN(v) || v < 0 || v > 100) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', reason: 'invalid_range' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    const year = Number(payload.q2_agi_year);
    if (isNaN(year) || year < 2026 || year > 2100) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', reason: 'invalid_year' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append to sheet
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['received_at', 'session_id', 'client_timestamp', 'q1_agi_2030_pct', 'q2_agi_year', 'q3_job_change_pct', 'q4_compute_only_pct', 'q5_pdoom_pct']);
    }

    sheet.appendRow([
      new Date().toISOString(),
      payload.session_id,
      payload.timestamp,
      payload.q1_agi_2030_pct,
      payload.q2_agi_year,
      payload.q3_job_change_pct,
      payload.q4_compute_only_pct,
      payload.q5_pdoom_pct
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', reason: 'exception', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', service: 'agi-hub-prediction' }))
    .setMimeType(ContentService.MimeType.JSON);
}
