const SPREADSHEET_ID = "1wSHfUlpzsWBVl0A9yn5AA-lgkcpy3Qmamh0DkZoKKac";
const SHEET_NAME = "PRESET DATA";

// 主要處理函式 - 處理所有 HTTP 請求
function doGet(e) {
  try {
    // 設定 CORS 標頭
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    const action = e.parameter.action;
    
    if (action === 'getIds') {
      return handleGetIds(headers);
    } else if (action === 'load') {
      return handleLoad(e.parameter.preset_id, headers);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '無效的動作'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
  } catch (error) {
    console.error('doGet 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
  }
}

function doPost(e) {
  try {
    // 設定 CORS 標頭
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    const data = JSON.parse(e.postData.contents);
    const presetId = data.preset_id;
    const presetData = data.preset_data;
    
    if (!presetId || !presetData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少必要參數'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    return handleSave(presetId, presetData, headers);
  } catch (error) {
    console.error('doPost 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
  }
}

// 處理 OPTIONS 請求（CORS 預檢）
function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}

// 獲取所有設定檔 ID
function handleGetIds(headers) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      // 如果工作表不存在，創建它
      const newSheet = spreadsheet.insertSheet(SHEET_NAME);
      newSheet.getRange('A1:B1').setValues([['PRESET_ID', 'PRESET_DATA']]);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        ids: []
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        ids: []
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const ids = data.slice(1).map(row => row[0]).filter(id => id && id.trim() !== '');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      ids: ids
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  } catch (error) {
    console.error('handleGetIds 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '無法讀取設定檔列表: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 載入設定檔
function handleLoad(presetId, headers) {
  try {
    if (!presetId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少設定檔 ID'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到資料表'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const presetIdCol = headerRow.indexOf('PRESET_ID');
    const presetDataCol = headerRow.indexOf('PRESET_DATA');
    
    if (presetIdCol === -1 || presetDataCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[presetIdCol] === presetId) {
        const presetData = JSON.parse(row[presetDataCol] || '{}');
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          allCards: presetData.allCards || []
        })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '找不到指定的設定檔'
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  } catch (error) {
    console.error('handleLoad 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '載入失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 儲存設定檔
function handleSave(presetId, presetData, headers) {
  try {
    if (!presetId || !presetData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少必要參數'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      // 如果工作表不存在，創建它
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.getRange('A1:B1').setValues([['PRESET_ID', 'PRESET_DATA']]);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const presetIdCol = headerRow.indexOf('PRESET_ID');
    const presetDataCol = headerRow.indexOf('PRESET_DATA');
    
    if (presetIdCol === -1 || presetDataCol === -1) {
      // 如果標題行不正確，重新設定
      sheet.clear();
      sheet.getRange('A1:B1').setValues([['PRESET_ID', 'PRESET_DATA']]);
    }
    
    // 檢查是否已存在相同的 ID
    let existingRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === presetId) {
        existingRow = i + 1; // 轉換為 1-based 索引
        break;
      }
    }
    
    const jsonData = JSON.stringify(presetData);
    
    if (existingRow > 0) {
      // 更新現有行
      sheet.getRange(existingRow, 1).setValue(presetId);
      sheet.getRange(existingRow, 2).setValue(jsonData);
    } else {
      // 新增新行
      sheet.appendRow([presetId, jsonData]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '儲存成功'
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  } catch (error) {
    console.error('handleSave 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '儲存失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 測試函式 - 可以在 Google Apps Script 編輯器中執行
function testConnection() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('成功連接到試算表:', spreadsheet.getName());
    
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.getRange('A1:B1').setValues([['PRESET_ID', 'PRESET_DATA']]);
      console.log('已創建新的工作表:', SHEET_NAME);
    } else {
      console.log('找到現有工作表:', SHEET_NAME);
    }
    
    return '測試成功！';
  } catch (error) {
    console.error('測試失敗:', error);
    return '測試失敗: ' + error.toString();
  }
} 