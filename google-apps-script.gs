const SHEET_ID = "1wSHfUlpzsWBVl0A9yn5AA-lgkcpy3Qmamh0DkZoKKac";
const SHEET_NAME = "PRESET DATA"; // 預設是第一個工作表，你可以自己改名

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'load') {
    return loadPreset(e.parameter.presetId);
  } else if (action === 'list') {
    return listPresets();
  }
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
  if (headers[0] !== 'preset_id' || headers[1] !== 'preset_data') {
    sheet.getRange(1, 1, 1, 2).setValues([['preset_id', 'preset_data']]);
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
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No presets found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var presets = sheet.getDataRange().getValues();
  for (var i = 1; i < presets.length; i++) {
    if (presets[i][0] === presetId) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: JSON.parse(presets[i][1]) }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
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