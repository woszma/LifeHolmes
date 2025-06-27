const SHEET_ID = "1wSHfUlpzsWBVl0A9yn5AA-lgkcpy3Qmamh0DkZoKKac";
const SHEET_NAME = "PRESETS"; // 修正為與會話管理.gs一致

function doGet(e) {
  console.log('Preset管理 doGet 開始執行，參數:', e.parameter);
  var action = e.parameter.action;
  console.log('action:', action);
  
  if (action === 'load') {
    console.log('執行 load action');
    var presetId = e.parameter.preset_id; // 修正參數名稱
    console.log('從參數中獲取的 preset_id:', presetId);
    console.log('收到 load 請求，presetId:', presetId);
    if (!presetId) {
      console.log('presetId 為空或未定義');
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: '缺少設定檔 ID' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return loadPreset(presetId);
  } else if (action === 'list') {
    console.log('執行 list action');
    return listPresets();
  }
  console.log('無效的 action:', action);
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var action = e.parameter.action;
    if (action === 'save') {
    var presetId = e.parameter.presetId;
    var data = JSON.parse(e.parameter.data);
    return savePreset(presetId, data);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function savePreset(presetId, data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  // 檢查標題列，若不存在則自動建立
  var headers = sheet.getRange(1, 1, 1, 2).getValues()[0];
  if (headers[0] !== 'PRESET_ID' || headers[1] !== 'PRESET_DATA') { // 修正為大寫
    sheet.getRange(1, 1, 1, 2).setValues([['PRESET_ID', 'PRESET_DATA']]);
  }

  var presets = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < presets.length; i++) {
    if (presets[i][0] === presetId) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(data));
        found = true;
        break;
      }
    }
    if (!found) {
    sheet.appendRow([presetId, JSON.stringify(data)]);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function loadPreset(presetId) {
  console.log('loadPreset 開始執行，presetId:', presetId);
  
  var ss = SpreadsheetApp.openById(SHEET_ID);
  console.log('正在開啟試算表...');
  
  var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
    console.log('找不到 PRESETS 工作表');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No presets found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  console.log('正在讀取工作表資料...');
  var presets = sheet.getDataRange().getValues();
  console.log('工作表資料行數:', presets.length);
  console.log('標題行:', presets[0]);
  
  for (var i = 1; i < presets.length; i++) {
    console.log('檢查第', i, '行，presetId:', presets[i][0]);
    if (presets[i][0] === presetId) {
      console.log('找到匹配的設定檔');
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: JSON.parse(presets[i][1]) }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  console.log('未找到指定的設定檔');
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Preset not found' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function listPresets() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', presets: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var presets = sheet.getDataRange().getValues();
  var ids = [];
  for (var i = 1; i < presets.length; i++) {
    ids.push(presets[i][0]);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', presets: ids }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// 測試函數：檢查工作表數據
function checkSheetData() {
  console.log('開始檢查工作表數據...');
  
  var ss = SpreadsheetApp.openById(SHEET_ID);
  
  // 檢查 PRESETS 工作表
  var presetsSheet = ss.getSheetByName('PRESETS');
  if (presetsSheet) {
    var presetsData = presetsSheet.getDataRange().getValues();
    console.log('PRESETS 工作表數據行數:', presetsData.length);
    console.log('PRESETS 工作表標題:', presetsData[0]);
    if (presetsData.length > 1) {
      console.log('PRESETS 工作表有數據行:', presetsData.slice(1).map(row => row[0]));
    }
  } else {
    console.log('PRESETS 工作表不存在');
  }
  
  // 檢查 PRESET DATA 工作表
  var presetDataSheet = ss.getSheetByName('PRESET DATA');
  if (presetDataSheet) {
    var presetDataData = presetDataSheet.getDataRange().getValues();
    console.log('PRESET DATA 工作表數據行數:', presetDataData.length);
    console.log('PRESET DATA 工作表標題:', presetDataData[0]);
    if (presetDataData.length > 1) {
      console.log('PRESET DATA 工作表有數據行:', presetDataData.slice(1).map(row => row[0]));
    }
  } else {
    console.log('PRESET DATA 工作表不存在');
  }
  
  // 列出所有工作表
  var allSheets = ss.getSheets();
  console.log('試算表中的所有工作表:');
  allSheets.forEach(function(sheet) {
    console.log('- ' + sheet.getName());
  });
}

// 檢查特定預設的原始數據
function checkPresetData(presetId) {
  console.log('檢查預設數據:', presetId);
  
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('PRESETS');
    
    if (!sheet) {
    console.log('找不到 PRESETS 工作表');
    return;
  }
  
  var presets = sheet.getDataRange().getValues();
  for (var i = 1; i < presets.length; i++) {
    if (presets[i][0] === presetId) {
      console.log('找到預設:', presetId);
      console.log('原始 JSON 字符串:', presets[i][1]);
      
      try {
        var parsedData = JSON.parse(presets[i][1]);
        console.log('解析後的數據:', parsedData);
        console.log('數據類型:', typeof parsedData);
        console.log('數據鍵:', Object.keys(parsedData));
        
        if (parsedData.events) {
          console.log('events 數量:', parsedData.events.length);
        }
        if (parsedData.tabs) {
          console.log('tabs 數量:', parsedData.tabs.length);
        }
        if (parsedData.allCards) {
          console.log('allCards 數量:', parsedData.allCards.length);
        }
        if (parsedData.customTabs) {
          console.log('customTabs 數量:', parsedData.customTabs.length);
        }
      } catch (e) {
        console.log('JSON 解析錯誤:', e);
      }
      return;
    }
  }
  
  console.log('未找到預設:', presetId);
}

// 方便Apps Script執行器直接查詢Round 2預設
function checkPresetDataTest() {
  checkPresetData("Round 2");
}