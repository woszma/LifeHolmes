import React, { useState, useEffect } from 'react';
import InfoTip from './InfoTip';

const fieldTips = {
  name: '事件的名稱，必填。',
  type: '事件的類型：single (單次) 或 chain (連續)。',
  cost: '選擇此事件所需的金錢，數字。',
  multiplier: '完成事件後戰鬥力的倍率增幅，例如1.2代表提升20%。',
  condition: '事件的特殊條件或限制，可留空。',
  quota: '此事件可被多少人選擇，留空代表沒有限制。',
  group: '連續事件的分組（如小學/中學/大學），或自訂事件的分類。',
  order: '連續事件的順序（數字，越小越早）。',
  prerequisite: '完成此事件前必須先完成的分組名稱。',
};

const initialFormState = {
  name: '',
  type: 'single',
  cost: 0,
  multiplier: 1,
  condition: '',
  quota: '',
  group: '',
  order: '',
  prerequisite: '',
};

function EventEditor({ card, onSave, onCancel, onDelete, customTabs = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'single',
    group: '',
    cost: 0,
    multiplier: 1.0,
    condition: '',
    quota: '',
    order: '',
    prerequisite: '',
    isCustom: false,
    customTab: ''
  });

  useEffect(() => {
    if (card) {
      setFormData({
        name: card.name || '',
        type: card.type || 'single',
        group: card.group || '',
        cost: card.cost || 0,
        multiplier: card.multiplier || 1.0,
        condition: card.condition || '',
        quota: card.quota || '',
        order: card.order || '',
        prerequisite: card.prerequisite || '',
        isCustom: card.isCustom || false,
        customTab: card.customTab || ''
      });
    }
  }, [card]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      id: card?.id || Date.now(),
      cost: parseInt(formData.cost) || 0,
      multiplier: parseFloat(formData.multiplier) || 1.0,
      quota: formData.quota ? parseInt(formData.quota) : null,
      order: formData.order ? parseInt(formData.order) : null,
      customTab: formData.customTab?.trim() || ''
    };
    onSave(eventData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 20, color: '#1976d2' }}>
          {card ? '編輯事件' : '新增事件'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>事件名稱 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>事件類型 *</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
            >
              <option value="single">單次事件</option>
              <option value="chain">連續事件</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>分類</label>
            <input
              type="text"
              value={formData.group}
              onChange={(e) => handleChange('group', e.target.value)}
              placeholder="例如：補習、設備、課外活動"
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>費用</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                min="0"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>戰鬥力倍率</label>
              <input
                type="number"
                value={formData.multiplier}
                onChange={(e) => handleChange('multiplier', e.target.value)}
                min="0.1"
                step="0.1"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 14
                }}
              />
            </div>
          </div>

          {formData.type === 'chain' && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>順序</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleChange('order', e.target.value)}
                  min="1"
                  placeholder="例如：1, 2, 3..."
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>前置條件</label>
                <input
                  type="text"
                  value={formData.prerequisite}
                  onChange={(e) => handleChange('prerequisite', e.target.value)}
                  placeholder="例如：小學、中學"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>名額限制</label>
            <input
              type="number"
              value={formData.quota}
              onChange={(e) => handleChange('quota', e.target.value)}
              min="1"
              placeholder="留空表示無限制"
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>特殊條件</label>
            <textarea
              value={formData.condition}
              onChange={(e) => handleChange('condition', e.target.value)}
              placeholder="例如：每人最多只可參加2項、須小學畢業"
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
                minHeight: 60,
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>分配到自訂Tab</label>
            <input
              list="customTabList"
              value={formData.customTab}
              onChange={e => handleChange('customTab', e.target.value)}
              placeholder="可輸入新名稱或選擇現有Tab"
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14
              }}
            />
            <datalist id="customTabList">
              {customTabs.map(tab => (
                <option value={tab} key={tab} />
              ))}
            </datalist>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9em' }}>
              可直接輸入新Tab名稱，或選擇現有Tab
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {card && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                style={{
                  padding: '8px 16px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                刪除
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                background: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventEditor; 