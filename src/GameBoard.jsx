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

function GameBoard({ players, cards, onSelectCard, history, currentPlayer, onSelectPlayer, onUnselectCard }) {
  // 取得目前玩家已選過的卡牌名稱
  const selectedCardNames = history.filter(h => h.playerIdx === currentPlayer).map(h => h.cardName);
  const grouped = groupCards(cards);

  return (
    <div style={{ display: 'flex', gap: '2em', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
      <StatusPanel players={players} history={history} currentPlayer={currentPlayer} onSelectPlayer={onSelectPlayer} onUnselectCard={onUnselectCard} />
      <div style={{ flex: 1, minWidth: 0, maxWidth: '1000px' }}>
        <h2>選擇人生事件卡</h2>
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
              {groupCards.map((card, idx) => (
                <Card
                  key={card.name}
                  card={card}
                  onSelect={() => onSelectCard(card)}
                  disabled={selectedCardNames.includes(card.name)}
                  selectedText={selectedCardNames.includes(card.name) ? '已選擇' : ''}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameBoard; 