// 會話管理相關常數
const SESSION_SHEET_NAME = "GAME SESSIONS";
const SPREADSHEET_ID = "1wSHfUlpzsWBVl0A9yn5AA-lgkcpy3Qmamh0DkZoKKac";

// 在現有的 doGet 函式中新增會話相關 action
function doGet(e) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    const action = e.parameter.action;
    
    // 現有的 action
    if (action === 'list') {
      return handleGetIds(headers);
    } else if (action === 'load') {
      return handleLoad(e.parameter.preset_id, headers);
    }
    // 新增的會話相關 action
    else if (action === 'createSession') {
      return handleCreateSession(e.parameter.createdBy, headers);
    } else if (action === 'getSessionData') {
      return handleGetSessionData(e.parameter.sessionId, headers);
    } else if (action === 'updateSessionData') {
      return handleUpdateSessionData(e.parameter.sessionId, e.parameter.gameData, headers);
    } else if (action === 'listActiveSessions') {
      return handleListActiveSessions(headers);
    } else if (action === 'endSession') {
      return handleEndSession(e.parameter.sessionId, headers);
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

// 創建新會話
function handleCreateSession(createdBy, headers) {
  try {
    const sessionId = generateSessionId();
    const currentTime = new Date().toISOString();
    
    const sessionData = {
      sessionId: sessionId,
      createdTime: currentTime,
      lastUpdate: currentTime,
      createdBy: createdBy || 'Unknown',
      gameData: JSON.stringify({
        players: [],
        history: [],
        currentRound: 0,
        gameOver: false,
        roundHistory: [],
        allCards: [],
        customTabs: []
      }),
      status: 'active'
    };
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      // 如果工作表不存在，創建它
      sheet = spreadsheet.insertSheet(SESSION_SHEET_NAME);
      sheet.getRange('A1:F1').setValues([['SESSION_ID', 'CREATED_TIME', 'LAST_UPDATE', 'CREATED_BY', 'GAME_DATA', 'STATUS']]);
    }
    
    // 新增會話資料
    sheet.appendRow([
      sessionData.sessionId,
      sessionData.createdTime,
      sessionData.lastUpdate,
      sessionData.createdBy,
      sessionData.gameData,
      sessionData.status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      sessionId: sessionId,
      message: '會話創建成功'
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    
  } catch (error) {
    console.error('handleCreateSession 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '創建會話失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 獲取會話資料
function handleGetSessionData(sessionId, headers) {
  try {
    if (!sessionId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少會話 ID'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到會話資料表'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const gameDataCol = headerRow.indexOf('GAME_DATA');
    const statusCol = headerRow.indexOf('STATUS');
    
    if (sessionIdCol === -1 || gameDataCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '會話資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[sessionIdCol] === sessionId && row[statusCol] === 'active') {
        const gameData = JSON.parse(row[gameDataCol] || '{}');
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          gameData: gameData,
          lastUpdate: row[headerRow.indexOf('LAST_UPDATE')]
        })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '找不到指定的會話或會話已結束'
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    
  } catch (error) {
    console.error('handleGetSessionData 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '獲取會話資料失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 更新會話資料
function handleUpdateSessionData(sessionId, gameData, headers) {
  try {
    if (!sessionId || !gameData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少必要參數'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到會話資料表'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const gameDataCol = headerRow.indexOf('GAME_DATA');
    const lastUpdateCol = headerRow.indexOf('LAST_UPDATE');
    
    if (sessionIdCol === -1 || gameDataCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '會話資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    let found = false;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[sessionIdCol] === sessionId) {
        // 更新會話資料
        sheet.getRange(i + 1, gameDataCol + 1).setValue(gameData);
        sheet.getRange(i + 1, lastUpdateCol + 1).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
    
    if (!found) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到指定的會話'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '會話資料更新成功'
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    
  } catch (error) {
    console.error('handleUpdateSessionData 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '更新會話資料失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 列出活躍會話
function handleListActiveSessions(headers) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        sessions: []
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const createdTimeCol = headerRow.indexOf('CREATED_TIME');
    const createdByCol = headerRow.indexOf('CREATED_BY');
    const statusCol = headerRow.indexOf('STATUS');
    
    if (sessionIdCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '會話資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const activeSessions = data.slice(1)
      .filter(row => row[statusCol] === 'active')
      .map(row => ({
        sessionId: row[sessionIdCol],
        createdTime: row[createdTimeCol],
        createdBy: row[createdByCol]
      }));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      sessions: activeSessions
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    
  } catch (error) {
    console.error('handleListActiveSessions 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '獲取會話列表失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 結束會話
function handleEndSession(sessionId, headers) {
  try {
    if (!sessionId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少會話 ID'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到會話資料表'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const statusCol = headerRow.indexOf('STATUS');
    
    if (sessionIdCol === -1 || statusCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '會話資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    let found = false;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[sessionIdCol] === sessionId) {
        sheet.getRange(i + 1, statusCol + 1).setValue('inactive');
        found = true;
        break;
      }
    }
    
    if (!found) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到指定的會話'
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '會話已結束'
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    
  } catch (error) {
    console.error('handleEndSession 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '結束會話失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
  }
}

// 生成會話 ID
function generateSessionId() {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}_${randomStr}`;
}

// 測試函式
function testSessionFunctions() {
  console.log('測試會話功能...');
  
  // 測試創建會話
  const testCreatedBy = 'TestMC';
  const createResult = handleCreateSession(testCreatedBy, {});
  console.log('創建會話結果:', createResult);
  
  // 測試獲取會話列表
  const listResult = handleListActiveSessions({});
  console.log('會話列表結果:', listResult);
}

// 獲取所有設定檔 ID
function handleGetIds(headers) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('PRESETS');
    
    if (!sheet) {
      // 如果工作表不存在，創建它
      const newSheet = spreadsheet.insertSheet('PRESETS');
      newSheet.getRange('A1:B1').setValues([['PRESET_ID', 'PRESET_DATA']]);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        presets: []
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        presets: []
      })).setMimeType(ContentService.MimeType.JSON).setHeaders(headers);
    }
    
    const presets = data.slice(1).map(row => row[0]).filter(id => id && id.trim() !== '');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      presets: presets
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
    const sheet = spreadsheet.getSheetByName('PRESETS');
    
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
          data: presetData
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