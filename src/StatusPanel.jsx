function StatusPanel({ players, history, currentPlayer, onSelectPlayer, onUnselectCard, isCurrentMC }) {
  return (
    <div style={{ minWidth: 220 }}>
      <h2>玩家狀態</h2>
      {players.map((player, idx) => (
        <div
          key={idx}
          onClick={onSelectPlayer ? () => onSelectPlayer(idx) : undefined}
          style={{
            border: `2.5px solid ${idx === currentPlayer ? player.color : '#ddd'}`,
            background: idx === currentPlayer ? player.color + '22' : '#fff',
            borderRadius: 6,
            marginBottom: 12,
            padding: 8,
            transition: 'border 0.2s, background 0.2s',
            cursor: onSelectPlayer ? 'pointer' : 'default',
            boxShadow: idx === currentPlayer ? `0 0 0 2px ${player.color}55` : 'none',
          }}
        >
          <strong>{player.name}</strong><br />
          初始金錢：{player.money}｜初始戰鬥力：{player.initialPower ?? player.power}<br />
          當前戰鬥力：{player.power}<br />
          <div style={{ fontSize: '0.9em', color: '#888' }}>
            已選項目：
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {history.filter(h => h.playerIdx === idx).map((h, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {h.cardName} <span style={{ color: '#333', fontSize: '0.95em' }}>x{h.multiplier ?? 1}</span>
                  {isCurrentMC && onUnselectCard && (
                    <button
                      style={{ marginLeft: 6, fontSize: '0.85em', color: '#E91E63', border: 'none', background: 'none', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); onUnselectCard(idx, h.cardName); }}
                    >取消</button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatusPanel; 