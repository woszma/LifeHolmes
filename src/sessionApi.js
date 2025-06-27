const API_URL = "https://script.google.com/macros/s/AKfycbyOJKcFbEUeexGpR0B4F2Pumr5FkAKKgh-ehs2TMv-uProoLkAdae02cvdyEhilDyA5/exec";

// 創建新會話
export async function createSession(createdBy, adminPassword) {
  const params = new URLSearchParams({
    action: 'createSession',
    createdBy: createdBy
  });
  
  if (adminPassword) {
    params.append('adminPassword', adminPassword);
  }
  
  const url = `${API_URL}?${params.toString()}`;
  console.log('createSession 請求 URL:', url);
  console.log('createSession 參數:', { createdBy, adminPassword });
  
  try {
    const res = await fetch(url);
    console.log('createSession 回應狀態:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('createSession 回應內容:', data);
    return data;
  } catch (error) {
    console.error('createSession 錯誤:', error);
    throw error;
  }
}

// 獲取會話資料
export async function getSessionData(sessionId) {
  const url = `${API_URL}?action=getSessionData&sessionId=${encodeURIComponent(sessionId)}`;
  console.log('getSessionData 請求 URL:', url);
  console.log('getSessionData 參數:', { sessionId });
  
  try {
    const res = await fetch(url);
    console.log('getSessionData 回應狀態:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('getSessionData 回應內容:', data);
    return data;
  } catch (error) {
    console.error('getSessionData 錯誤:', error);
    throw error;
  }
}

// 更新會話資料
export async function updateSessionData(sessionId, gameData) {
  const body = `action=updateSessionData&sessionId=${encodeURIComponent(sessionId)}&gameData=${encodeURIComponent(JSON.stringify(gameData))}`;
  console.log('updateSessionData 請求 URL:', API_URL);
  console.log('updateSessionData 參數:', { sessionId, gameDataSize: JSON.stringify(gameData).length });
  
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    console.log('updateSessionData 回應狀態:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('updateSessionData 回應內容:', data);
    return data;
  } catch (error) {
    console.error('updateSessionData 錯誤:', error);
    throw error;
  }
}

// 列出活躍會話
export async function listActiveSessions() {
  const url = `${API_URL}?action=listActiveSessions`;
  console.log('listActiveSessions 請求 URL:', url);
  
  try {
    const res = await fetch(url);
    console.log('listActiveSessions 回應狀態:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await res.json();
    console.log('listActiveSessions 回應內容:', data);
    return data;
  } catch (e) {
    console.error('listActiveSessions 錯誤:', e);
    return { status: 'error', message: e.message || 'Load failed' };
  }
}

// 結束會話
export async function endSession(sessionId) {
  const url = `${API_URL}?action=endSession&sessionId=${encodeURIComponent(sessionId)}`;
  console.log('endSession 請求 URL:', url);
  console.log('endSession 參數:', { sessionId });
  
  try {
    const res = await fetch(url);
    console.log('endSession 回應狀態:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('endSession 回應內容:', data);
    return data;
  } catch (error) {
    console.error('endSession 錯誤:', error);
    throw error;
  }
}

// 設置/搶佔管理者
export async function setAdmin(sessionId, clientId, password) {
  const url = `${API_URL}?action=setAdmin&sessionId=${encodeURIComponent(sessionId)}&clientId=${encodeURIComponent(clientId)}&password=${encodeURIComponent(password)}`;
  console.log('setAdmin 請求 URL:', url);
  console.log('setAdmin 參數:', { sessionId, clientId, password });
  
  try {
    const res = await fetch(url);
    console.log('setAdmin 回應狀態:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('setAdmin 回應內容:', data);
    return data;
  } catch (error) {
    console.error('setAdmin 錯誤:', error);
    throw error;
  }
} 