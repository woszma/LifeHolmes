import React, { useState } from "react";
import CharacterSetup from "./CharacterSetup";
import StatusPanel from "./StatusPanel";
import GameBoard from "./GameBoard";
import GameResult from "./GameResult";
import PowerTrendChart from "./PowerTrendChart";
import RoundSummary from "./RoundSummary";
import TableSelectModal from './TableSelectModal';
import EventEditor from './EventEditor';
import "./App.css";

const sampleCards = [
  // 連續事件：教育路徑
  { id: 1, name: '名牌小學', type: 'chain', group: '小學', order: 1, prerequisite: null, cost: 500, multiplier: 1.4, condition: '父或母為專業生優先' },
  { id: 2, name: '一般小學', type: 'chain', group: '小學', order: 1, prerequisite: null, cost: 500, multiplier: 1.3 },
  { id: 3, name: '名牌中學', type: 'chain', group: '中學', order: 2, prerequisite: '小學', cost: 500, multiplier: 1.4, condition: '須小學畢業、名牌小學畢業生優先' },
  { id: 4, name: '一般中學', type: 'chain', group: '中學', order: 2, prerequisite: '小學', cost: 500, multiplier: 1.3, condition: '須小學畢業' },
  { id: 5, name: '中學文憑試', type: 'chain', group: '中學文憑試', order: 3, prerequisite: '中學', cost: 500, multiplier: 1.1, condition: '須中學畢業，於30分鐘後執行，請交考試費及領取推薦證' },
  { id: 6, name: '資助大學學士', type: 'chain', group: '大學', order: 4, prerequisite: '中學文憑試', cost: 500, multiplier: 2.0, condition: '須文憑試合格' },
  { id: 7, name: '是旦福大學學士', type: 'chain', group: '大學', order: 4, prerequisite: '中學', cost: 3000, multiplier: 2.2, condition: '須文憑試合格或「捐款」或有海外交流經驗' },
  { id: 8, name: "Half,Yellow, 惡忠怨、廢煙理工、Don't傾大學學士", type: 'chain', group: '大學', order: 4, prerequisite: '中學', cost: 2000, multiplier: 2.2, condition: '父或母有海外護照，文憑試不合格，預備班學費2000' },
  // 非連續事件
  { id: 9, name: '明愛補習社', type: 'single', group: '補習', cost: 1000, multiplier: 1.4, condition: '考試後，海關有可能會隨機抽查一人查問' },
  { id: 10, name: '明愛補習社優質內部影片流出', type: 'single', group: '補習', cost: 200, multiplier: 1.4, condition: '如發現非法下載，留案底' },
  { id: 11, name: '電腦/寬頻/手機電話', type: 'single', group: '設備', cost: 1000, multiplier: 1.4 },
  { id: 12, name: '流動數據', type: 'single', group: '設備', cost: 500, multiplier: 1.2 },
  { id: 13, name: '體育', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
  { id: 14, name: '藝術', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
  { id: 15, name: '學術', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
  { id: 16, name: '社會運動', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
  { id: 17, name: '義工服務', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項，請說明內容' },
  { id: 18, name: '海外交換生計劃', type: 'single', group: '海外交換', cost: 2000, multiplier: 2.0, quota: 2, selectedPlayers: [] },
  { id: 19, name: '擂台賽（男）', type: 'single', group: '機會', cost: 0, multiplier: 1.1, quota: 1, selectedPlayers: [] },
  { id: 20, name: 'Sit-up（女）', type: 'single', group: '機會', cost: 0, multiplier: 1.2, quota: 1, selectedPlayers: [] },
];

function App() {
  const [players, setPlayers] = useState(null)
  const [history, setHistory] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [roundHistory, setRoundHistory] = useState([])
  const [currentRound, setCurrentRound] = useState(0)
  const [showRoundSummary, setShowRoundSummary] = useState(false)
  const [tempRoundData, setTempRoundData] = useState(null)
  const [eventTab, setEventTab] = useState('all'); // all, chain, single, custom
  const [showTableSelect, setShowTableSelect] = useState(false);
  
  // 事件編輯相關狀態
  const [allCards, setAllCards] = useState(sampleCards);
  const [editingCard, setEditingCard] = useState(null);
  const [customTabs, setCustomTabs] = useState([]);

  // 分類事件卡
  const chainCards = allCards.filter(card => card.type === 'chain');
  const singleCards = allCards.filter(card => card.type === 'single');
  const customCards = allCards.filter(card => card.isCustom === true);
  let filteredCards = allCards;
  if (eventTab === 'chain') filteredCards = chainCards;
  else if (eventTab === 'single') filteredCards = singleCards;
  else if (eventTab === 'custom') filteredCards = customCards;

  const handleStart = (playersData) => {
    const playersWithColor = playersData.map(p => ({ ...p, initialPower: p.power }));
    setPlayers(playersWithColor);
    setHistory([]);
    setCurrentPlayer(0);
    setGameOver(false);
    setRoundHistory([{
      round: 0,
      playerPowers: playersWithColor.map(p => ({ name: p.name, power: p.power, color: p.color }))
    }]);
    setCurrentRound(0);
    setShowRoundSummary(false);
    setTempRoundData(null);
  }

  const handleSelectCard = (card) => {
    // 支援表格模式下指定 playerIdx
    const playerIdx = card._tableSelectPlayerIdx !== undefined ? card._tableSelectPlayerIdx : currentPlayer;
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== playerIdx) return p
      if (card.condition && card.condition.includes('金錢需大於')) {
        const minMoney = parseInt(card.condition.replace(/[^0-9]/g, ''))
        if (p.money <= minMoney) return p
      }
      return {
        ...p,
        power: Math.round(p.power * card.multiplier)
      }
    }));

    setHistory(prev => [
      ...prev,
      { playerIdx, cardName: card.name, multiplier: card.multiplier, cost: card.cost }
    ]);
  }

  const handleEndRound = () => {
    const currentRoundData = {
      round: currentRound,
      playerPowers: players.map(p => ({ name: p.name, power: p.power, color: p.color }))
    };
    setTempRoundData(currentRoundData);
    setShowRoundSummary(true);
  }

  const handleConfirmRound = () => {
    if (tempRoundData) {
      setRoundHistory(prev => [...prev, tempRoundData]);
      setCurrentRound(prev => prev + 1);
      setShowRoundSummary(false);
      setTempRoundData(null);
    }
  }

  const handleBackToRound = () => {
    setShowRoundSummary(false);
    setTempRoundData(null);
  }

  // 取消選擇卡牌
  const handleUnselectCard = (playerIdx, cardName) => {
    const card = allCards.find(c => c.name === cardName);
    if (!card) return;
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== playerIdx) return p;
      return {
        ...p,
        power: Math.round(p.power / (card.multiplier || 1)),
      }
    }))
    setHistory(prev => {
      const idx = prev.map((h, i) => h.playerIdx === playerIdx && h.cardName === cardName ? i : -1).filter(i => i !== -1).pop();
      if (idx === undefined) return prev;
      return prev.slice(0, idx).concat(prev.slice(idx + 1));
    });
  }

  const handleGameOver = () => setGameOver(true)

  // 事件編輯相關處理函數
  const handleEditCard = (card) => {
    setEditingCard(card);
  };

  const handleSaveCard = (cardData) => {
    // 自動加入新tab名稱
    if (cardData.customTab && !customTabs.includes(cardData.customTab)) {
      setCustomTabs(prev => [...prev, cardData.customTab]);
    }
    const isEditing = allCards.some(c => c.id === cardData.id);
    if (isEditing) {
      setAllCards(prev => prev.map(c => c.id === cardData.id ? cardData : c));
    } else {
      setAllCards(prev => [...prev, cardData]);
    }
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId) => {
    setAllCards(prev => prev.filter(c => c.id !== cardId));
    setEditingCard(null);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
  };

  const handleAddNewCard = () => {
    setEditingCard({});
  };

  // 處理自訂標記
  const handleToggleCustom = (card) => {
    setAllCards(prev => prev.map(c => 
      c.id === card.id ? { ...c, isCustom: !c.isCustom } : c
    ));
  };

  return (
    <div className="App">
      <h1>人生 RPG 遊戲</h1>
      {players && !gameOver && (
        <div style={{ width: '100%', maxWidth: 800, margin: '0 auto 1em auto', padding: '0 1em' }}>
          <div style={{ marginBottom: 16, fontWeight: 500, color: '#1976d2', fontSize: '1.1em' }}>
            第 {currentRound} 回合
          </div>
          <button
            onClick={() => setShowTableSelect(true)}
            style={{
              margin: '12px 0',
              padding: '8px 24px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '1.1em',
              cursor: 'pointer',
              boxShadow: '0 1px 4px #0001'
            }}
          >
            表格選擇模式
          </button>
        </div>
      )}
      {!players ? (
        <CharacterSetup onStart={handleStart} />
      ) : gameOver ? (
        <GameResult players={players} onRestart={() => setPlayers(null)} />
      ) : (
        <>
          <div style={{ position: 'absolute', right: 24, top: 24, zIndex: 10, display: 'flex', gap: '1em' }}>
            <button 
              onClick={handleEndRound}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              結束回合
            </button>
            <button 
              onClick={handleGameOver}
              style={{
                padding: '8px 16px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              結束遊戲
            </button>
          </div>
          <div style={{ display: 'flex', gap: '2em', padding: '1em' }}>
            <StatusPanel 
              players={players} 
              history={history} 
              currentPlayer={currentPlayer} 
              onSelectPlayer={setCurrentPlayer} 
              onUnselectCard={handleUnselectCard}
            />
            <div style={{ flex: 1 }}>
              <h2>選擇人生事件卡</h2>
              {/* 事件卡分類標籤 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setEventTab('all')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: eventTab === 'all' ? '#1976d2' : '#e3eafc', color: eventTab === 'all' ? '#fff' : '#1976d2', fontWeight: 600, cursor: 'pointer' }}>全部</button>
                <button onClick={() => setEventTab('chain')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: eventTab === 'chain' ? '#1976d2' : '#e3eafc', color: eventTab === 'chain' ? '#fff' : '#1976d2', fontWeight: 600, cursor: 'pointer' }}>連續事件</button>
                <button onClick={() => setEventTab('single')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: eventTab === 'single' ? '#1976d2' : '#e3eafc', color: eventTab === 'single' ? '#fff' : '#1976d2', fontWeight: 600, cursor: 'pointer' }}>非連續事件</button>
                {customTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setEventTab(tab)}
                    style={{
                      padding: '6px 18px',
                      borderRadius: 20,
                      border: 'none',
                      background: eventTab === tab ? '#8e24aa' : '#f3e5f5',
                      color: eventTab === tab ? '#fff' : '#8e24aa',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {tab}
                  </button>
                ))}
                <button 
                  onClick={handleAddNewCard}
                  style={{ 
                    padding: '6px 18px', 
                    borderRadius: 20, 
                    border: 'none', 
                    background: '#4caf50', 
                    color: '#fff', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  ➕ 新增事件
                </button>
              </div>

              {/* 根據 eventTab 過濾顯示事件卡 */}
              <div style={{ marginBottom: '1em', padding: '1em', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 0.5em 0' }}>當前選擇玩家：<span style={{ color: players[currentPlayer]?.color }}>{players[currentPlayer]?.name}</span></h3>
                <p style={{ margin: 0, color: '#666' }}>點擊其他玩家可以切換選擇</p>
              </div>
              <GameBoard
                players={players}
                cards={(() => {
                  if (eventTab === 'all') return allCards;
                  if (eventTab === 'chain') return allCards.filter(card => card.type === 'chain');
                  if (eventTab === 'single') return allCards.filter(card => card.type === 'single');
                  if (customTabs.includes(eventTab)) return allCards.filter(card => card.customTab === eventTab);
                  return allCards;
                })()}
                onSelectCard={handleSelectCard}
                history={history}
                currentPlayer={currentPlayer}
                onSelectPlayer={setCurrentPlayer}
                onUnselectCard={handleUnselectCard}
                onEditCard={handleEditCard}
                onToggleCustom={handleToggleCustom}
              />
            </div>
          </div>
          {showRoundSummary && tempRoundData && (
            <RoundSummary
              roundData={tempRoundData}
              roundHistory={roundHistory}
              onConfirm={handleConfirmRound}
              onBack={handleBackToRound}
            />
          )}
        </>
      )}
      {showTableSelect && (
        <TableSelectModal
          players={players}
          cards={filteredCards}
          history={history}
          onSelectCard={handleSelectCard}
          onUnselectCard={handleUnselectCard}
          onClose={() => setShowTableSelect(false)}
        />
      )}
      {editingCard !== null && (
        <EventEditor
          card={editingCard}
          onSave={handleSaveCard}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  )
}

export default App
