import React, { useState, useEffect } from 'react';
import { createSession, getSessionData, setAdmin, listActiveSessions } from './sessionApi';

const SessionManager = ({ onJoinSession, onClose, clientId }) => {
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSessionList, setShowSessionList] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [sessionIdToJoin, setSessionIdToJoin] = useState('');
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  console.log('SessionManager render:', { showCreateModal, showJoinModal, showSessionList, newSessionName });

  // 載入活躍會話列表
  const loadActiveSessions = async () => {
    setLoading(true);
    try {
      const result = await listActiveSessions();
      if (result.status === 'success') {
        setActiveSessions(result.sessions || []);
      } else {
        console.error('載入會話列表失敗:', result.message);
      }
    } catch (error) {
      console.error('載入會話列表錯誤:', error);
    }
    setLoading(false);
  };

  // 創建新會話 - 修改為先進入角色設置頁面
  const handleCreateSession = async () => {
    console.log('handleCreateSession 被呼叫');
    console.log('newSessionName:', newSessionName);
    
    if (!newSessionName.trim()) {
      alert('請輸入會話名稱');
      return;
    }

    console.log('準備儲存會話名稱到 localStorage:', newSessionName.trim());
    
    // 不再立即建立會話，而是先進入角色設置頁面
    // 會話名稱會暫時保存在 localStorage 中
    localStorage.setItem('pendingSessionName', newSessionName.trim());
    
    setShowCreateModal(false);
    setNewSessionName('');
    
    console.log('準備呼叫 onJoinSession');
    // 進入角色設置頁面，傳遞 null 表示這是新會話
    onJoinSession(null, null, null);
    if (typeof onClose === 'function') onClose();
    
    console.log('handleCreateSession 完成');
  };

  // 加入會話（舊的輸入ID方式）
  const handleJoinSession = async (sessionId) => {
    if (!sessionId) {
      alert('請輸入會話 ID');
      return;
    }

    setLoading(true);
    try {
      const result = await getSessionData(sessionId);
      if (result.status === 'success') {
        onJoinSession(sessionId, result.gameData, result.adminId);
        setShowJoinModal(false);
        setShowCreateModal(false);
        if (typeof onClose === 'function') onClose();
      } else {
        alert('加入會話失敗: ' + (result.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('加入會話錯誤:', error);
      alert('加入會話時發生錯誤');
    }
    setLoading(false);
  };

  // 選擇會話
  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setShowPasswordModal(true);
    setAdminPassword('');
    setPasswordError('');
  };

  // 以管理者身份加入會話
  const handleJoinAsAdmin = async () => {
    if (!adminPassword.trim()) {
      setPasswordError('請輸入管理員密碼');
      return;
    }

    setLoading(true);
    try {
      // 先嘗試設定為管理者
      const adminResult = await setAdmin(selectedSession.sessionId, clientId, adminPassword);
      if (adminResult.status === 'success') {
        // 獲取會話數據
        const result = await getSessionData(selectedSession.sessionId);
        if (result.status === 'success') {
          onJoinSession(selectedSession.sessionId, result.gameData, clientId);
          setShowPasswordModal(false);
          setShowSessionList(false);
          if (typeof onClose === 'function') onClose();
        } else {
          setPasswordError('無法獲取會話數據');
        }
      } else {
        setPasswordError(adminResult.message || '密碼錯誤');
      }
    } catch (error) {
      console.error('加入會話錯誤:', error);
      setPasswordError('加入會話時發生錯誤');
    }
    setLoading(false);
  };

  // 以觀看者身份加入會話
  const handleJoinAsViewer = async () => {
    setLoading(true);
    try {
      const result = await getSessionData(selectedSession.sessionId);
      if (result.status === 'success') {
        onJoinSession(selectedSession.sessionId, result.gameData, ''); // 空字串表示觀看者
        setShowPasswordModal(false);
        setShowSessionList(false);
        if (typeof onClose === 'function') onClose();
      } else {
        alert('加入會話失敗: ' + (result.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('加入會話錯誤:', error);
      alert('加入會話時發生錯誤');
    }
    setLoading(false);
  };

  // 生成觀看者網址
  const generateViewerUrl = (sessionId) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const viewerUrl = `${baseUrl}?viewer=${sessionId}`;
    console.log('生成觀看者網址:', { baseUrl, sessionId, viewerUrl });
    return viewerUrl;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ color: '#1976d2', marginBottom: '40px' }}>人生 RPG 遊戲</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <button
          onClick={() => {
            console.log('創建新會話按鈕被點擊');
            setShowCreateModal(true);
          }}
          style={{
            padding: '20px 40px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
            minWidth: '200px'
          }}
        >
          🎮 創建新會話
        </button>
        
        <button
          onClick={() => {
            setShowSessionList(true);
            loadActiveSessions();
          }}
          style={{
            padding: '20px 40px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
            minWidth: '200px'
          }}
        >
          📋 加入現有會話
        </button>
        
        <button
          onClick={() => setShowJoinModal(true)}
          style={{
            padding: '20px 40px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
            minWidth: '200px'
          }}
        >
          🔗 輸入會話ID加入
        </button>
      </div>

      {/* 創建會話 Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1976d2' }}>創建新會話</h3>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="請輸入會話名稱"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '創建中...' : '創建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 活躍會話列表 Modal */}
      {showSessionList && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1976d2' }}>活躍會話列表</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>載入中...</div>
            ) : activeSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                目前沒有活躍的會話
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '15px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    onClick={() => handleSelectSession(session)}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                      {session.createdBy || '未命名會話'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      會話ID: {session.sessionId}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      創建時間: {new Date(session.createdTime).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setShowSessionList(false)}
                style={{
                  padding: '10px 20px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 密碼驗證 Modal */}
      {showPasswordModal && selectedSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1976d2' }}>
              加入會話: {selectedSession.createdBy || '未命名會話'}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                管理員密碼:
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="請輸入管理員密碼"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
              {passwordError && (
                <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
                  {passwordError}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontSize: '14px', marginBottom: '10px', fontWeight: '600' }}>
                觀看者網址:
              </div>
              <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                {generateViewerUrl(selectedSession.sessionId)}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button
                onClick={handleJoinAsViewer}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flex: 1
                }}
              >
                👀 觀看者模式
              </button>
              <button
                onClick={handleJoinAsAdmin}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flex: 1
                }}
              >
                {loading ? '加入中...' : '🔑 管理者模式'}
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加入會話 Modal（舊的輸入ID方式） */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1976d2' }}>輸入會話ID加入</h3>
            <input
              type="text"
              value={sessionIdToJoin}
              onChange={(e) => setSessionIdToJoin(e.target.value)}
              placeholder="請輸入會話 ID"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowJoinModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleJoinSession(sessionIdToJoin)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '加入中...' : '加入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManager; 