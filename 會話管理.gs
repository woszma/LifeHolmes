// 會話管理相關常數
const SESSION_SHEET_NAME = "GAME SESSIONS";
const SPREADSHEET_ID = "1wSHfUlpzsWBVl0A9yn5AA-lgkcpy3Qmamh0DkZoKKac";

// 在現有的 doGet 函式中新增會話相關 action
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // 現有的 action
    if (action === 'list') {
      return handleGetIds();
    } else if (action === 'load') {
      return handleLoad(e.parameter.preset_id);
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
    const sessionId = generateSessionId();
    const currentTime = new Date().toISOString();
    
    // 預設事件卡資料
    const defaultCards = [
      // 連續事件：教育路徑
      { id: 1, name: '名牌小學', type: 'chain', group: '小學', order: 1, prerequisite: null, cost: 500, multiplier: 1.4, condition: '父或母為專業生優先' },
      { id: 2, name: '一般小學', type: 'chain', group: '小學', order: 1, prerequisite: null, cost: 500, multiplier: 1.3 },
      { id: 3, name: '名牌中學', type: 'chain', group: '中學', order: 2, prerequisite: '小學', cost: 500, multiplier: 1.4, condition: '須小學畢業、名牌小學畢業生優先' },
      { id: 4, name: '一般中學', type: 'chain', group: '中學', order: 2, prerequisite: '小學', cost: 500, multiplier: 1.3, condition: '須小學畢業' },
      { id: 5, name: '中學文憑試', type: 'chain', group: '中學文憑試', order: 3, prerequisite: '中學', cost: 500, multiplier: 1.1, condition: '須中學畢業，於30分鐘後執行，請交考試費及領取推薦證' },
      { id: 6, name: '資助大學學士', type: 'chain', group: '大學', order: 4, prerequisite: '中學文憑試', cost: 500, multiplier: 2.0, condition: '須文憑試合格' },
      { id: 7, name: '是旦福大學學士', type: 'chain', group: '大學', order: 4, prerequisite: '中學', cost: 3000, multiplier: 2.2, condition: '須文憑試合格或「捐款」或有海外交流經驗' },
      { id: 8, name: "Half,Yellow, 惡忠怨、廢煙理工、Don't傾大學學士", type: 'chain', group: '大學', order: 4, prerequisite: '中學', cost: 2000, multiplier: 2.2, condition: '父或母有海外護照，文憑試不合格，預備班學費2000' },
      // 非連續事件
      { id: 9, name: '明愛補習社', type: 'single', group: '補習', cost: 1000, multiplier: 1.4, condition: '考試後，海關有可能會隨機抽查一人查問' },
      { id: 10, name: '明愛補習社優質內部影片流出', type: 'single', group: '補習', cost: 200, multiplier: 1.4, condition: '如發現非法下載，留案底' },
      { id: 11, name: '電腦/寬頻/手機電話', type: 'single', group: '設備', cost: 1000, multiplier: 1.4 },
      { id: 12, name: '流動數據', type: 'single', group: '設備', cost: 500, multiplier: 1.2 },
      { id: 13, name: '體育', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
      { id: 14, name: '藝術', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
      { id: 15, name: '學術', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
      { id: 16, name: '社會運動', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
      { id: 17, name: '義工服務', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
      { id: 18, name: '海外交換生計劃', type: 'single', group: '海外交換', cost: 2000, multiplier: 2.0, quota: 2, selectedPlayers: [] },
      { id: 19, name: '擂台賽（男）', type: 'single', group: '機會', cost: 0, multiplier: 1.1, quota: 1, selectedPlayers: [] },
      { id: 20, name: 'Sit-up（女）', type: 'single', group: '機會', cost: 0, multiplier: 1.2, quota: 1, selectedPlayers: [] },
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
    console.error('handleUpdateSessionData 錯誤:', error);
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
    if (!presetId) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '缺少設定檔 ID'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('PRESETS');
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '找不到資料表'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headerRow = data[0];
    const presetIdCol = headerRow.indexOf('PRESET_ID');
    const presetDataCol = headerRow.indexOf('PRESET_DATA');
    
    if (presetIdCol === -1 || presetDataCol === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: '資料表格式錯誤'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[presetIdCol] === presetId) {
        const presetData = JSON.parse(row[presetDataCol] || '{}');
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          data: presetData
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
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
    if (!sessionId || !clientId || !password) {
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
        if (password !== currentPassword) {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: '密碼錯誤'
          })).setMimeType(ContentService.MimeType.JSON);
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