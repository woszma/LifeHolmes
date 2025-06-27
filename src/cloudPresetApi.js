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
  try {
    console.log('開始載入預設:', presetId);
    console.log('API URL:', `${API_URL}?action=load&preset_id=${encodeURIComponent(presetId)}`);
    
    const res = await fetch(`${API_URL}?action=load&preset_id=${encodeURIComponent(presetId)}`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Google Apps Script 原始回傳:', data);
    
    // 轉換資料結構以匹配前端期望的格式
    if (data.status === 'success') {
      // data.data 可能是字串或物件，需要先解析
      let presetData;
      if (typeof data.data === 'string') {
        try {
          presetData = JSON.parse(data.data);
        } catch (e) {
          console.error('JSON 解析錯誤:', e);
          presetData = {};
        }
      } else {
        presetData = data.data || {};
      }
      console.log('解析後的 presetData:', presetData);
      
      // 檢查數據結構，支援多種可能的格式
      let events = [];
      let tabs = [];
      
      if (presetData.events && Array.isArray(presetData.events)) {
        events = presetData.events;
      } else if (presetData.allCards && Array.isArray(presetData.allCards)) {
        events = presetData.allCards;
      }
      
      if (presetData.tabs && Array.isArray(presetData.tabs)) {
        tabs = presetData.tabs;
      } else if (presetData.customTabs && Array.isArray(presetData.customTabs)) {
        tabs = presetData.customTabs;
      }
      
      console.log('轉換後的 events:', events);
      console.log('轉換後的 tabs:', tabs);
      
      return {
        status: 'success',
        data: {
          events: events,
          tabs: tabs
        }
      };
    }
    return data;
  } catch (error) {
    console.error('loadPreset 錯誤:', error);
    return {
      status: 'error',
      message: `載入失敗: ${error.message}`
    };
  }
}

export async function listPresets() {
  try {
    console.log('開始獲取預設列表');
    console.log('API URL:', `${API_URL}?action=list`);
    
    const res = await fetch(`${API_URL}?action=list`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('listPresets 原始回傳:', data);
    
    // 轉換資料結構以匹配前端期望的格式
    if (data.status === 'success') {
      return {
        status: 'success',
        presets: data.presets || []
      };
    }
    return data;
  } catch (error) {
    console.error('listPresets 錯誤:', error);
    return {
      status: 'error',
      message: `獲取預設列表失敗: ${error.message}`
    };
  }
} 