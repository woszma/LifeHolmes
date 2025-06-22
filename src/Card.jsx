function Card({ card, onSelect, disabled, selectedText, locked, unlockTip, completed, quotaInfo, onEdit, onToggleCustom }) {
  const quota = card.quota;
  const selectedPlayers = quotaInfo?.selectedPlayers || card.selectedPlayers || [];
  const quotaLeft = quota ? quota - selectedPlayers.length : null;
  const isQuotaFull = quota && quotaLeft <= 0;

  return (
    <div style={{ 
      border: '1px solid #aaa', 
      borderRadius: 8, 
      padding: 16, 
      width: 180, 
      background: locked || isQuotaFull ? '#f0f0f0' : '#fafaff',
      opacity: locked || isQuotaFull ? 0.6 : 1,
      position: 'relative'
    }}>
      {onEdit && (
        <button
          onClick={() => onEdit(card)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: '0.8em',
            cursor: 'pointer',
            zIndex: 10
          }}
          title="編輯事件"
        >
          ✏️
        </button>
      )}
      
      {onToggleCustom && (
        <button
          onClick={() => onToggleCustom(card)}
          style={{
            position: 'absolute',
            top: 8,
            right: onEdit ? 40 : 8,
            background: card.isCustom ? '#9c27b0' : '#e0e0e0',
            color: card.isCustom ? 'white' : '#666',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: '0.8em',
            cursor: 'pointer',
            zIndex: 10
          }}
          title={card.isCustom ? "移除自訂" : "加入自訂"}
        >
          {card.isCustom ? '⭐' : '☆'}
        </button>
      )}
      
      <h3 style={{ marginBottom: 8 }}>{card.name}</h3>
      <p>費用：{card.cost}</p>
      <p>戰鬥力倍率：x{card.multiplier}</p>
      {card.condition && <p style={{ color: '#888', fontSize: '0.9em' }}>條件：{card.condition}</p>}
      {quota && (
        <div style={{ color: isQuotaFull ? '#b71c1c' : '#1976d2', fontWeight: 600, fontSize: '0.98em', marginBottom: 4 }}>
          剩餘名額：{quotaLeft} / {quota}
        </div>
      )}
      {selectedPlayers && selectedPlayers.length > 0 && (
        <div style={{ color: '#888', fontSize: '0.92em', marginBottom: 4 }}>
          已選：{selectedPlayers.join('、')}
        </div>
      )}
      {locked && (
        <div style={{ color: '#b71c1c', fontSize: '0.95em', marginBottom: 8, fontWeight: 600 }}>
          {unlockTip || '尚未解鎖'}
        </div>
      )}
      {isQuotaFull && (
        <div style={{ color: '#b71c1c', fontSize: '0.95em', marginBottom: 8, fontWeight: 600 }}>
          名額已滿
        </div>
      )}
      {completed && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: (onEdit ? 40 : 8) + (onToggleCustom ? 32 : 0),
          background: '#43a047',
          color: 'white',
          borderRadius: 12,
          padding: '2px 10px',
          fontSize: '0.9em',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span style={{ fontSize: 16 }}>✔</span> 已完成
        </div>
      )}
      <button
        onClick={onSelect}
        disabled={disabled || locked || completed || isQuotaFull}
        style={
          locked || completed || isQuotaFull ? 
            { background: '#ccc', cursor: 'not-allowed', color: '#888', border: 'none', borderRadius: 6, padding: '6px 18px', marginTop: 8 } :
            { background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', marginTop: 8, fontWeight: 600, cursor: 'pointer', fontSize: '1em', boxShadow: '0 1px 4px #0001' }
        }
      >
        {completed ? '已完成' : locked ? '未解鎖' : isQuotaFull ? '名額已滿' : (disabled ? (selectedText || '已選擇') : '選擇')}
      </button>
    </div>
  );
}

export default Card; 