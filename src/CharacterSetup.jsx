import { useState } from 'react';

const DEFAULT_MONEY = 8000;
const DEFAULT_POWER = 100;
const MIN_MONEY = 0;
const MAX_MONEY = 999999;
const MIN_POWER = 1;
const MAX_POWER = 999999;

const THEME_COLORS = [
  '#FFB300', // 黃
  '#039BE5', // 藍
  '#8BC34A', // 綠
  '#E91E63', // 粉紅
  '#FF7043', // 橙
  '#7E57C2', // 紫
  '#00BFAE', // 青
  '#F4511E', // 深橙
];

const DEFAULT_PLAYERS = [
  { name: '小明', money: 8000, power: 100 },
  { name: '小華', money: 12000, power: 85 },
  { name: '小美', money: 15000, power: 95 },
  { name: '小強', money: 10000, power: 90 },
  { name: '小芳', money: 18000, power: 80 }
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// CSV 相關功能
function downloadCSV(data, filename) {
  const csvContent = data.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  return data;
}

function CharacterSetup({ onStart, onLoadPreset }) {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);

  const handleChange = (idx, field, value) => {
    const newPlayers = [...players];
    newPlayers[idx][field] = value;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: '', money: DEFAULT_MONEY, power: DEFAULT_POWER }]);
  };

  const removePlayer = (idx) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== idx));
    }
  };

  const randomize = (idx) => {
    const newPlayers = [...players];
    // 隨機產生 1000-50000 的金錢
    newPlayers[idx].money = getRandomInt(1000, 50000);
    // 隨機產生 10-200 的戰鬥力
    newPlayers[idx].power = getRandomInt(10, 200);
    setPlayers(newPlayers);
  };

  // CSV 功能按鈕
  const downloadTemplate = () => {
    const templateData = [
      ['name', 'money', 'power'],
      ['小明', '8000', '100'],
      ['小華', '12000', '85'],
      ['小美', '15000', '95']
    ];
    downloadCSV(templateData, 'players_template.csv');
  };

  const exportPlayers = () => {
    const csvData = [
      ['name', 'money', 'power'],
      ...players.map(player => [player.name, player.money, player.power])
    ];
    downloadCSV(csvData, 'players_data.csv');
  };

  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const csvData = parseCSV(csvText);
        
        // 驗證資料格式
        const validPlayers = csvData
          .filter(row => row.name && row.money && row.power)
          .map(row => ({
            name: row.name.trim(),
            money: Math.max(0, parseInt(row.money) || DEFAULT_MONEY),
            power: Math.max(1, parseInt(row.power) || DEFAULT_POWER)
          }));

        if (validPlayers.length === 0) {
          alert('CSV 檔案格式錯誤或沒有有效的玩家資料');
          return;
        }

        setPlayers(validPlayers);
        alert(`成功匯入 ${validPlayers.length} 個玩家資料`);
      } catch (error) {
        console.error('CSV 解析錯誤:', error);
        alert('CSV 檔案格式錯誤，請檢查檔案內容');
      }
    };
    reader.readAsText(file);
    
    // 清除檔案選擇，允許重複選擇同一個檔案
    event.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (players.every(p => p.name.trim() && p.money && p.power)) {
      // 分配主題色
      const playersWithColor = players.map((p, i) => ({
        ...p,
        name: p.name.trim(),
        money: Number(p.money),
        power: Number(p.power),
        color: THEME_COLORS[i % THEME_COLORS.length],
      }));
      onStart(playersWithColor);
    }
  };

  return (
    <div className="character-setup">
      <h2>建立你的角色（可多位玩家）</h2>
      
      {/* 載入預設功能 */}
      {onLoadPreset && (
        <div style={{ 
          marginBottom: 16, 
          padding: '12px', 
          background: '#f3e5f5', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 600, color: '#8e24aa', marginRight: '8px' }}>預設功能：</span>
          <button 
            type="button" 
            onClick={() => {console.log('載入預設設定按鈕被點擊'); onLoadPreset();}} 
            style={{ 
              background: '#8e24aa', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '6px 12px', 
              fontWeight: 600, 
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⚙️ 載入預設設定
          </button>
        </div>
      )}
      
      {/* CSV 功能按鈕 */}
      <div style={{ 
        marginBottom: 16, 
        padding: '12px', 
        background: '#f5f5f5', 
        borderRadius: '8px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 600, color: '#333', marginRight: '8px' }}>CSV 功能：</span>
        
        <button 
          type="button" 
          onClick={downloadTemplate}
          style={{ 
            background: '#4CAF50', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '6px 12px', 
            fontWeight: 600, 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📥 下載範本
        </button>
        
        <label style={{ 
          background: '#2196F3', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '4px', 
          padding: '6px 12px', 
          fontWeight: 600, 
          cursor: 'pointer',
          fontSize: '14px',
          display: 'inline-block'
        }}>
          📤 匯入 CSV
          <input
            type="file"
            accept=".csv"
            onChange={importCSV}
            style={{ display: 'none' }}
          />
        </label>
        
        <button 
          type="button" 
          onClick={exportPlayers}
          style={{ 
            background: '#FF9800', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '4px', 
            padding: '6px 12px', 
            fontWeight: 600, 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📋 匯出資料
        </button>
      </div>

      {/* 使用說明 */}
      <div style={{ 
        marginBottom: 16, 
        padding: '8px 12px', 
        background: '#e3f2fd', 
        borderRadius: '4px',
        fontSize: '14px',
        color: '#1976d2'
      }}>
        <strong>使用說明：</strong>
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          <li>下載範本後，可在 Google Sheet 或 Excel 中編輯玩家資料</li>
          <li>匯入 CSV 檔案時，請確保包含 name、money、power 三欄</li>
          <li>金錢和戰鬥力可自由設定，無範圍限制</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        {players.map((player, idx) => (
          <div key={idx} style={{ 
            marginBottom: '1em', 
            border: '1px solid #eee', 
            padding: '1em', 
            borderRadius: '8px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5em'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5em'
            }}>
              <label style={{ flex: 1 }}>
                玩家 {idx + 1} 名稱：
                <input
                  type="text"
                  value={player.name}
                  onChange={e => handleChange(idx, 'name', e.target.value)}
                  placeholder="請輸入角色名稱"
                  required
                  style={{ marginRight: '1em' }}
                />
              </label>
              <button
                type="button"
                onClick={() => removePlayer(idx)}
                style={{
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: players.length > 1 ? 'block' : 'none',
                  marginLeft: '1em'
                }}
              >
                移除
              </button>
            </div>
            <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
              <label>
                金錢：
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={player.money}
                  onChange={e => handleChange(idx, 'money', e.target.value)}
                  required
                  style={{ width: '100px', marginRight: '1em' }}
                />
              </label>
              <label>
                戰鬥力：
                <input
                  type="number"
                  min="1"
                  value={player.power}
                  onChange={e => handleChange(idx, 'power', e.target.value)}
                  required
                  style={{ width: '60px', marginRight: '1em' }}
                />
              </label>
              <button 
                type="button" 
                onClick={() => randomize(idx)}
                style={{
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                隨機產生
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addPlayer} style={{ marginRight: '1em' }}>
          新增玩家
        </button>
        <button type="submit">開始遊戲</button>
      </form>
    </div>
  );
}

export default CharacterSetup; 