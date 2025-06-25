const API_URL = "https://script.google.com/macros/s/AKfycbyOJKcFbEUeexGpR0B4F2Pumr5FkAKKgh-ehs2TMv-uProoLkAdae02cvdyEhilDyA5/exec";

// 創建新會話
export async function createSession(createdBy) {
  const res = await fetch(`${API_URL}?action=createSession&createdBy=${encodeURIComponent(createdBy)}`);
  return await res.json();
}

// 獲取會話資料
export async function getSessionData(sessionId) {
  const res = await fetch(`${API_URL}?action=getSessionData&sessionId=${encodeURIComponent(sessionId)}`);
  return await res.json();
}

// 更新會話資料
export async function updateSessionData(sessionId, gameData) {
  const body = `action=updateSessionData&sessionId=${encodeURIComponent(sessionId)}&gameData=${encodeURIComponent(JSON.stringify(gameData))}`;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  return await res.json();
}

// 列出活躍會話
export async function listActiveSessions() {
  try {
    const res = await fetch(`${API_URL}?action=listActiveSessions`);
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    return data;
  } catch (e) {
    return { status: 'error', message: e.message || 'Load failed' };
  }
}

// 結束會話
export async function endSession(sessionId) {
  const res = await fetch(`${API_URL}?action=endSession&sessionId=${encodeURIComponent(sessionId)}`);
  return await res.json();
}

// 設置/搶佔管理者
export async function setAdmin(sessionId, clientId, password) {
  const res = await fetch(`${API_URL}?action=setAdmin&sessionId=${encodeURIComponent(sessionId)}&clientId=${encodeURIComponent(clientId)}&password=${encodeURIComponent(password)}`);
  return await res.json();
} 