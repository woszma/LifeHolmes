import { useState } from 'react';

const DEFAULT_MONEY = 8000;
const DEFAULT_POWER = 100;
const MIN_MONEY = 8000;
const MAX_MONEY = 22000;
const MIN_POWER = 50;
const MAX_POWER = 100;

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

function getRandomMoney() {
  // 產生 8000~22000 間，且為 100 的倍數
  const min = Math.ceil(MIN_MONEY / 100);
  const max = Math.floor(MAX_MONEY / 100);
  return getRandomInt(min, max) * 100;
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
    newPlayers[idx].money = getRandomMoney();
    newPlayers[idx].power = getRandomInt(MIN_POWER, MAX_POWER);
    setPlayers(newPlayers);
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
      <div style={{ marginBottom: 16 }}>
        {onLoadPreset && (
          <button type="button" onClick={() => {console.log('載入預設設定按鈕被點擊'); onLoadPreset();}} style={{ marginRight: 12, background: '#8e24aa', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>
            載入預設設定
          </button>
        )}
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
                  min={MIN_MONEY}
                  max={MAX_MONEY}
                  step={100}
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
                  min={MIN_POWER}
                  max={MAX_POWER}
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