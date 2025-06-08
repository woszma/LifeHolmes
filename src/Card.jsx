function Card({ card, onSelect, disabled, selectedText }) {
  return (
    <div style={{ border: '1px solid #aaa', borderRadius: 8, padding: 16, width: 180, background: '#fafaff' }}>
      <h3>{card.name}</h3>
      <p>費用：{card.cost}</p>
      <p>戰鬥力倍率：x{card.multiplier}</p>
      {card.condition && <p style={{ color: '#888', fontSize: '0.9em' }}>條件：{card.condition}</p>}
      <button onClick={onSelect} disabled={disabled} style={disabled ? { background: '#ccc', cursor: 'not-allowed' } : {}}>
        {disabled ? (selectedText || '已選擇') : '選擇'}
      </button>
    </div>
  );
}

export default Card; 