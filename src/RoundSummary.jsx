import React from 'react';
import PowerTrendChart from './PowerTrendChart';

function getMultiplierColor(multiplier) {
  if (multiplier >= 1.5) return '#43a047'; // 綠色
  if (multiplier >= 1.0) return '#1976d2'; // 藍色
  return '#e53935'; // 紅色
}

function RoundSummary({ roundData, onConfirm, onBack, roundHistory }) {
  // 取得本回合所有玩家的狀態
  const playerStates = roundData.playerPowers;
  // 取得初始戰鬥力（從第一回合 roundHistory[0]）
  const initialPowers = (roundHistory[0]?.playerPowers || []).reduce((acc, p) => {
    acc[p.name] = p.power;
    return acc;
  }, {});
  
  // 排序（依照目前戰鬥力由高到低）
  const ranking = [...playerStates].sort((a, b) => b.power - a.power);
  
  // 初始排名（依照初始戰鬥力由高到低）
  const initialRanking = (roundHistory[0]?.playerPowers || []).sort((a, b) => b.power - a.power);
  const initialRankMap = initialRanking.reduce((acc, p, idx) => {
    acc[p.name] = idx + 1;
    return acc;
  }, {});
  
  const roundLabel = `回合${roundData.round}戰鬥力`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2em',
        borderRadius: '12px',
        maxWidth: '920px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 24px #0002'
      }}>
        <h2 style={{ marginTop: 0 }}>回合 {roundData.round} 總結</h2>

        {/* 排名榜 */}
        <div style={{ marginBottom: '2em' }}>
          <h3 style={{ marginBottom: 12 }}>本回合玩家排名</h3>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#f9f9f9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px #0001' }}>
            <thead>
              <tr style={{ background: '#f1f1f1' }}>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>目前排名</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>玩家</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>初始排名</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>初始戰鬥力</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>{roundLabel}</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>排名變化</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((p, idx) => {
                const multiplier = p.power / (initialPowers[p.name] || 1);
                const currentRank = idx + 1;
                const initialRank = initialRankMap[p.name] || 0;
                const rankChange = initialRank - currentRank;
                
                return (
                  <tr
                    key={p.name}
                    style={{
                      background: idx === 0 ? 'linear-gradient(90deg,#fffde7 60%,#ffe082 100%)' : idx % 2 === 0 ? '#fff' : '#f5f5f5',
                      fontWeight: idx === 0 ? 700 : 400,
                      boxShadow: idx === 0 ? '0 2px 8px #ffe08255' : undefined,
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#e3f2fd'}
                    onMouseOut={e => e.currentTarget.style.background = idx === 0 ? 'linear-gradient(90deg,#fffde7 60%,#ffe082 100%)' : idx % 2 === 0 ? '#fff' : '#f5f5f5'}
                  >
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 18 }}>
                      {idx === 0 ? <span style={{ fontSize: 20, marginRight: 4 }}>🏆</span> : null}{currentRank}
                    </td>
                    <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: p.color,
                        marginRight: 4,
                        border: '2px solid #fff',
                        boxShadow: '0 1px 4px #0001'
                      }}></span>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {initialRank === 0 ? '-' : initialRank}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{initialPowers[p.name]}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: getMultiplierColor(multiplier) }}>
                      {p.power}（{multiplier.toFixed(2)}x）
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {rankChange > 0 ? (
                        <span style={{ color: '#4CAF50', fontWeight: 600 }}>↑ +{rankChange}</span>
                      ) : rankChange < 0 ? (
                        <span style={{ color: '#f44336', fontWeight: 600 }}>↓ {rankChange}</span>
                      ) : (
                        <span style={{ color: '#666' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ fontSize: '0.95em', color: '#888', marginTop: 6, textAlign: 'right' }}>
            <span>倍數 = 目前戰鬥力 ÷ 初始戰鬥力 | 排名變化 = 初始排名 - 目前排名</span>
          </div>
        </div>

        <PowerTrendChart roundHistory={[...roundHistory, roundData]} />

        <div style={{
          display: 'flex',
          gap: '1em',
          marginTop: '2em',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            返回遊戲
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            確認結束回合
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundSummary; 