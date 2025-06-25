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
  // 取得目前玩家已選過的卡牌名稱
  const selectedCardNames = history.filter(h => h.playerIdx === currentPlayer).map(h => h.cardName);
  // 取得目前玩家已完成的 group（只針對 chain 事件）
  const completedChainGroups = history
    .filter(h => h.playerIdx === currentPlayer && cards.find(c => c.name === h.cardName && c.type === 'chain'))
    .map(h => {
      const card = cards.find(c => c.name === h.cardName);
      return card ? card.group : null;
    })
    .filter(Boolean);
  // 取得目前玩家已完成的事件名稱
  const completedNames = history.filter(h => h.playerIdx === currentPlayer).map(h => h.cardName);
  // 取得目前玩家已完成的 group+name 對應
  const completedGroupMap = {};
  history.filter(h => h.playerIdx === currentPlayer).forEach(h => {
    const card = cards.find(c => c.name === h.cardName);
    if (card && card.group) completedGroupMap[card.group] = h.cardName;
  });

  // 統計所有玩家對 quota 事件的選擇
  const quotaMap = {};
  cards.forEach(card => {
    if (card.quota) {
      quotaMap[card.name] = [];
    }
  });
  
  // 使用 Set 來確保每個玩家對同一個事件只被計算一次
  const playerEventMap = {};
  history.forEach(h => {
    const card = cards.find(c => c.name === h.cardName);
    if (card && card.quota) {
      const player = players[h.playerIdx];
      if (player) {
        if (!playerEventMap[card.name]) {
          playerEventMap[card.name] = new Set();
        }
        playerEventMap[card.name].add(player.name);
      }
    }
  });
  
  // 將 Set 轉換為陣列
  Object.keys(playerEventMap).forEach(cardName => {
    quotaMap[cardName] = Array.from(playerEventMap[cardName]);
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
              let completed = completedNames.includes(card.name);
              // 同一 group 只能選一個（如小學只能選一間）
              let locked = false;
              let unlockTip = '';
              if (card.type === 'chain' && completedGroupMap[card.group] && completedGroupMap[card.group] !== card.name) {
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
              const quotaInfo = card.quota ? { selectedPlayers: quotaMap[card.name] } : undefined;
              return (
                <Card
                  key={card.name}
                  card={card}
                  onSelect={isCurrentMC ? () => onSelectCard(card) : undefined}
                  disabled={isCurrentMC ? selectedCardNames.includes(card.name) : false}
                  selectedText={isCurrentMC && selectedCardNames.includes(card.name) ? '已選擇' : ''}
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