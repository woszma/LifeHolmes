// 會話管理相關常數
const SESSION_SHEET_NAME = "GAME SESSIONS";
const SPREADSHEET_ID = "1wSHfUlpzsWBVl0A9yn5AA-lgkcpy3Qmamh0DkZoKKac";

// 在現有的 doGet 函式中新增會話相關 action
function doGet(e) {
  try {
    console.log('doGet 開始執行，參數:', e.parameter);
    const action = e.parameter.action;
    console.log('action:', action);
    
    // 現有的 action
    if (action === 'list') {
      console.log('執行 list action');
      return handleGetIds();
    } else if (action === 'load') {
      console.log('執行 load action');
      const presetId = e.parameter.preset_id;
      console.log('從參數中獲取的 preset_id:', presetId);
      return handleLoad(presetId);
    }
    // 新增的會話相關 action
    else if (action === 'createSession') {
      return handleCreateSession(e.parameter.createdBy, e.parameter.adminPassword);
    } else if (action === 'getSessionData') {
      return handleGetSessionData(e.parameter.sessionId);
    } else if (action === 'updateSessionData') {
      return handleUpdateSessionData(e.parameter.sessionId, e.parameter.gameData);
    } else if (action === 'listActiveSessions') {
      return handleListActiveSessions();
    } else if (action === 'endSession') {
      return handleEndSession(e.parameter.sessionId);
    } else if (action === 'setAdmin') {
      return handleSetAdmin(e.parameter.sessionId, e.parameter.clientId, e.parameter.password);
    } else {
      console.log('無效的 action:', action);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '無效的動作'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('doGet 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 處理 POST 請求
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'save') {
      return handleSave(e.parameter.presetId, e.parameter.data);
    } else if (action === 'updateSessionData') {
      return handleUpdateSessionData(e.parameter.sessionId, e.parameter.gameData);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '無效的動作'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('doPost 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 創建新會話
function handleCreateSession(createdBy, adminPassword) {
  try {
    console.log('handleCreateSession 開始執行，參數:', { createdBy, adminPassword });
    
    if (!createdBy) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少創建者資訊'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const currentTime = new Date().toISOString();
    
    // 載入預設事件卡
    const defaultCards = [
      { id: 'card_1', name: '努力工作', multiplier: 1.1, cost: 0, description: '努力工作提升戰鬥力' },
      { id: 'card_2', name: '投資理財', multiplier: 1.2, cost: 1000, description: '投資理財獲得更高回報' },
      { id: 'card_3', name: '學習進修', multiplier: 1.15, cost: 500, description: '學習新技能提升能力' }
    ];
    
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
        allCards: defaultCards,
        customTabs: []
      }),
      status: 'active',
      adminId: '',
      adminPassword: adminPassword || 'admin1234'
    };
    
    console.log('準備寫入的 sessionData:', sessionData);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      // 如果工作表不存在，創建它
      sheet = spreadsheet.insertSheet(SESSION_SHEET_NAME);
      sheet.getRange('A1:H1').setValues([
        ['SESSION_ID', 'CREATED_TIME', 'LAST_UPDATE', 'CREATED_BY', 'GAME_DATA', 'STATUS', 'ADMIN_ID', 'ADMIN_PASSWORD']
      ]);
    }
    
    // 新增會話資料
    sheet.appendRow([
      sessionData.sessionId,
      sessionData.createdTime,
      sessionData.lastUpdate,
      sessionData.createdBy,
      sessionData.gameData,
      sessionData.status,
      sessionData.adminId,
      sessionData.adminPassword
    ]);
    
    console.log('會話建立成功，sessionId:', sessionId);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      sessionId: sessionId,
      message: '會話創建成功',
      adminPassword: sessionData.adminPassword
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('handleCreateSession 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '創建會話失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取會話資料
function handleGetSessionData(sessionId) {
  try {
    if (!sessionId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少會話 ID'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到會話資料表'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const gameDataCol = headerRow.indexOf('GAME_DATA');
    const statusCol = headerRow.indexOf('STATUS');
    const adminIdCol = headerRow.indexOf('ADMIN_ID');
    
    if (sessionIdCol === -1 || gameDataCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '會話資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[sessionIdCol] === sessionId && row[statusCol] === 'active') {
        const gameData = JSON.parse(row[gameDataCol] || '{}');
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          gameData: gameData,
          lastUpdate: row[headerRow.indexOf('LAST_UPDATE')],
          adminId: row[adminIdCol] || ''
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '找不到指定的會話或會話已結束'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('handleGetSessionData 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '獲取會話資料失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 更新會話資料
function handleUpdateSessionData(sessionId, gameData) {
  try {
    if (!sessionId || !gameData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少必要參數'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到會話資料表'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const gameDataCol = headerRow.indexOf('GAME_DATA');
    const lastUpdateCol = headerRow.indexOf('LAST_UPDATE');
    const adminPasswordCol = headerRow.indexOf('ADMIN_PASSWORD');
    
    // log headerRow, adminPasswordCol
    Logger.log('headerRow: %s', headerRow);
    Logger.log('adminPasswordCol: %s', adminPasswordCol);
    
    if (sessionIdCol === -1 || gameDataCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '會話資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    let found = false;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[sessionIdCol] === sessionId) {
        // 更新會話資料
        sheet.getRange(i + 1, gameDataCol + 1).setValue(gameData);
        sheet.getRange(i + 1, lastUpdateCol + 1).setValue(new Date().toISOString());
        
        // 檢查遊戲數據中是否有 adminPassword，如果有則更新
        try {
          const parsedGameData = JSON.parse(gameData);
          Logger.log('parsedGameData.adminPassword: %s', parsedGameData.adminPassword);
          if (parsedGameData.adminPassword && adminPasswordCol !== -1) {
            sheet.getRange(i + 1, adminPasswordCol + 1).setValue(parsedGameData.adminPassword);
            Logger.log('已更新 ADMIN_PASSWORD 為: %s', parsedGameData.adminPassword);
          }
        } catch (e) {
          Logger.log('解析遊戲數據失敗: %s', e);
        }
        
        found = true;
        break;
      }
    }
    
    if (!found) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到指定的會話'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '會話資料更新成功'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('handleUpdateSessionData 錯誤: %s', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '更新會話資料失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 列出活躍會話
function handleListActiveSessions() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        sessions: []
      })).setMimeType(ContentService.MimeType.JSON);
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
      })).setMimeType(ContentService.MimeType.JSON);
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
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('handleListActiveSessions 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '獲取會話列表失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 結束會話
function handleEndSession(sessionId) {
  try {
    if (!sessionId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少會話 ID'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到會話資料表'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const statusCol = headerRow.indexOf('STATUS');
    
    if (sessionIdCol === -1 || statusCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '會話資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON);
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
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '會話已結束'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('handleEndSession 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '結束會話失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
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
  const createResult = handleCreateSession(testCreatedBy);
  console.log('創建會話結果:', createResult.getContent());
  
  // 測試獲取會話列表
  const listResult = handleListActiveSessions();
  console.log('會話列表結果:', listResult.getContent());
}

// 獲取所有設定檔 ID
function handleGetIds() {
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
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        presets: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const presets = data.slice(1).map(row => row[0]).filter(id => id && id.trim() !== '');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      presets: presets
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('handleGetIds 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '無法讀取設定檔列表: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 載入設定檔
function handleLoad(presetId) {
  try {
    console.log('handleLoad 開始執行，presetId:', presetId);
    
    if (!presetId) {
      console.log('presetId 為空或未定義');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少設定檔 ID'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('正在開啟試算表...');
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('PRESETS');
    
    if (!sheet) {
      console.log('找不到 PRESETS 工作表');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到資料表'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('正在讀取工作表資料...');
    const data = sheet.getDataRange().getValues();
    console.log('工作表資料行數:', data.length);
    
    const headerRow = data[0];
    console.log('標題行:', headerRow);
    
    const presetIdCol = headerRow.indexOf('PRESET_ID');
    const presetDataCol = headerRow.indexOf('PRESET_DATA');
    
    console.log('PRESET_ID 欄位索引:', presetIdCol);
    console.log('PRESET_DATA 欄位索引:', presetDataCol);
    
    if (presetIdCol === -1 || presetDataCol === -1) {
      console.log('找不到必要的欄位');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('正在搜尋 presetId:', presetId);
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log('檢查第', i, '行，presetId:', row[presetIdCol]);
      if (row[presetIdCol] === presetId) {
        console.log('找到匹配的設定檔');
        const presetData = JSON.parse(row[presetDataCol] || '{}');
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          data: presetData
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log('未找到指定的設定檔');
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '找不到指定的設定檔'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('handleLoad 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '載入失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 儲存設定檔
function handleSave(presetId, presetData) {
  try {
    if (!presetId || !presetData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少必要參數'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('PRESETS');
    
    if (!sheet) {
      // 如果工作表不存在，創建它
      sheet = spreadsheet.insertSheet('PRESETS');
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
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('handleSave 錯誤:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '儲存失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 設置/搶佔管理者
function handleSetAdmin(sessionId, clientId, password) {
  try {
    if (!sessionId || !clientId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少必要參數'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SESSION_SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到會話資料表'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const sessionIdCol = headerRow.indexOf('SESSION_ID');
    const adminIdCol = headerRow.indexOf('ADMIN_ID');
    const adminPasswordCol = headerRow.indexOf('ADMIN_PASSWORD');
    if (sessionIdCol === -1 || adminIdCol === -1 || adminPasswordCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    let found = false;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[sessionIdCol] === sessionId) {
        const currentPassword = row[adminPasswordCol];
        
        // 如果密碼欄位為空，允許設置初始密碼
        if (!currentPassword || currentPassword === '') {
          if (password) {
            // 設置初始密碼
            sheet.getRange(i + 1, adminPasswordCol + 1).setValue(password);
          }
        } else {
          // 如果已有密碼，需要驗證
          if (!password || password !== currentPassword) {
            return ContentService.createTextOutput(JSON.stringify({
              status: 'error',
              message: '密碼錯誤'
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
        
        // 設置新的 adminId
        sheet.getRange(i + 1, adminIdCol + 1).setValue(clientId);
        found = true;
        break;
      }
    }
    if (!found) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到指定的會話'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: '管理者設置成功'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '設置管理者失敗: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}