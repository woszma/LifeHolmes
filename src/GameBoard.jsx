import StatusPanel from './StatusPanel';
import Card from './Card';

function groupCards(cards) {
  const groups = {};
  cards.forEach(card => {
    const group = card.group || '其他';
    if (!groups[group]) groups[group] = [];
    groups[group].push(card);
  });
  return groups;
}

function GameBoard({ players, cards, onSelectCard, history, currentPlayer, onSelectPlayer, onUnselectCard, onEditCard, onToggleCustom, isCurrentMC }) {
  if (!players || players.length === 0) {
    return (
      <div style={{ flex: 1, minWidth: 0, maxWidth: '1000px', textAlign: 'center', padding: '2em', color: '#666' }}>
        沒有玩家數據
      </div>
    );
  }

  // 取得目前玩家已選過的卡牌ID
  const selectedCardIds = history.filter(h => h.playerIdx === currentPlayer).map(h => h.cardId);
  // 取得目前玩家已完成的 group（只針對 chain 事件）
  const completedChainGroups = history
    .filter(h => h.playerIdx === currentPlayer && cards.find(c => c.id === h.cardId && c.type === 'chain'))
    .map(h => {
      const card = cards.find(c => c.id === h.cardId);
      return card ? card.group : null;
    })
    .filter(Boolean);
  // 取得目前玩家已完成的事件ID
  const completedIds = history.filter(h => h.playerIdx === currentPlayer).map(h => h.cardId);
  // 取得目前玩家已完成的 group+id 對應
  const completedGroupMap = {};
  history.filter(h => h.playerIdx === currentPlayer).forEach(h => {
    const card = cards.find(c => c.id === h.cardId);
    if (card && card.group) completedGroupMap[card.group] = h.cardId;
  });

  // 統計所有玩家對 quota 事件的選擇
  const quotaMap = {};
  cards.forEach(card => {
    if (card.quota) {
      quotaMap[card.id] = [];
    }
  });
  
  // 使用 Set 來確保每個玩家對同一個事件只被計算一次
  const playerEventMap = {};
  history.forEach(h => {
    const card = cards.find(c => c.id === h.cardId);
    if (card && card.quota) {
      const player = players[h.playerIdx];
      if (player) {
        if (!playerEventMap[card.id]) {
          playerEventMap[card.id] = new Set();
        }
        playerEventMap[card.id].add(player.name);
      }
    }
  });
  
  // 將 Set 轉換為陣列
  Object.keys(playerEventMap).forEach(cardId => {
    quotaMap[cardId] = Array.from(playerEventMap[cardId]);
  });

  const grouped = groupCards(cards);

  return (
    <div style={{ flex: 1, minWidth: 0, maxWidth: '1000px' }}>
      {Object.entries(grouped).map(([group, groupCards]) => (
        <div key={group} style={{ marginBottom: '2em' }}>
          <h3 style={{ borderBottom: '1px solid #ccc', margin: '0 0 1em 0', paddingBottom: 4 }}>{group}</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1em',
              width: '100%',
              maxWidth: '1000px',
              boxSizing: 'border-box',
            }}
          >
            {groupCards.map((card, idx) => {
              // 判斷是否已完成
              let completed = completedIds.includes(card.id);
              // 同一 group 只能選一個（如小學只能選一間）
              let locked = false;
              let unlockTip = '';
              if (card.type === 'chain' && completedGroupMap[card.group] && completedGroupMap[card.group] !== card.id) {
                locked = true;
                unlockTip = '已選擇其他學校';
              }
              // 判斷是否流程鎖定
              if (card.type === 'chain' && card.prerequisite) {
                if (!completedChainGroups.includes(card.prerequisite)) {
                  locked = true;
                  unlockTip = `需先完成${card.prerequisite}`;
                }
              }
              // quota 卡片的名額資訊
              const quotaInfo = card.quota ? { selectedPlayers: quotaMap[card.id] } : undefined;
              return (
                <Card
                  key={card.id}
                  card={card}
                  onSelect={isCurrentMC ? () => onSelectCard(card) : undefined}
                  disabled={isCurrentMC ? selectedCardIds.includes(card.id) : false}
                  selectedText={isCurrentMC && selectedCardIds.includes(card.id) ? '已選擇' : ''}
                  locked={locked}
                  unlockTip={unlockTip}
                  completed={completed}
                  quotaInfo={quotaInfo}
                  onEdit={isCurrentMC ? onEditCard : undefined}
                  onToggleCustom={isCurrentMC ? onToggleCustom : undefined}
                  isCurrentMC={isCurrentMC}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default GameBoard; 