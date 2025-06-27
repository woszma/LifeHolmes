import React from 'react';

function TableSelectModal({ players, cards, history, onSelectCard, onUnselectCard, onClose, isCurrentMC }) {
  if (!players || players.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 32, minWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 24px #0002' }}>
          <div style={{ textAlign: 'center', color: '#666' }}>
            沒有玩家數據
          </div>
          <button onClick={onClose} style={{ marginTop: 16, fontSize: 18, background: '#eee', border: 'none', borderRadius: 6, padding: '4px 16px', cursor: 'pointer' }}>關閉</button>
        </div>
      </div>
    );
  }

  // 取得所有玩家名稱
  const playerNames = players.map(p => p.name);
  // 取得所有事件名稱
  const eventNames = cards.map(c => c.name);

  // 建立事件名稱對應卡片
  const cardMap = {};
  cards.forEach(card => { cardMap[card.name] = card; });

  // 建立玩家名稱對應 index
  const playerIndexMap = {};
  players.forEach((p, idx) => { playerIndexMap[p.name] = idx; });

  // 統計 quota 狀態
  const quotaMap = {};
  cards.forEach(card => {
    if (card.quota) quotaMap[card.id] = [];
  });
  history.forEach(h => {
    const card = cards.find(c => c.id === h.cardId);
    if (card && card.quota) {
      const player = players[h.playerIdx];
      if (player && !quotaMap[card.id].includes(player.name)) {
        quotaMap[card.id].push(player.name);
      }
    }
  });

  // 取得每位玩家已完成的 group（只針對 chain 事件）
  const completedChainGroupsByPlayer = {};
  players.forEach((p, idx) => {
    completedChainGroupsByPlayer[p.name] = history
      .filter(h => h.playerIdx === idx && cards.find(c => c.id === h.cardId && c.type === 'chain'))
      .map(h => {
        const card = cards.find(c => c.id === h.cardId);
        return card ? card.group : null;
      })
      .filter(Boolean);
  });
  // 取得每位玩家已完成的事件ID
  const completedIdsByPlayer = {};
  players.forEach((p, idx) => {
    completedIdsByPlayer[p.name] = history.filter(h => h.playerIdx === idx).map(h => h.cardId);
  });
  // 取得每位玩家已完成的 group+name 對應
  const completedGroupMapByPlayer = {};
  players.forEach((p, idx) => {
    const map = {};
    history.filter(h => h.playerIdx === idx).forEach(h => {
      const card = cards.find(c => c.id === h.cardId);
      if (card && card.group) map[card.group] = h.cardId;
    });
    completedGroupMapByPlayer[p.name] = map;
  });

  // 渲染表格
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: 12, 
        boxShadow: '0 4px 24px #0002',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        width: '90%',
        maxWidth: '1200px'
      }}>
        <div style={{ padding: '24px 24px 16px 24px', flexShrink: 0, borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>表格選擇模式</h2>
            <button onClick={onClose} style={{ fontSize: 18, background: '#eee', border: 'none', borderRadius: 6, padding: '4px 16px', cursor: 'pointer' }}>關閉</button>
          </div>
        </div>

        <div style={{ overflow: 'auto', flexGrow: 1 }}>
          <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e3eafc' }}>
                <th style={{ 
                  padding: 8, 
                  minWidth: 120, 
                  maxWidth: 220, 
                  position: 'sticky', 
                  top: 0, 
                  left: 0, 
                  background: '#e3eafc', 
                  zIndex: 11,
                  borderRight: '1px solid #ccc'
                }}>事件</th>
                {playerNames.map(name => (
                  <th key={name} style={{ 
                    padding: 8, 
                    minWidth: 80, 
                    position: 'sticky', 
                    top: 0, 
                    background: '#e3eafc', 
                    zIndex: 10 
                  }}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((card, rowIndex) => {
                const isQuota = !!card.quota;
                const quotaLeft = isQuota ? card.quota - (quotaMap[card.id]?.length || 0) : null;
                const rowBg = rowIndex % 2 === 0 ? '#fff' : '#f7f7f7';

                return (
                  <tr key={card.name} style={{ background: rowBg }}>
                    <td style={{ 
                      padding: 8, 
                      fontWeight: 600, 
                      minWidth: 120, 
                      maxWidth: 220, 
                      position: 'sticky', 
                      left: 0, 
                      background: 'inherit',
                      zIndex: 1,
                      borderRight: '1px solid #ddd'
                    }}>{card.name}</td>
                    {playerNames.map((pname, colIdx) => {
                      // 狀態判斷
                      const idx = playerIndexMap[pname];
                      const completed = completedIdsByPlayer[pname].includes(card.id);
                      let locked = false;
                      let tip = '';
                      if (card.type === 'chain' && card.prerequisite) {
                        if (!completedChainGroupsByPlayer[pname].includes(card.prerequisite)) {
                          locked = true;
                          tip = `需先完成${card.prerequisite}`;
                        }
                      }
                      if (card.type === 'chain' && completedGroupMapByPlayer[pname][card.group] && completedGroupMapByPlayer[pname][card.group] !== card.id) {
                        locked = true;
                        tip = '已選擇其他學校';
                      }
                      if (isQuota && quotaLeft <= 0 && !completed) {
                        locked = true;
                        tip = '名額已滿';
                      }
                      // 已選
                      const selected = completed;
                      return (
                        <td
                          key={pname}
                          style={{
                            padding: 8,
                            textAlign: 'center',
                            background: selected ? '#c8e6c9' : locked ? '#f0f0f0' : 'transparent',
                            color: locked ? '#888' : '#222',
                            cursor: locked ? 'not-allowed' : 'pointer',
                            border: '1px solid #eee',
                            fontWeight: selected ? 700 : 400,
                            position: 'relative',
                            minWidth: 60
                          }}
                          title={tip}
                          onClick={() => {
                            if (!isCurrentMC || locked) return;
                            if (selected) {
                              onUnselectCard(idx, card.id);
                            } else {
                              // 傳遞 playerIdx 給 onSelectCard
                              onSelectCard({ ...card, _tableSelectPlayerIdx: idx });
                            }
                          }}
                        >
                          {selected ? '✔' : ''}
                          {locked && tip && (
                            <span style={{ fontSize: 11, color: '#b71c1c', display: 'block' }}>{tip}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TableSelectModal; 