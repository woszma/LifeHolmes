function GameResult({ players, onRestart }) {
  // 依戰鬥力排序
  const sorted = [...players].sort((a, b) => b.power - a.power);
  return (
    <div style={{ maxWidth: 500, margin: '2em auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32 }}>
      <h2>遊戲結束！玩家排名</h2>
      <ol style={{ fontSize: '1.2em', paddingLeft: 24 }}>
        {sorted.map((p, idx) => (
          <li key={p.name} style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 'bold', color: p.color }}>{p.name}</span>
            &nbsp;— 戰鬥力：<b>{p.power}</b>
            <span style={{ fontSize: '0.9em', color: '#888' }}>（初始戰鬥力: {p.initialPower}）</span>
          </li>
        ))}
      </ol>
      <button onClick={onRestart} style={{ marginTop: 24, padding: '8px 24px', fontSize: '1em', borderRadius: 6, background: '#039BE5', color: '#fff', border: 'none', cursor: 'pointer' }}>重新開始</button>
    </div>
  );
}

export default GameResult; 