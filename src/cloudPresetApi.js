const API_URL = "https://script.google.com/macros/s/AKfycbyOJKcFbEUeexGpR0B4F2Pumr5FkAKKgh-ehs2TMv-uProoLkAdae02cvdyEhilDyA5/exec";

export async function savePreset(presetId, data) {
  const body = `action=save&presetId=${encodeURIComponent(presetId)}&data=${encodeURIComponent(JSON.stringify(data))}`;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  return await res.json();
}

export async function loadPreset(presetId) {
  const res = await fetch(`${API_URL}?action=load&presetId=${encodeURIComponent(presetId)}`);
  const data = await res.json();
  
  // 轉換資料結構以匹配前端期望的格式
  if (data.status === 'success') {
    // Google Apps Script 已經解析了 JSON，data.data 是物件
    const presetData = data.data || {};
    
    return {
      status: 'success',
      data: {
        events: Array.isArray(presetData.events) ? presetData.events : [],
        tabs: Array.isArray(presetData.tabs) ? presetData.tabs : []
      }
    };
  }
  return data;
}

export async function listPresets() {
  const res = await fetch(`${API_URL}?action=list`);
  const data = await res.json();
  
  // 轉換資料結構以匹配前端期望的格式
  if (data.status === 'success') {
    return {
      status: 'success',
      presets: data.presets || []
    };
  }
  return data;
} 