import React, { useState, useEffect } from 'react';
import { createSession, listActiveSessions, getSessionData, updateSessionData, endSession } from './sessionApi';

const SessionManager = ({ onJoinSession, currentSessionId, onLeaveSession, onSetupPlayers, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [sessionIdToJoin, setSessionIdToJoin] = useState('');

  // 載入會話列表
  const loadSessions = async () => {
    setLoading(true);
    try {
      const result = await listActiveSessions();
      if (result.status === 'success') {
        setSessions(result.sessions || []);
      } else {
        alert('載入會話列表失敗: ' + (result.message || '未知錯誤'));
        console.error('載入會話列表失敗:', result.message);
      }
    } catch (error) {
      alert('載入會話列表時發生錯誤');
      console.error('載入會話列表錯誤:', error);
    }
    setLoading(false);
  };

  // 創建新會話
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      alert('請輸入會話名稱');
      return;
    }

    setLoading(true);
    try {
      const result = await createSession(newSessionName.trim());
      if (result.status === 'success') {
        alert(`會話創建成功！會話 ID: ${result.sessionId}`);
        setShowCreateModal(false);
        setNewSessionName('');
        loadSessions();
      } else {
        alert('創建會話失敗: ' + (result.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('創建會話錯誤:', error);
      alert('創建會話時發生錯誤');
    }
    setLoading(false);
  };

  // 加入會話
  const handleJoinSession = async (sessionId) => {
    if (!sessionId) {
      alert('請輸入會話 ID');
      return;
    }

    setLoading(true);
    try {
      const result = await getSessionData(sessionId);
      if (result.status === 'success') {
        onJoinSession(sessionId, result.gameData);
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

  // 加入會話（從列表）
  const handleJoinSessionFromList = async (sessionId) => {
    setLoading(true);
    try {
      const result = await getSessionData(sessionId);
      if (result.status === 'success') {
        onJoinSession(sessionId, result.gameData);
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

  // 結束會話
  const handleEndSession = async (sessionId) => {
    if (!confirm('確定要結束這個會話嗎？')) return;

    setLoading(true);
    try {
      const result = await endSession(sessionId);
      if (result.status === 'success') {
        alert('會話已結束');
        loadSessions();
        if (currentSessionId === sessionId) {
          onLeaveSession();
        }
      } else {
        alert('結束會話失敗: ' + (result.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('結束會話錯誤:', error);
      alert('結束會話時發生錯誤');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#1976d2', marginBottom: '20px' }}>會話管理</h2>
      
      {/* 當前會話狀態 */}
      {currentSessionId && (
        <div style={{ 
          background: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #2196f3'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>當前會話</h3>
          <p style={{ margin: '0 0 10px 0' }}>會話 ID: <strong>{currentSessionId}</strong></p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onSetupPlayers}
              style={{
                padding: '8px 16px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              設置玩家
            </button>
            <button
              onClick={onLeaveSession}
              style={{
                padding: '8px 16px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              離開會話
            </button>
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          創建新會話
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          style={{
            padding: '10px 20px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          加入會話
        </button>
        <button
          onClick={loadSessions}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '載入中...' : '重新整理'}
        </button>
      </div>

      {/* 會話列表 */}
      <div>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>活躍會話</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>載入中...</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            目前沒有活躍的會話
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sessions.map(session => (
              <div
                key={session.sessionId}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  background: currentSessionId === session.sessionId ? '#e8f5e8' : '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                      會話 ID: {session.sessionId}
                    </h4>
                    <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                      創建者: {session.createdBy}
                    </p>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                      創建時間: {new Date(session.createdTime).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {currentSessionId !== session.sessionId && (
                      <button
                        onClick={() => handleJoinSessionFromList(session.sessionId)}
                        style={{
                          padding: '6px 12px',
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        加入
                      </button>
                    )}
                    <button
                      onClick={() => handleEndSession(session.sessionId)}
                      style={{
                        padding: '6px 12px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      結束
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* 加入會話 Modal */}
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
            <h3 style={{ margin: '0 0 20px 0', color: '#1976d2' }}>加入會話</h3>
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
                onClick={() => handleJoinSession(sessionIdToJoin.trim())}
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