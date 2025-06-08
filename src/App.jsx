import { useState } from 'react'
import CharacterSetup from './CharacterSetup'
import GameBoard from './GameBoard'
import GameResult from './GameResult'
import './App.css'

const sampleCards = [
  // 小學
  { name: '名牌小學', cost: 500, multiplier: 1.4, group: '小學', condition: '父或母為專業生優先' },
  { name: '一般小學', cost: 500, multiplier: 1.3, group: '小學' },
  // 中學
  { name: '名牌中學', cost: 500, multiplier: 1.4, group: '中學', condition: '須小學畢業、名牌小學畢業生優先' },
  { name: '一般中學', cost: 500, multiplier: 1.3, group: '中學', condition: '須小學畢業' },
  // 大學
  { name: '資助大學學士', cost: 500, multiplier: 2.0, group: '大學', condition: '須文憑試合格' },
  { name: '是旦福大學學士', cost: 3000, multiplier: 2.2, group: '大學', condition: '須文憑試合格或「捐款」或有海外交流經驗' },
  { name: "Half,Yellow, 惡忠怨、廢煙理工、Don't傾大學學士", cost: 2000, multiplier: 2.2, group: '大學', condition: '父或母有海外護照，文憑試不合格，預備班學費2000' },
  // 補習
  { name: '明愛補習社', cost: 1000, multiplier: 1.4, group: '補習', condition: '考試後，海關有可能會隨機抽查一人查問' },
  { name: '明愛補習社優質內部影片流出', cost: 200, multiplier: 1.4, group: '補習', condition: '如發現非法下載，留案底' },
  // 電腦/寬頻/手機電話
  { name: '電腦/寬頻/手機電話', cost: 1000, multiplier: 1.4, group: '設備' },
  { name: '流動數據', cost: 500, multiplier: 1.2, group: '設備' },
  // 課外活動
  { name: '體育', cost: 0, multiplier: 1.1, group: '課外活動', condition: '每人最多只可參加2項，請說明內容' },
  { name: '藝術', cost: 0, multiplier: 1.1, group: '課外活動', condition: '每人最多只可參加2項，請說明內容' },
  { name: '學術', cost: 0, multiplier: 1.1, group: '課外活動', condition: '每人最多只可參加2項，請說明內容' },
  { name: '社會運動', cost: 0, multiplier: 1.1, group: '課外活動', condition: '每人最多只可參加2項，請說明內容' },
  { name: '義工服務', cost: 0, multiplier: 1.1, group: '課外活動', condition: '每人最多只可參加2項，請說明內容' },
  // 海外交換生計劃
  { name: '海外交換生計劃', cost: 2000, multiplier: 2.0, group: '海外交換', condition: '必須申報學歷，戰鬥力達250，名額2名，先到先得' },
  // 機會
  { name: '擂台賽（男）', cost: 0, multiplier: 1.1, group: '機會', condition: '免費配額1個，30秒30下，每人限試一次' },
  { name: 'Sit-up（女）', cost: 0, multiplier: 1.2, group: '機會', condition: '免費配額1個，30秒10下，每人限試兩次' },
  // 中學文憑試
  { name: '中學文憑試', cost: 500, multiplier: 1.1, group: '中學文憑試', condition: '須中學畢業，於30分鐘後執行，請交考試費及領取推薦證' },
];

function App() {
  const [players, setPlayers] = useState(null)
  const [history, setHistory] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const handleStart = (playersData) => {
    setPlayers(playersData.map(p => ({ ...p, initialPower: p.power })));
    setHistory([])
    setCurrentPlayer(0)
    setGameOver(false)
  }

  const handleSelectCard = (card) => {
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== currentPlayer) return p
      if (card.condition && card.condition.includes('金錢需大於')) {
        const minMoney = parseInt(card.condition.replace(/[^0-9]/g, ''))
        if (p.money <= minMoney) return p
      }
      return {
        ...p,
        money: p.money - card.cost,
        power: Math.round(p.power * card.multiplier)
      }
    }))
    setHistory(prev => [
      ...prev,
      { playerIdx: currentPlayer, cardName: card.name, multiplier: card.multiplier, cost: card.cost }
    ])
  }

  // 取消選擇卡牌
  const handleUnselectCard = (playerIdx, cardName) => {
    const card = sampleCards.find(c => c.name === cardName);
    if (!card) return;
    setPlayers(prev => prev.map((p, idx) => {
      if (idx !== playerIdx) return p;
      return {
        ...p,
        money: p.money + (card.cost || 0),
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
  const handleRestart = () => setPlayers(null)

  if (!players) {
    return <CharacterSetup onStart={handleStart} />
  }

  if (gameOver) {
    return <GameResult players={players} onRestart={handleRestart} />
  }

  return (
    <div className="App">
      <h1>人生 RPG 遊戲</h1>
      <button onClick={handleGameOver} style={{ position: 'absolute', right: 24, top: 24, zIndex: 10 }}>結束遊戲</button>
      <GameBoard
        players={players}
        cards={sampleCards}
        onSelectCard={handleSelectCard}
        history={history}
        currentPlayer={currentPlayer}
        onSelectPlayer={setCurrentPlayer}
        onUnselectCard={handleUnselectCard}
      />
    </div>
  )
}

export default App
