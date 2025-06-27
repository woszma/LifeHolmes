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
import { updateSessionData, getSessionData, setAdmin, createSession } from './sessionApi';
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

  // 新增自定義確認對話框狀態
  const [showPresetConfirmModal, setShowPresetConfirmModal] = useState(false);
  const [pendingPresetData, setPendingPresetData] = useState(null);
  const [pendingPresetId, setPendingPresetId] = useState('');

  // 頁面載入時清理 localStorage 中的 pendingSessionName
  useEffect(() => {
    const pendingSessionName = localStorage.getItem('pendingSessionName');
    if (pendingSessionName && !currentSessionId) {
      console.log('頁面載入時發現 pendingSessionName，但沒有 currentSessionId，清理 localStorage');
      localStorage.removeItem('pendingSessionName');
    }
  }, [currentSessionId]);

  // 處理觀看者網址
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewerSessionId = urlParams.get('viewer');
    
    console.log('檢查觀看者網址:', { 
      urlParams: window.location.search, 
      viewerSessionId, 
      currentSessionId 
    });
    
    if (viewerSessionId && !currentSessionId) {
      console.log('檢測到觀看者網址，sessionId:', viewerSessionId);
      
      // 自動加入觀看者模式
      const joinAsViewer = async () => {
        try {
          console.log('開始獲取會話數據:', viewerSessionId);
          const result = await getSessionData(viewerSessionId);
          console.log('getSessionData 結果:', result);
          
          if (result.status === 'success') {
            console.log('觀看者模式加入成功');
            // 觀看者模式：傳入 null 作為 adminIdFromServer，確保不會被設為管理者
            handleJoinSession(viewerSessionId, result.gameData, null);
          } else {
            console.error('觀看者模式加入失敗:', result.message);
            alert('無法加入會話: ' + result.message);
          }
        } catch (error) {
          console.error('觀看者模式加入錯誤:', error);
          alert('加入會話時發生錯誤');
        }
      };
      
      joinAsViewer();
    }
  }, [currentSessionId]);

  // 載入preset的callback
  const handleLoadPresetClick = async () => {
    console.log('handleLoadPresetClick called');
    setShowPresetModal(true);
    setLoadingPresets(true);
    try {
      const res = await listPresets();
    console.log('listPresets 回傳：', res);
    setPresetList(res.presets || []);
    } catch (error) {
      console.error('handleLoadPresetClick 錯誤:', error);
    } finally {
    setLoadingPresets(false);
    }
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
  else if (eventTab === 'special') {
    // 顯示所有 isCustom 為 true 嘅事件
    filteredCards = safeAllCards.filter(card => card.isCustom === true);
  } else if (customTabs.includes(eventTab)) {
    // 只顯示 isCustom 為 true 且 customTab 等於該 tab
    filteredCards = safeAllCards.filter(card => card.isCustom === true && card.customTab === eventTab);
  }

  // 會話管理相關函式
  const handleJoinSession = (sessionId, gameData, adminIdFromServer) => {
    console.log('handleJoinSession 被呼叫:', { sessionId, gameData: gameData ? '有數據' : '無數據', adminIdFromServer });
    setIsJoiningSession(true);
    
    // 如果是創建新會話（gameData為null），重置遊戲狀態但不設定會話ID
    if (!gameData) {
      console.log('創建新會話流程，重置遊戲狀態');
      setCurrentSessionId(null); // 確保會話ID為null，讓handleStart來設定
      setPlayers(null);
      setHistory([]);
      setCurrentPlayer(0);
      setGameOver(false);
      setRoundHistory([]);
      setCurrentRound(0);
      setShowRoundSummary(false);
      setTempRoundData(null);
      setAdminId(''); // 重置Admin狀態
      setAllCards(sampleCards);
      setCustomTabs([]);
      setLastUpdate(new Date().toISOString());
      setIsJoiningSession(false);
      
      // 關閉 SessionManager，讓 CharacterSetup 顯示
      setShowSessionManager(false);
      console.log('已關閉 SessionManager，應該顯示 CharacterSetup');
      return;
    }
    
    // 處理加入現有會話的情況
    console.log('加入現有會話流程');
    setCurrentSessionId(sessionId);
    
    let parsedData = gameData;
    if (typeof gameData === 'string') {
      try {
        parsedData = JSON.parse(gameData);
      } catch (e) {
        console.error('JSON parse error:', e, gameData);
        parsedData = {};
      }
    }
    
    // 遷移歷史記錄：為沒有 cardId 的記錄添加 cardId
    if (Array.isArray(parsedData.history)) {
      parsedData.history = parsedData.history.map(h => {
        if (!h.cardId && h.cardName) {
          // 嘗試根據 cardName 找到對應的卡片 ID
          const allCards = parsedData.allCards || sampleCards;
          const card = allCards.find(c => c.name === h.cardName);
          return {
            ...h,
            cardId: card ? card.id : `legacy_${h.cardName}_${Date.now()}`
          };
        }
        return h;
      });
    }
    
    console.log('parsedData.players', parsedData.players);

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
      setAllCards(dedupeEvents(parsedData.allCards));
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
    setAdminId(adminIdFromServer !== null ? adminIdFromServer : '');
    setIsJoiningSession(false);
  };

  const handleLeaveSession = () => {
    setCurrentSessionId(null);
    // 清除待建立的會話名稱
    localStorage.removeItem('pendingSessionName');
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
    setAdminId(''); // 重置Admin狀態
    setCurrentSessionId(null); // 重置會話ID
    
    // 清除待建立的會話名稱
    localStorage.removeItem('pendingSessionName');
    
    // 關閉會話管理頁面，回到玩家設置介面
    setShowSessionManager(false);
  };

  const handleStart = async (playersData, adminPassword) => {
    console.log('=== handleStart 開始 ===');
    console.log('傳入參數:', { playersData: playersData?.length, adminPassword: adminPassword ? '有密碼' : '無密碼' });
    
    // 檢查玩家數據
    if (!playersData || playersData.length === 0) {
      console.error('沒有玩家數據，無法開始遊戲');
      alert('請先添加玩家數據');
      return;
    }
    
    // 檢查是否有待建立的會話
    const pendingSessionName = localStorage.getItem('pendingSessionName');
    console.log('待建立的會話名稱:', pendingSessionName);
    
    if (pendingSessionName) {
      // 建立新會話
      console.log('準備建立新會話:', { pendingSessionName, adminPassword });
      try {
        const createResult = await createSession(pendingSessionName, adminPassword);
        console.log('createSession 完整結果:', createResult);
        
        if (createResult.status === 'success') {
          console.log('會話建立成功，sessionId:', createResult.sessionId);
          setCurrentSessionId(createResult.sessionId);
          localStorage.removeItem('pendingSessionName'); // 清除待建立的會話名稱
          console.log('已清除待建立的會話名稱');
          
          // 使用新建立的 sessionId 繼續執行
          const newSessionId = createResult.sessionId;
          console.log('開始獲取會話數據，sessionId:', newSessionId);
          const res = await getSessionData(newSessionId);
          console.log('getSessionData 結果:', res);
          
          let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
          const playersWithColor = playersData.map(p => ({ ...p, initialPower: p.power }));
          
          // 設定遊戲數據，包含載入的預設事件
          gameData.players = playersWithColor;
          gameData.history = [];
          gameData.currentRound = 0;
          gameData.gameOver = false;
          gameData.roundHistory = [{
            round: 0,
            playerPowers: playersWithColor.map(p => ({ name: p.name, power: p.power, color: p.color }))
          }];
          
          // 包含載入的預設事件和自訂標籤
          if (allCards && allCards.length > 0) {
            gameData.allCards = allCards;
          }
          if (customTabs && customTabs.length > 0) {
            gameData.customTabs = customTabs;
          }
          
          // 保存Admin密碼到遊戲數據中
          if (adminPassword) {
            gameData.adminPassword = adminPassword;
            console.log('已將密碼保存到遊戲數據中');
          }
          
          gameData.lastUpdate = new Date().toISOString();
          
          // 先同步到伺服器（這會更新ADMIN_PASSWORD欄位）
          console.log('準備同步遊戲數據到伺服器');
          console.log('updateSessionData 傳送內容:', JSON.stringify(gameData));
          await updateSessionData(newSessionId, JSON.stringify(gameData));
          console.log('遊戲數據已保存到伺服器');
          
          // 等待一下確保數據已更新
          console.log('等待 1 秒確保數據更新...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 設定本地狀態
          setLastUpdate(gameData.lastUpdate);
          setPlayers(playersWithColor);
          setHistory([]);
          setCurrentPlayer(0);
          setGameOver(false);
          setRoundHistory(gameData.roundHistory);
          setCurrentRound(0);
          setShowRoundSummary(false);
          setTempRoundData(null);
          
          // 自動成為 Admin（只有建立新會話時才自動設定）
          if (adminPassword) {
            setAdminId(clientId);
            console.log('遊戲開始，自動成為 Admin，clientId:', clientId);
          }
          
          // 調用 setAdmin API 設定管理者，使用保存的密碼
          if (adminPassword) {
            try {
              console.log('準備調用 setAdmin API:', { newSessionId, clientId, adminPassword });
              const adminResult = await setAdmin(newSessionId, clientId, adminPassword);
              console.log('setAdmin 完整結果:', adminResult);
              
              if (adminResult.status === 'success') {
                console.log('setAdmin 成功，現在重新獲取會話數據確認');
                // 重新獲取會話數據確認 adminId 是否正確設定
                const sessionRes = await getSessionData(newSessionId);
                console.log('重新獲取的會話數據:', sessionRes);
                if (sessionRes.status === 'success' && sessionRes.adminId) {
                  setAdminId(sessionRes.adminId);
                  console.log('已更新 adminId 為:', sessionRes.adminId);
                }
              } else {
                console.error('設定管理者失敗:', adminResult.message);
              }
            } catch (error) {
              console.error('設定管理者時發生錯誤:', error);
            }
          } else {
            console.log('沒有提供 adminPassword，跳過 setAdmin API 調用');
          }
          
          console.log('=== handleStart 完成 ===');
          return; // 提前結束，避免執行後面的程式碼
        } else {
          console.error('建立會話失敗:', createResult.message);
          alert('建立會話失敗: ' + createResult.message);
          return;
        }
      } catch (error) {
        console.error('建立會話時發生錯誤:', error);
        alert('建立會話時發生錯誤: ' + error.message);
        return;
      }
    }
    
    if (!currentSessionId) {
      console.error('沒有會話 ID，無法繼續');
      return;
    }
    
    console.log('開始獲取會話數據，sessionId:', currentSessionId);
    const res = await getSessionData(currentSessionId);
    console.log('getSessionData 結果:', res);
    
    let gameData = typeof res.gameData === 'string' ? JSON.parse(res.gameData) : res.gameData || {};
    const playersWithColor = playersData.map(p => ({ ...p, initialPower: p.power }));
    
    // 設定遊戲數據，包含載入的預設事件
    gameData.players = playersWithColor;
    gameData.history = [];
    gameData.currentRound = 0;
    gameData.gameOver = false;
    gameData.roundHistory = [{
      round: 0,
      playerPowers: playersWithColor.map(p => ({ name: p.name, power: p.power, color: p.color }))
    }];
    
    // 包含載入的預設事件和自訂標籤
    if (allCards && allCards.length > 0) {
      gameData.allCards = allCards;
    }
    if (customTabs && customTabs.length > 0) {
      gameData.customTabs = customTabs;
    }
    
    // 保存Admin密碼到遊戲數據中
    if (adminPassword) {
      gameData.adminPassword = adminPassword;
      console.log('已將密碼保存到遊戲數據中');
    }
    
    gameData.lastUpdate = new Date().toISOString();
    
    // 先同步到伺服器（這會更新ADMIN_PASSWORD欄位）
    console.log('準備同步遊戲數據到伺服器');
    console.log('updateSessionData 傳送內容:', JSON.stringify(gameData));
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    console.log('遊戲數據已保存到伺服器');
    
    // 等待一下確保數據已更新
    console.log('等待 1 秒確保數據更新...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 設定本地狀態
    setLastUpdate(gameData.lastUpdate);
    setPlayers(playersWithColor);
    setHistory([]);
    setCurrentPlayer(0);
    setGameOver(false);
    setRoundHistory(gameData.roundHistory);
    setCurrentRound(0);
    setShowRoundSummary(false);
    setTempRoundData(null);
    
    // 自動成為 Admin
    setAdminId(clientId);
    console.log('遊戲開始，自動成為 Admin，clientId:', clientId);
    
    // 調用 setAdmin API 設定管理者，使用保存的密碼
    if (adminPassword) {
      try {
        console.log('準備調用 setAdmin API:', { currentSessionId, clientId, adminPassword });
        const adminResult = await setAdmin(currentSessionId, clientId, adminPassword);
        console.log('setAdmin 完整結果:', adminResult);
        
        if (adminResult.status === 'success') {
          console.log('setAdmin 成功，現在重新獲取會話數據確認');
          // 重新獲取會話數據確認 adminId 是否正確設定
          const sessionRes = await getSessionData(currentSessionId);
          console.log('重新獲取的會話數據:', sessionRes);
          if (sessionRes.status === 'success' && sessionRes.adminId) {
            setAdminId(sessionRes.adminId);
            console.log('已更新 adminId 為:', sessionRes.adminId);
          }
        } else {
          console.error('設定管理者失敗:', adminResult.message);
        }
      } catch (error) {
        console.error('設定管理者時發生錯誤:', error);
      }
    } else {
      console.log('沒有提供 adminPassword，跳過 setAdmin API 調用');
    }
    
    console.log('=== handleStart 完成 ===');
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
    const newHistory = [...(history || []), { playerIdx, cardId: card.id, cardName: card.name, multiplier: card.multiplier, cost: card.cost }];
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
  const handleUnselectCard = (playerIdx, cardId) => {
    const card = (allCards || []).find(c => c.id === cardId);
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
      const idx = history.map((h, i) => h.playerIdx === playerIdx && h.cardId === cardId ? i : -1).filter(i => i !== -1).pop();
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
      playerPowers: players ? players.map(p => ({ name: p.name, power: p.power, color: p.color })) : []
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

  // 去重 function
  function dedupeEvents(events) {
    const map = {};
    events.forEach(e => {
      // 使用 ID 作為唯一識別，如果沒有 ID 則使用名稱作為備用
      const key = e.id || `${e.name}|||${e.customTab || ''}`;
      map[key] = e;
    });
    return Object.values(map);
  }

  const handleSaveCard = async (cardData) => {
    if (!currentSessionId) return;
    
    // 使用本地的 allCards 狀態，而不是從伺服器重新獲取
    // 這樣可以保留載入的預設事件
    let currentAllCards = [...(allCards || [])];
    let currentCustomTabs = [...(customTabs || [])];
    
    // 如果新事件有 customTab，確保它存在於 customTabs 中
    if (cardData.customTab && !currentCustomTabs.includes(cardData.customTab)) {
      currentCustomTabs.push(cardData.customTab);
    }
    
    // 強制所有經 EventEditor 儲存的事件都設 isCustom: true
    const cardToSave = { ...cardData, isCustom: true };
    
    // 如果有 ID，使用 ID 來更新；如果沒有 ID，使用名稱和 customTab
    if (cardToSave.id) {
      // 使用 ID 更新現有事件
      currentAllCards = currentAllCards.map(c => 
        c.id === cardToSave.id ? cardToSave : c
      );
    } else {
      // 為新事件生成唯一 ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      cardToSave.id = `custom_${timestamp}_${random}`;
      currentAllCards.push(cardToSave);
    }
    
    // 更新本地狀態
    setAllCards(dedupeEvents(currentAllCards));
    setCustomTabs(currentCustomTabs);
    
    // 同步到伺服器
    const gameData = {
      players,
      history,
      currentRound,
      gameOver,
      roundHistory,
      allCards: currentAllCards,
      customTabs: currentCustomTabs,
      lastUpdate: new Date().toISOString()
    };
    
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId) => {
    if (!currentSessionId) return;
    
    // 使用本地的 allCards 狀態，而不是從伺服器重新獲取
    let currentAllCards = [...(allCards || [])];
    
    // 移除指定 ID 的事件
    currentAllCards = currentAllCards.filter(c => c.id !== cardId);
    
    // 更新本地狀態
    setAllCards(dedupeEvents(currentAllCards));
    
    // 同步到伺服器
    const gameData = {
      players,
      history,
      currentRound,
      gameOver,
      roundHistory,
      allCards: currentAllCards,
      customTabs,
      lastUpdate: new Date().toISOString()
    };
    
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
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
    
    // 使用本地的 allCards 狀態，而不是從伺服器重新獲取
    let currentAllCards = [...(allCards || [])];
    
    // 切換指定事件的 isCustom 狀態
    currentAllCards = currentAllCards.map(c => 
      c.id === card.id ? { ...c, isCustom: !c.isCustom } : c
    );
    
    // 更新本地狀態
    setAllCards(dedupeEvents(currentAllCards));
    
    // 同步到伺服器
    const gameData = {
      players,
      history,
      currentRound,
      gameOver,
      roundHistory,
      allCards: currentAllCards,
      customTabs,
      lastUpdate: new Date().toISOString()
    };
    
    await updateSessionData(currentSessionId, JSON.stringify(gameData));
    setLastUpdate(gameData.lastUpdate);
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
      if (!currentSessionId) {
        return; // 如果沒有會話ID，跳過同步
      }
      
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
          
          // 觀看者模式：直接接收 server 更新
          // 管理者模式：只有當 server 更新時間 >= local 更新時間才接收
          const shouldUpdate = adminId === clientId 
            ? (!localLastUpdate || new Date(res.lastUpdate) >= new Date(localLastUpdate))
            : true; // 觀看者總是接收更新
          
          if (shouldUpdate) {
            if (Array.isArray(gameData.players)) {
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
              setAllCards(dedupeEvents(gameData.allCards));
            }
            if (Array.isArray(gameData.customTabs)) {
              setCustomTabs(gameData.customTabs);
            }
            setLastUpdate(res.lastUpdate);
            setAdminId(res.adminId || '');
            
            // 只有管理者才需要處理 pendingGameData
            if (adminId === clientId) {
              setPendingGameData(null);
              setLocalLastUpdate(null);
            }
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
      // 先獲取遊戲數據中的Admin密碼
      const res = await getSessionData(currentSessionId);
      if (res.status !== 'success') {
        setAdminError('無法獲取會話數據');
        return;
      }
      
      let gameData = res.gameData;
      if (typeof gameData === 'string') {
        gameData = JSON.parse(gameData);
      }
      
      const savedPassword = gameData.adminPassword || '';
      
      // 驗證密碼
      if (adminPasswordInput !== savedPassword) {
        setAdminError('密碼錯誤');
        return;
      }
      
      // 密碼正確，設定為管理者
      const adminResult = await setAdmin(currentSessionId, clientId, adminPasswordInput);
      console.log('setAdmin response', adminResult);
      if (adminResult.status === 'success') {
        setShowAdminModal(false);
        setAdminPasswordInput('');
        setAdminId(clientId);
        // 強制拉 server 最新 adminId，減少雙 MC 真空期
        const sessionRes = await getSessionData(currentSessionId);
        if (sessionRes && sessionRes.adminId) {
          setAdminId(sessionRes.adminId);
        }
      } else {
        setAdminError(adminResult.message || '設定管理者失敗');
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
    // 觀看者模式：直接使用 server 數據
    if (adminId && adminId !== clientId) {
      return { players, history, currentRound, gameOver, roundHistory, allCards, customTabs };
    }
    
    // 管理者模式：優先使用本地 pending 數據
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
    // 直接用目前 players 狀態
    const currentRoundData = {
      round: currentRound,
      playerPowers: players ? players.map(p => ({
        name: p.name,
        power: p.power,
        color: p.color
      })) : []
    };
    setTempRoundData(currentRoundData);
    setShowRoundSummary(true);
  };

  // 合併事件及 tabs 工具函數
  function mergeEvents(currentEvents, presetEvents) {
    const map = {};
    
    // 先加入現有事件，使用 ID 作為 key
    currentEvents.forEach(e => { 
      const key = e.id || `${e.name}|||${e.customTab || ''}`;
      map[key] = e; 
    });
    
    // 再加入預設事件，處理 ID 衝突
    presetEvents.forEach(e => { 
      const key = e.id || `${e.name}|||${e.customTab || ''}`;
      if (!map[key]) {
        // 沒有衝突，直接加入
        map[key] = e;
      } else {
        // 有衝突，檢查是否為同名事件
        const existingEvent = map[key];
        if (existingEvent.name === e.name) {
          // 同名事件，保留現有的（可能是用戶自訂的）
          console.log(`保留現有事件: ${e.name} (ID: ${existingEvent.id})`);
        } else {
          // 不同名但 ID 衝突，為新事件生成新 ID
          const newEvent = { ...e, id: Date.now() + '_' + Math.random().toString(36).substr(2, 9) };
          map[newEvent.id] = newEvent;
          console.log(`ID 衝突，為事件 ${e.name} 生成新 ID: ${newEvent.id}`);
        }
      }
    });
    
    return Object.values(map);
  }
  function mergeTabs(currentTabs, presetTabs) {
    return Array.from(new Set([...(currentTabs || []), ...(presetTabs || [])]));
  }

  return (
    <div className="App">
      {/* debug log */}
      {console.log('App render players:', displayData.players)}
      {console.log('App render 條件檢查:', { 
        showSessionManager, 
        currentSessionId, 
        hasPlayers: !!displayData.players,
        pendingSessionName: localStorage.getItem('pendingSessionName'),
        gameOver 
      })}
      {/* 儲存提示 */}
      {saveTip && (
        <div style={{position:'fixed',top:8,right:8,zIndex:9999,background:'#e3fbe3',color:'#388e3c',padding:'8px 18px',borderRadius:8,fontWeight:600,boxShadow:'0 2px 8px #388e3c22'}}>
          {saveTip}
        </div>
      )}
      {/* 手動儲存按鈕（只給 MC 顯示） */}
      {isCurrentMC && pendingGameData && (
        <button onClick={handleManualSave} style={{position:'fixed',top:50,right:8,zIndex:9999,background:'#1976d2',color:'#fff',padding:'8px 18px',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 8px #1976d222'}}>💾 儲存</button>
      )}
      {isJoiningSession && (
        <div style={{padding: 48, textAlign: 'center', fontSize: 22}}>載入中...</div>
      )}
      
      {/* 會話資訊顯示 - 移到標題上方 */}
      {currentSessionId && (
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '12px 20px',
          margin: '0 0 20px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontWeight: 600, color: '#1976d2' }}>會話ID: </span>
            <span style={{ fontFamily: 'monospace', background: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
              {currentSessionId}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '14px',
              fontWeight: 600,
              background: isCurrentMC ? '#4caf50' : '#ff9800',
              color: 'white'
            }}>
              {isCurrentMC ? '👑 管理者' : '👀 觀看者'}
            </span>
            {/* 只有管理者才能離開會話 */}
            {isCurrentMC && (
              <button 
                onClick={() => {
                  setCurrentSessionId(null);
                  setPlayers(null);
                  setHistory([]);
                  setCurrentPlayer(0);
                  setGameOver(false);
                  setRoundHistory([]);
                  setCurrentRound(0);
                  setShowRoundSummary(false);
                  setTempRoundData(null);
                  setAdminId('');
                  setAllCards(sampleCards);
                  setCustomTabs([]);
                  setLastUpdate(null);
                  localStorage.removeItem('pendingSessionName');
                }}
                style={{
                  padding: '6px 12px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                離開會話
              </button>
            )}
          </div>
        </div>
      )}
      
      <h1>人生 RPG 遊戲</h1>
      
      {showSessionManager ? (
        <SessionManager
          onJoinSession={handleJoinSession}
          onClose={() => setShowSessionManager(false)}
          clientId={clientId}
        />
      ) : localStorage.getItem('pendingSessionName') || (currentSessionId && !displayData.players && adminId === clientId) ? (
        <CharacterSetup 
          onStart={handleStart} 
          onLoadPreset={handleLoadPresetClick}
        />
      ) : !currentSessionId ? (
        <SessionManager
          onJoinSession={handleJoinSession}
          onClose={() => setShowSessionManager(false)}
          clientId={clientId}
        />
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
          
          {/* 觀看者模式提示 */}
          {!isCurrentMC && currentSessionId && displayData.players && (
            <div style={{padding: 24, background: '#fffbe6', border: '1px solid #ffe082', borderRadius: 8, margin: '24px 0', textAlign: 'center'}}>
              <div style={{fontWeight: 600, marginBottom: 8}}>你是觀看者，無法操作遊戲。</div>
              <div style={{color: '#666', fontSize: '14px'}}>觀看者模式只能查看遊戲狀態，無法進行編輯操作。</div>
            </div>
          )}
          
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
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', position: 'relative' }}>
                  {isCurrentMC && (
                    <>
                      <button onClick={handleAddNewCard} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: '#4caf50', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>➕ 新增事件</button>
                      {/* 表格選取事件按鈕 */}
                      <button onClick={() => setShowTableSelect(true)} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>🗂️ 表格選取事件</button>
                      {/* 切換成觀看者按鈕 */}
                      <button onClick={() => setAdminId('')} style={{ padding: '6px 18px', borderRadius: 20, border: 'none', background: '#ff9800', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>👀 切換成觀看者</button>
                  <button
                    onClick={() => setShowMenu(v => !v)}
                    style={{ padding: '6px 12px', borderRadius: 20, border: 'none', background: '#eee', color: '#333', fontWeight: 600, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
                    title="更多功能"
                  >
                    &#8942;
                  </button>
                  {showMenu && (
                        <div style={{
                          position: 'absolute',
                          top: 40,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #ccc',
                          borderRadius: 8,
                          boxShadow: '0 2px 8px #0002',
                          zIndex: 1000,
                          minWidth: 180,
                          padding: 12
                        }}>
                          <div
                            style={{ padding: 8, cursor: 'pointer' }}
                            onClick={() => {
                              setShowMenu(false);
                              setShowSavePresetModal(true);
                            }}
                          >💾 儲存預設</div>
                          <div
                            style={{ padding: 8, cursor: 'pointer' }}
                        onClick={() => { 
                          setShowMenu(false); 
                              handleLoadPresetClick();
                        }}
                          >📂 載入預設</div>
                    </div>
                      )}
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
      {/* {!isCurrentMC && currentSessionId && displayData.players && (
        <div style={{padding: 24, background: '#fffbe6', border: '1px solid #ffe082', borderRadius: 8, margin: '24px 0', textAlign: 'center'}}>
          <div style={{fontWeight: 600, marginBottom: 8}}>你不是管理者，無法操作遊戲。</div>
          <button onClick={() => setShowAdminModal(true)} style={{padding: '6px 18px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer'}}>輸入管理密碼搶下管理權</button>
        </div>
      )} */}
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
      {/* 預設選擇 modal */}
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
                          console.log('你選擇咗 presetId:', presetId);
                          const res = await loadPreset(presetId);
                          console.log('loadPreset 回傳：', res);
                          if (res.status === 'success') {
                            const events = Array.isArray(res.data.events) ? res.data.events : [];
                            const tabs = Array.isArray(res.data.tabs) ? res.data.tabs : [];
                            
                            // 儲存預設數據，顯示自定義確認對話框
                            setPendingPresetData({ events, tabs });
                            setPendingPresetId(presetId);
                            setShowPresetConfirmModal(true);
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
      {/* 自定義預設載入確認對話框 */}
      {showPresetConfirmModal && pendingPresetData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minWidth: 400, maxWidth: 500, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
            <button onClick={() => setShowPresetConfirmModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }} title="關閉">✖️</button>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1976d2' }}>載入預設「{pendingPresetId}」</h3>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>選擇載入方式：</p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#4CAF50' }}>• 合併：</span>
                <span>保留現有事件並加入預設事件</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#f44336' }}>• 覆蓋：</span>
                <span>完全替換現有事件</span>
              </div>
              
              {/* 檢查是否有已選擇的事件 */}
              {history && history.length > 0 && players && players.length > 0 && (
                <div style={{ 
                  marginTop: 12, 
                  padding: '8px 12px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffeaa7', 
                  borderRadius: 6,
                  color: '#856404'
                }}>
                  ⚠️ 注意：選擇覆蓋會取消所有已選擇的事件！
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  // 用戶選擇合併
                  const mergedEvents = mergeEvents(allCards, pendingPresetData.events);
                  const mergedTabs = mergeTabs(customTabs, pendingPresetData.tabs);
                  
                  setAllCards(mergedEvents);
                  setCustomTabs(mergedTabs);
                  
                  // 如果在創建階段，同步到伺服器
                  if (currentSessionId) {
                    const gameData = {
                      players: players || [],
                      history: history || [],
                      currentRound: currentRound || 0,
                      gameOver: gameOver || false,
                      roundHistory: roundHistory || [],
                      allCards: mergedEvents,
                      customTabs: mergedTabs,
                      lastUpdate: new Date().toISOString()
                    };
                    updateSessionData(currentSessionId, JSON.stringify(gameData));
                    console.log('創建階段：已同步合併的預設到伺服器');
                  }
                  
                  setShowPresetConfirmModal(false);
                  setPendingPresetData(null);
                  setPendingPresetId('');
                }}
                style={{ 
                  padding: '8px 24px', 
                  borderRadius: 8, 
                  border: '1px solid #4CAF50', 
                  background: '#fff', 
                  color: '#4CAF50', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                合併
              </button>
              <button 
                onClick={() => {
                  // 用戶選擇覆蓋
                  const { events, tabs } = pendingPresetData;
                  
                  // 智能事件保留邏輯
                  if (history && history.length > 0 && players && players.length > 0) {
                    // 找出已選擇的事件ID
                    const selectedEventIds = history.map(h => h.cardId);
                    
                    // 檢查新預設中是否有同ID事件
                    const eventsToKeep = [];
                    const eventsToReplace = [];
                    const eventsToRemove = [];
                    
                    events.forEach(event => {
                      if (selectedEventIds.includes(event.id)) {
                        // 保留同ID事件的選擇狀態
                        eventsToKeep.push(event);
                      } else {
                        eventsToReplace.push(event);
                      }
                    });
                    
                    // 找出需要移除的事件（已選擇但新預設中沒有的）
                    selectedEventIds.forEach(eventId => {
                      const eventExists = events.some(e => e.id === eventId);
                      if (!eventExists) {
                        eventsToRemove.push(eventId);
                      }
                    });
                    
                    // 合併保留的事件和替換的事件
                    const finalEvents = [...eventsToKeep, ...eventsToReplace];
                    setAllCards(finalEvents);
                    setCustomTabs(tabs);
                    
                    // 如果有需要移除的事件，取消它們的選擇狀態
                    if (eventsToRemove.length > 0) {
                      let newHistory = [...history];
                      let newPlayers = [...players];
                      
                      // 移除相關事件的歷史記錄
                      newHistory = newHistory.filter(h => !eventsToRemove.includes(h.cardId));
                      
                      // 重置受影響玩家的戰鬥力
                      const affectedPlayers = new Set();
                      history.forEach(h => {
                        if (eventsToRemove.includes(h.cardId)) {
                          affectedPlayers.add(h.playerIdx);
                        }
                      });
                      
                      // 重新計算受影響玩家的戰鬥力
                      affectedPlayers.forEach(playerIdx => {
                        const playerHistory = newHistory.filter(h => h.playerIdx === playerIdx);
                        let newPower = newPlayers[playerIdx].initialPower || newPlayers[playerIdx].power;
                        
                        // 重新計算戰鬥力
                        playerHistory.forEach(h => {
                          const card = finalEvents.find(e => e.id === h.cardId);
                          if (card && card.multiplier) {
                            newPower = Math.round(newPower * card.multiplier);
                          }
                        });
                        
                        newPlayers[playerIdx] = {
                          ...newPlayers[playerIdx],
                          power: newPower
                        };
                      });
                      
                      setHistory(newHistory);
                      setPlayers(newPlayers);
                      
                      console.log('移除的事件:', eventsToRemove);
                      console.log('受影響的玩家:', Array.from(affectedPlayers));
                    }
                    
                    console.log('智能保留事件:', eventsToKeep.map(e => e.name));
                    console.log('替換事件:', eventsToReplace.map(e => e.name));
                    console.log('移除事件:', eventsToRemove);
                  } else {
                    // 沒有已選擇的事件或玩家，直接覆蓋
                    setAllCards(events);
                    setCustomTabs(tabs);
                    console.log('直接覆蓋所有事件（創建玩家階段或無已選擇事件）');
                  }
                  
                  // 如果在創建階段，同步到伺服器
                  if (currentSessionId) {
                    const finalEvents = history && history.length > 0 && players && players.length > 0 
                      ? [...eventsToKeep, ...eventsToReplace] 
                      : events;
                      
                    const gameData = {
                      players: players || [],
                      history: history || [],
                      currentRound: currentRound || 0,
                      gameOver: gameOver || false,
                      roundHistory: roundHistory || [],
                      allCards: finalEvents,
                      customTabs: tabs,
                      lastUpdate: new Date().toISOString()
                    };
                    updateSessionData(currentSessionId, JSON.stringify(gameData));
                    console.log('創建階段：已同步覆蓋的預設到伺服器');
                  }
                  
                  setShowPresetConfirmModal(false);
                  setPendingPresetData(null);
                  setPendingPresetId('');
                }}
                style={{ 
                  padding: '8px 24px', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: '#f44336', 
                  color: '#fff', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                覆蓋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
