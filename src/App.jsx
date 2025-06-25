import React, { useState, useEffect, useRef } from "react";
import CharacterSetup from "./CharacterSetup";
import StatusPanel from "./StatusPanel";
import GameBoard from "./GameBoard";
import GameResult from "./GameResult";
import PowerTrendChart from "./PowerTrendChart";
import RoundSummary from "./RoundSummary";
import TableSelectModal from './TableSelectModal';
import EventEditor from './EventEditor';
import DynamicChainFlowChart from './DynamicChainFlowChart';
import SessionManager from './SessionManager';
import { savePreset, loadPreset, listPresets } from './cloudPresetApi';
import { updateSessionData, getSessionData, setAdmin } from './sessionApi';
import { sampleCards } from './sampleCards';
import "./App.css";

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
  const [showFlowChart, setShowFlowChart] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetList, setPresetList] = useState([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [savePresetName, setSavePresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // 會話管理相關狀態
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [sessionSyncInterval, setSessionSyncInterval] = useState(null);
  
  // 事件編輯相關狀態
  const [allCards, setAllCards] = useState(sampleCards);
  const [editingCard, setEditingCard] = useState(null);
  const [customTabs, setCustomTabs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 新增 isMC 狀態，讓用戶選擇自己是 MC 還是玩家
  const [isMC, setIsMC] = useState(null); // null: 未選擇, true: MC, false: 玩家

  // 產生唯一 clientId
  const [clientId] = useState(() => {
    let id = localStorage.getItem('clientId');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem('clientId', id);
    }
    return id;
  });
  const [adminId, setAdminId] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  // 新增 isPendingSync 狀態，handleSelectCard 等本地操作時設為 true。
  const [isPendingSync, setIsPendingSync] = useState(false);
  const [pendingGameData, setPendingGameData] = useState(null);

  // 新增同步失敗提示狀態
  const [syncError, setSyncError] = useState(null);

  // 新增 isJoiningSession 狀態
  const [isJoiningSession, setIsJoiningSession] = useState(false);

  // 新增 localLastUpdate 狀態，記錄本地最後一次操作的 lastUpdate。
  const [localLastUpdate, setLocalLastUpdate] = useState(null);

  // 新增 selection 狀態
  const [saveTip, setSaveTip] = useState('');

  // 新增 mcLostAlerted 狀態，MC 被搶權提示
  const [mcLostAlerted, setMcLostAlerted] = useState(false);

  // 新增 wasMC 狀態，記錄之前係唔係 MC
  const wasMC = useRef(false);

  // 載入preset的callback
  const handleLoadPresetClick = async () => {
    console.log('handleLoadPresetClick called');
    setShowPresetModal(true);
    setLoadingPresets(true);
    const res = await listPresets(); // 請確保已引入listPresets
    console.log('listPresets 回傳：', res);
    setPresetList(res.presets || []);
    setLoadingPresets(false);
  };

  // 確保 allCards 始終是陣列
  const safeAllCards = Array.isArray(allCards) ? allCards : [];

  // 分類事件卡
  const chainCards = safeAllCards.filter(card => card.type === 'chain');
  const singleCards = safeAllCards.filter(card => card.type === 'single');
  const customCards = safeAllCards.filter(card => card.isCustom === true);
  let filteredCards = safeAllCards;
  if (eventTab === 'chain') filteredCards = chainCards;
  else if (eventTab === 'single') filteredCards = singleCards;
  else if (eventTab === 'custom') filteredCards = customCards;

  // 會話管理相關函式
  const handleJoinSession = (sessionId, gameData, adminIdFromServer) => {
    setIsJoiningSession(true);
    let parsedData = gameData;
    if (typeof gameData === 'string') {
      try {
        parsedData = JSON.parse(gameData);
      } catch (e) {
        console.error('JSON parse error:', e, gameData);
        parsedData = {};
      }
    }
    console.log('parsedData.players', parsedData.players);

    setCurrentSessionId(sessionId);
    if (parsedData && Array.isArray(parsedData.players) && parsedData.players.length > 0) {
      setPlayers(parsedData.players);
    } else {
      setPlayers(null);
    }
    if (parsedData && Array.isArray(parsedData.history)) {
      setHistory(parsedData.history);
    }
    if (parsedData && typeof parsedData.currentRound === 'number') {
      setCurrentRound(parsedData.currentRound);
    }
    if (parsedData && Array.isArray(parsedData.roundHistory)) {
      setRoundHistory(parsedData.roundHistory);
    }
    if (parsedData && Array.isArray(parsedData.allCards) && parsedData.allCards.length > 0) {
      setAllCards(parsedData.allCards);
    } else {
      setAllCards(sampleCards);
    }
    if (parsedData && Array.isArray(parsedData.customTabs)) {
      setCustomTabs(parsedData.customTabs);
    }
    if (parsedData && parsedData.lastUpdate) {
      setLastUpdate(parsedData.lastUpdate);
    } else {
      setLastUpdate(new Date().toISOString());
    }
    setAdminId(adminIdFromServer || '');
    setIsJoiningSession(false);
  };

  const handleLeaveSession = () => {
    setCurrentSessionId(null);
  };

  const handleSetupPlayers = () => {
    // 重置遊戲狀態，讓用戶可以設置玩家
    setPlayers(null);
    setHistory([]);
    setCurrentPlayer(0);
    setGameOver(false);
    setRoundHistory([]);
    setCurrentRound(0);
    setShowRoundSummary(false);
    setTempRoundData(null);
    
    // 關閉會話管理頁面，回到玩家設置介面
    setShowSessionManager(false);
  };

  const handleStart = async (playersData) => {
    if (!currentSessionId) return;
    const res = await getSessionData(currentSessionId);
    let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
    const playersWithColor = playersData.map(p => ({ ...p, initialPower: p.power }));
    gameData.players = playersWithColor;
    gameData.history = [];
    gameData.currentRound = 0;
    gameData.gameOver = false;
    gameData.roundHistory = [{
      round: 0,
      playerPowers: playersWithColor.map(p => ({ name: p.name, power: p.power, color: p.color }))
    }];
    gameData.lastUpdate = new Date().toISOString();
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
    setPlayers(playersWithColor);
    setHistory([]);
    setCurrentPlayer(0);
    setGameOver(false);
    setRoundHistory(gameData.roundHistory);
    setCurrentRound(0);
    setShowRoundSummary(false);
    setTempRoundData(null);
  };

  // 新增一個同步到 server 的工具函式
  const syncToServer = (customData) => {
    if (!currentSessionId) return;
    const gameData = {
      players,
      history,
      currentRound,
      gameOver,
      roundHistory,
      allCards,
      customTabs,
      lastUpdate: new Date().toISOString(),
      ...customData // 可覆蓋
    };
    setLastUpdate(gameData.lastUpdate);
    updateSessionData(currentSessionId, JSON.stringify(gameData));
  };

  // handleSelectCard 改為本地即時反應
  const handleSelectCard = (card) => {
    // 直接用現有 players/history 做本地更新
    const playerIdx = card._tableSelectPlayerIdx !== undefined ? card._tableSelectPlayerIdx : currentPlayer;
    const newPlayers = (players || []).map((p, idx) => {
      if (idx !== playerIdx) return p;
      if (card.condition && card.condition.includes('金錢需大於')) {
        const minMoney = parseInt(card.condition.replace(/[^0-9]/g, ''));
        if (p.money <= minMoney) return p;
      }
      return {
        ...p,
        power: Math.round(p.power * card.multiplier)
      };
    });
    const newHistory = [...(history || []), { playerIdx, cardName: card.name, multiplier: card.multiplier, cost: card.cost }];
    const now = new Date().toISOString();
    const newGameData = {
      players: newPlayers,
      history: newHistory,
      currentRound,
      gameOver,
      roundHistory,
      allCards,
      customTabs,
      lastUpdate: now
    };
    setLocalLastUpdate(now);
    setPlayers(newPlayers);
    setHistory(newHistory);
    setLastUpdate(now);
    setPendingGameData(newGameData);
    setIsPendingSync(true);
  };

  // handleUnselectCard 改為本地即時反應
  const handleUnselectCard = (playerIdx, cardName) => {
    const card = (allCards || []).find(c => c.name === cardName);
    if (!card) return;
    const newPlayers = (players || []).map((p, idx) => {
      if (idx !== playerIdx) return p;
      return {
        ...p,
        power: Math.round(p.power / (card.multiplier || 1)),
      };
    });
    // 移除最後一個該玩家該卡的歷史紀錄
    let newHistory = history;
    if (Array.isArray(history)) {
      const idx = history.map((h, i) => h.playerIdx === playerIdx && h.cardName === cardName ? i : -1).filter(i => i !== -1).pop();
      if (idx !== undefined) {
        newHistory = [...history.slice(0, idx), ...history.slice(idx + 1)];
      }
    }
    const now = new Date().toISOString();
    const newGameData = {
      players: newPlayers,
      history: newHistory,
      currentRound,
      gameOver,
      roundHistory,
      allCards,
      customTabs,
      lastUpdate: now
    };
    setLocalLastUpdate(now);
    setPlayers(newPlayers);
    setHistory(newHistory);
    setLastUpdate(now);
    setPendingGameData(newGameData);
    setIsPendingSync(true);
  };

  const handleEndRound = () => {
    updateLocalAndSync(() => {
    const currentRoundData = {
      round: currentRound,
      playerPowers: players.map(p => ({ name: p.name, power: p.power, color: p.color }))
    };
    setTempRoundData(currentRoundData);
    setShowRoundSummary(true);
    });
    // 不同步，等確認回合才同步
  };

  const handleConfirmRound = async () => {
    if (!currentSessionId) return;
    const res = await getSessionData(currentSessionId);
    let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
    if (tempRoundData) {
      gameData.roundHistory = [...(gameData.roundHistory || []), tempRoundData];
      gameData.currentRound = (gameData.currentRound || 0) + 1;
      gameData.lastUpdate = new Date().toISOString();
      await updateSessionData(currentSessionId, JSON.stringify(gameData));
      setLastUpdate(gameData.lastUpdate);
      setRoundHistory(gameData.roundHistory);
      setCurrentRound(gameData.currentRound);
      setShowRoundSummary(false);
      setTempRoundData(null);
    }
  };

  const handleBackToRound = () => {
    updateLocalAndSync(() => {
    setShowRoundSummary(false);
    setTempRoundData(null);
    });
    // 不同步
  };

  const handleGameOver = async () => {
    if (!currentSessionId) return;
    const res = await getSessionData(currentSessionId);
    let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
    gameData.gameOver = true;
    gameData.lastUpdate = new Date().toISOString();
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
    setGameOver(true);
  };

  // 事件編輯相關處理函數
  const handleEditCard = (card) => {
    setEditingCard(card);
  };

  const handleSaveCard = async (cardData) => {
    if (!currentSessionId) return;
    const res = await getSessionData(currentSessionId);
    let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
    if (cardData.customTab && !gameData.customTabs?.includes(cardData.customTab)) {
      gameData.customTabs = [...(gameData.customTabs || []), cardData.customTab];
    }
    const isEditing = (gameData.allCards || []).some(c => c.id === cardData.id);
    if (isEditing) {
      gameData.allCards = (gameData.allCards || []).map(c => c.id === cardData.id ? cardData : c);
    } else {
      gameData.allCards = [...(gameData.allCards || []), cardData];
    }
    gameData.lastUpdate = new Date().toISOString();
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
    setAllCards(gameData.allCards);
    setCustomTabs(gameData.customTabs);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId) => {
    if (!currentSessionId) return;
    const res = await getSessionData(currentSessionId);
    let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
    gameData.allCards = (gameData.allCards || []).filter(c => c.id !== cardId);
    gameData.lastUpdate = new Date().toISOString();
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
    setAllCards(gameData.allCards);
    setEditingCard(null);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
  };

  const handleAddNewCard = () => {
    setEditingCard({});
  };

  // 處理自訂標記
  const handleToggleCustom = async (card) => {
    if (!currentSessionId) return;
    const res = await getSessionData(currentSessionId);
    let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
    gameData.allCards = (gameData.allCards || []).map(c => c.id === card.id ? { ...c, isCustom: !c.isCustom } : c);
    gameData.lastUpdate = new Date().toISOString();
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
    setAllCards(gameData.allCards);
  };

  // 每次本地有變動時都要 setLastUpdate
  const updateLocalAndSync = (updateFn) => {
    updateFn();
    setLastUpdate(new Date().toISOString());
  };

  // useEffect 控制同步（所有人都自動拉 server）
  useEffect(() => {
    if (!currentSessionId) return;
    let retryCount = 0;
    let retryTimer = null;
    const sync = async () => {
      // 只有 MC 先 push
      if (isPendingSync && pendingGameData && adminId === clientId) {
        try {
          await updateSessionData(currentSessionId, JSON.stringify(pendingGameData));
          setIsPendingSync(false);
          setSyncError(null);
          retryCount = 0;
        } catch (e) {
          setSyncError('同步失敗，將自動重試...');
          retryCount++;
          if (retryCount < 5) {
            retryTimer = setTimeout(sync, 2000 * retryCount);
          }
          return;
        }
        return;
      }
      // 任何人都要拉 server 最新資料
      const res = await getSessionData(currentSessionId);
      if (res.status === 'success' && res.lastUpdate) {
        if (!lastUpdate || new Date(res.lastUpdate) > new Date(lastUpdate)) {
          let gameData = res.gameData;
          if (typeof gameData === 'string') {
            try {
              gameData = JSON.parse(gameData);
            } catch (e) {
              gameData = {};
            }
          }
          if (!localLastUpdate || new Date(res.lastUpdate) >= new Date(localLastUpdate)) {
            if (Array.isArray(gameData.players) && gameData.players.length > 0) {
              setPlayers(gameData.players);
            }
            if (Array.isArray(gameData.history)) {
              setHistory(gameData.history);
            }
            if (typeof gameData.currentRound === 'number') {
              setCurrentRound(gameData.currentRound);
            }
            if (Array.isArray(gameData.roundHistory)) {
              setRoundHistory(gameData.roundHistory);
            }
            if (Array.isArray(gameData.allCards) && gameData.allCards.length > 0) {
              setAllCards(gameData.allCards);
            }
            if (Array.isArray(gameData.customTabs)) {
              setCustomTabs(gameData.customTabs);
            }
            setLastUpdate(res.lastUpdate);
            setAdminId(res.adminId || '');
            setPendingGameData(null);
            setLocalLastUpdate(null);
            setSelection(null);
          }
          setSyncError(null);
        } else if (res.status === 'error') {
          setSyncError('無法取得伺服器資料，請檢查網路。');
        }
      }
    };
    const interval = setInterval(sync, 4000);
    return () => {
      clearInterval(interval);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [currentSessionId, lastUpdate, isPendingSync, pendingGameData, adminId, clientId, localLastUpdate]);

  // MC 被搶權時彈窗提示（只有原本係 MC 變觀戰者時先彈，且 showAdminModal 開啟時唔彈）
  useEffect(() => {
    if (adminId === clientId) {
      wasMC.current = true;
    }
    if (wasMC.current && adminId && clientId && adminId !== clientId && !mcLostAlerted && !showAdminModal) {
      alert('你已失去管理權，現在只可觀戰。');
      setMcLostAlerted(true);
      wasMC.current = false;
    }
    if (adminId === clientId && mcLostAlerted) {
      setMcLostAlerted(false);
    }
  }, [adminId, clientId, mcLostAlerted, showAdminModal]);

  // 只有 adminId === clientId 才能操作
  const isCurrentMC = adminId && adminId === clientId;

  // 搶權 UI
  const handleAdminLogin = async () => {
    setAdminError('');
    console.log('login start', currentSessionId, clientId, adminPasswordInput);
    try {
      const res = await setAdmin(currentSessionId, clientId, adminPasswordInput);
      console.log('setAdmin response', res);
      if (res.status === 'success') {
        setShowAdminModal(false);
        setAdminPasswordInput('');
        setAdminId(clientId);
        // 強制拉 server 最新 adminId，減少雙 MC 真空期
        const sessionRes = await getSessionData(currentSessionId);
        if (sessionRes && sessionRes.adminId) {
          setAdminId(sessionRes.adminId);
        }
      } else {
        setAdminError(res.message || '密碼錯誤');
      }
    } catch (e) {
      setAdminError('API 連線失敗');
      console.error('setAdmin error', e);
    }
  };

  // 手動儲存 function
  const handleManualSave = async () => {
    if (!pendingGameData || !currentSessionId) return;
    try {
      await updateSessionData(currentSessionId, JSON.stringify(pendingGameData));
      setIsPendingSync(false);
      setPendingGameData(null);
      setSaveTip('儲存完成');
      setTimeout(() => setSaveTip(''), 2000);
    } catch (e) {
      setSaveTip('儲存失敗，請重試');
      setTimeout(() => setSaveTip(''), 2000);
    }
  };

  // UI 顯示同步中/同步失敗提示
  {isPendingSync && (
    <div style={{position:'fixed',bottom:64,left:'50%',transform:'translateX(-50%)',background:'#fffbe6',border:'1px solid #ffe082',borderRadius:8,padding:'12px 32px',zIndex:9999,color:'#b71c1c',fontWeight:600,fontSize:18,boxShadow:'0 2px 8px #ffe08288'}}>
      儲存中，請勿關閉或離開本頁...
    </div>
  )}
  {syncError && (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'#ffebee',border:'1px solid #f44336',borderRadius:8,padding:'12px 32px',zIndex:9999,color:'#b71c1c',fontWeight:600,fontSize:18,boxShadow:'0 2px 8px #f4433688'}}>
      {syncError}
    </div>
  )}

  // 新增 getDisplayGameData
  const getDisplayGameData = () => {
    // 只要 server 的 lastUpdate < localLastUpdate，就用 pendingGameData
    if (localLastUpdate && (!lastUpdate || new Date(lastUpdate) < new Date(localLastUpdate))) {
      return pendingGameData || {
        players, history, currentRound, gameOver, roundHistory, allCards, customTabs
      };
    }
    return { players, history, currentRound, gameOver, roundHistory, allCards, customTabs };
  };

  // App render 區，所有 UI 都用 getDisplayGameData() 取得資料
  const displayData = getDisplayGameData();

  // 查看排名功能，觀戰者用
  const handleViewRanking = () => {
    const lastRound = displayData.roundHistory?.[displayData.roundHistory.length - 1];
    if (lastRound) {
      setTempRoundData(lastRound);
      setShowRoundSummary(true);
    }
  };

  return (
    <div className="App">
      {/* debug log */}
      {console.log('App render players:', displayData.players)}
      {/* 身分顯示 */}
      <div style={{position:'fixed',top:8,right:8,zIndex:9999}}>
        {isCurrentMC
          ? <span style={{color:'#388e3c',fontWeight:600}}>你是管理者（MC）</span>
          : <span style={{color:'#1976d2',fontWeight:600}}>你是觀戰者</span>
        }
      </div>
      {/* 儲存提示 */}
      {saveTip && (
        <div style={{position:'fixed',top:48,right:8,zIndex:9999,background:'#e3fbe3',color:'#388e3c',padding:'8px 18px',borderRadius:8,fontWeight:600,boxShadow:'0 2px 8px #388e3c22'}}>
          {saveTip}
        </div>
      )}
      {/* 手動儲存按鈕（只給 MC 顯示） */}
      {isCurrentMC && pendingGameData && (
        <button onClick={handleManualSave} style={{position:'fixed',top:90,right:8,zIndex:9999,background:'#1976d2',color:'#fff',padding:'8px 18px',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 8px #1976d222'}}>💾 儲存</button>
      )}
      {isJoiningSession && (
        <div style={{padding: 48, textAlign: 'center', fontSize: 22}}>載入中...</div>
      )}
      <h1>人生 RPG 遊戲</h1>
      
      {/* 會話管理按鈕 */}
      <div style={{ position: 'absolute', left: 24, top: 24, zIndex: 10 }}>
        <button
          onClick={() => setShowSessionManager(!showSessionManager)}
          style={{
            padding: '8px 16px',
            background: currentSessionId ? '#4caf50' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {currentSessionId ? `會話: ${currentSessionId}` : '會話管理'}
        </button>
      </div>

      {showSessionManager ? (
        <SessionManager
          onJoinSession={handleJoinSession}
          currentSessionId={currentSessionId}
          onLeaveSession={handleLeaveSession}
          onSetupPlayers={handleSetupPlayers}
          onClose={() => setShowSessionManager(false)}
        />
      ) : !displayData.players ? (
        <>
          <CharacterSetup onStart={handleStart} onLoadPreset={handleLoadPresetClick} />
          {showPresetModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
                <button onClick={() => setShowPresetModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="關閉">✖️</button>
                <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1976d2' }}>選擇預設設定</h3>
                {loadingPresets ? (
                  <div>載入中...</div>
                ) : (
                  <>
                    {console.log('presetList in render:', presetList)}
                    {presetList.length === 0 ? (
                      <div style={{color:'#888',textAlign:'center',margin:'16px 0'}}>沒有可用的預設</div>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {presetList.map(presetId => (
                          <li key={presetId} style={{ marginBottom: 8 }}>
                            <button onClick={async () => {
                              setShowPresetModal(false);
                              const res = await loadPreset(presetId); // 請確保已引入loadPreset
                              console.log('loadPreset 回傳：', res);
                              if (res.status === 'success') {
                                // 確保 events 是陣列
                                const events = Array.isArray(res.data.events) ? res.data.events : [];
                                const tabs = Array.isArray(res.data.tabs) ? res.data.tabs : [];
                                console.log('解析後的 events:', events);
                                console.log('解析後的 tabs:', tabs);
                                setAllCards(events);
                                setCustomTabs(tabs);
                              } else {
                                alert('載入失敗：' + (res.message || '未知錯誤'));
                              }
                            }}
                            style={{ padding: '6px 18px', borderRadius: 8, border: '1px solid #1976d2', background: '#f3e5f5', color: '#1976d2', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                              {presetId}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : gameOver ? (
        <GameResult players={displayData.players} onRestart={() => setPlayers(null)} />
      ) : (
        <>
          <div style={{ position: 'absolute', right: 24, top: 24, zIndex: 10, display: 'flex', gap: '1em' }}>
            {isCurrentMC ? (
              <>
                <button onClick={handleEndRound} style={{padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>結束回合</button>
                <button onClick={handleGameOver} style={{padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>結束遊戲</button>
              </>
            ) : (
              <button onClick={handleViewRanking} style={{padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600}}>查看排名</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '2em', padding: '1em' }}>
            <StatusPanel 
              players={displayData.players} 
              history={displayData.history} 
              currentPlayer={currentPlayer} 
              onSelectPlayer={setCurrentPlayer} 
              onUnselectCard={isCurrentMC ? handleUnselectCard : undefined}
              isCurrentMC={isCurrentMC}
            />
            <div style={{ flex: 1 }}>
              {/* 當前選擇玩家區塊，只有 MC 顯示 */}
              {isCurrentMC && (
                <div style={{ marginBottom: 12, padding: '1em', background: '#f5f5f5', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 0.5em 0' }}>當前選擇玩家：<span style={{ color: displayData.players[currentPlayer]?.color }}>{displayData.players[currentPlayer]?.name}</span></h3>
                  <p style={{ margin: 0, color: '#666' }}>點擊其他玩家可以切換選擇</p>
                </div>
              )}
              {/* 事件卡分類標籤（所有人都可以切換） */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                  <button onClick={() => setEventTab('all')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: eventTab === 'all' ? '#1976d2' : '#e3eafc', color: eventTab === 'all' ? '#fff' : '#1976d2', fontWeight: 600, cursor: 'pointer' }}>全部</button>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button onClick={() => setEventTab('chain')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: eventTab === 'chain' ? '#1976d2' : '#e3eafc', color: eventTab === 'chain' ? '#fff' : '#1976d2', fontWeight: 600, cursor: 'pointer' }}>連續事件</button>
                  </div>
                  <button onClick={() => setEventTab('single')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: eventTab === 'single' ? '#1976d2' : '#e3eafc', color: eventTab === 'single' ? '#fff' : '#1976d2', fontWeight: 600, cursor: 'pointer' }}>非連續事件</button>
                  <button onClick={() => setEventTab('special')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: eventTab === 'special' ? '#8e24aa' : '#f3e5f5', color: eventTab === 'special' ? '#fff' : '#8e24aa', fontWeight: 600, cursor: 'pointer' }}>所有特別事件</button>
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
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  {isCurrentMC && (
                    <>
                      <button onClick={handleAddNewCard} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: '#4caf50', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>➕ 新增事件</button>
                      <button
                        onClick={() => setShowMenu(v => !v)}
                        style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: '#eee', color: '#333', fontWeight: 600, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
                        title="更多功能"
                      >
                        &#8942;
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* 選擇人生事件卡標題與流程圖連結，移到tab bar下方 */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ margin: 0 }}>選擇人生事件卡</h2>
                {eventTab === 'chain' && (
                  <a
                    href="#"
                    onClick={e => { e.preventDefault(); setShowFlowChart(true); }}
                    style={{ marginLeft: 12, color: '#1976d2', textDecoration: 'underline', fontSize: 15, cursor: 'pointer' }}
                  >
                    升學路徑流程圖
                  </a>
                )}
              </div>

              {/* 根據 eventTab 過濾顯示事件卡 */}
              <GameBoard
                players={displayData.players}
                cards={filteredCards}
                onSelectCard={isCurrentMC ? handleSelectCard : undefined}
                history={displayData.history}
                currentPlayer={currentPlayer}
                onSelectPlayer={isCurrentMC ? setCurrentPlayer : undefined}
                onUnselectCard={isCurrentMC ? handleUnselectCard : undefined}
                onEditCard={isCurrentMC ? handleEditCard : undefined}
                onToggleCustom={isCurrentMC ? handleToggleCustom : undefined}
                isCurrentMC={isCurrentMC}
              />
            </div>
          </div>
          {showRoundSummary && tempRoundData && (
            <RoundSummary
              roundData={tempRoundData}
              roundHistory={displayData.roundHistory}
              onConfirm={handleConfirmRound}
              onBack={handleBackToRound}
              isCurrentMC={isCurrentMC}
            />
          )}
        </>
      )}
      {/* 預設選擇 modal - 在遊戲進行頁面也顯示 */}
      {showPresetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
            <button onClick={() => setShowPresetModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="關閉">✖️</button>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1976d2' }}>選擇預設設定</h3>
            {loadingPresets ? (
              <div>載入中...</div>
            ) : (
              <>
                {console.log('presetList in render:', presetList)}
                {presetList.length === 0 ? (
                  <div style={{color:'#888',textAlign:'center',margin:'16px 0'}}>沒有可用的預設</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {presetList.map(presetId => (
                      <li key={presetId} style={{ marginBottom: 8 }}>
                        <button onClick={async () => {
                          setShowPresetModal(false);
                          const res = await loadPreset(presetId); // 請確保已引入loadPreset
                          console.log('loadPreset 回傳：', res);
                          if (res.status === 'success') {
                            // 確保 events 是陣列
                            const events = Array.isArray(res.data.events) ? res.data.events : [];
                            const tabs = Array.isArray(res.data.tabs) ? res.data.tabs : [];
                            console.log('解析後的 events:', events);
                            console.log('解析後的 tabs:', tabs);
                            setAllCards(events);
                            setCustomTabs(tabs);
                          } else {
                            alert('載入失敗：' + (res.message || '未知錯誤'));
                          }
                        }}
                        style={{ padding: '6px 18px', borderRadius: 8, border: '1px solid #1976d2', background: '#f3e5f5', color: '#1976d2', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                          {presetId}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {showTableSelect && isCurrentMC && (
        <TableSelectModal
          players={displayData.players}
          cards={filteredCards}
          history={displayData.history}
          onSelectCard={isCurrentMC ? handleSelectCard : undefined}
          onUnselectCard={isCurrentMC ? handleUnselectCard : undefined}
          onClose={() => setShowTableSelect(false)}
          isCurrentMC={isCurrentMC}
        />
      )}
      {editingCard !== null && isCurrentMC && (
        <EventEditor
          card={editingCard}
          onSave={handleSaveCard}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteCard}
          isCurrentMC={isCurrentMC}
        />
      )}
      {showFlowChart && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 24px #0002', position: 'relative' }}>
            <button onClick={() => setShowFlowChart(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="關閉">✖️</button>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1976d2' }}>升學路徑流程圖</h3>
            <DynamicChainFlowChart chainCards={displayData.allCards.filter(card => card.type === 'chain')} />
          </div>
        </div>
      )}
      {/* 儲存預設modal */}
      {showSavePresetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
            <button onClick={() => setShowSavePresetModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="關閉">✖️</button>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1976d2' }}>儲存預設</h3>
            <input
              type="text"
              value={savePresetName}
              onChange={e => setSavePresetName(e.target.value)}
              placeholder="請輸入預設名稱"
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 15, marginBottom: 16 }}
            />
            <button
              onClick={async () => {
                if (!savePresetName.trim()) return alert('請輸入預設名稱');
                setSavingPreset(true);
                const res = await savePreset(savePresetName.trim(), { tabs: customTabs, events: displayData.allCards });
                setSavingPreset(false);
                if (res.status === 'success') {
                  alert('儲存成功！');
                  setShowSavePresetModal(false);
                  setSavePresetName("");
                } else {
                  alert('儲存失敗：' + (res.message || '未知錯誤'));
                }
              }}
              style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer', width: '100%' }}
              disabled={savingPreset}
            >
              {savingPreset ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      )}
      {!isCurrentMC && currentSessionId && (
        <div style={{padding: 24, background: '#fffbe6', border: '1px solid #ffe082', borderRadius: 8, margin: '24px 0', textAlign: 'center'}}>
          <div style={{fontWeight: 600, marginBottom: 8}}>你不是管理者，無法操作遊戲。</div>
          <button onClick={() => setShowAdminModal(true)} style={{padding: '6px 18px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer'}}>輸入管理密碼搶下管理權</button>
        </div>
      )}
      {showAdminModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: '#fff', borderRadius: 12, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px #0002', position: 'relative'}}>
            <button onClick={() => setShowAdminModal(false)} style={{position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer'}} title="關閉">✖️</button>
            <h3 style={{marginTop: 0, marginBottom: 16, color: '#1976d2'}}>管理者登入</h3>
            <input type="password" value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} placeholder="請輸入管理密碼" style={{width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 15, marginBottom: 16}} />
            {adminError && <div style={{color: 'red', marginBottom: 8}}>{adminError}</div>}
            <button onClick={handleAdminLogin} style={{padding: '8px 24px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer', width: '100%'}}>登入</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
