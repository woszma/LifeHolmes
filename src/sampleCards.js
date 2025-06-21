export const sampleCards = [
  // Chain Events: Education Path
  { id: 1, name: '名牌小學', type: 'chain', group: '小學', order: 1, prerequisite: null, cost: 500, multiplier: 1.4, condition: '父或母為專業生優先' },
  { id: 2, name: '一般小學', type: 'chain', group: '小學', order: 1, prerequisite: null, cost: 500, multiplier: 1.3 },
  { id: 3, name: '名牌中學', type: 'chain', group: '中學', order: 2, prerequisite: '小學', cost: 500, multiplier: 1.4, condition: '須小學畢業、名牌小學畢業生優先' },
  { id: 4, name: '一般中學', type: 'chain', group: '中學', order: 2, prerequisite: '小學', cost: 500, multiplier: 1.3, condition: '須小學畢業' },
  { id: 5, name: '中學文憑試', type: 'chain', group: '中學文憑試', order: 3, prerequisite: '中學', cost: 500, multiplier: 1.1, condition: '須中學畢業' },
  { id: 6, name: '資助大學學士', type: 'chain', group: '大學', order: 4, prerequisite: '中學文憑試', cost: 500, multiplier: 2.0, condition: '須文憑試合格' },
  { id: 7, name: '是旦福大學學士', type: 'chain', group: '大學', order: 4, prerequisite: '中學', cost: 3000, multiplier: 2.2, condition: '須文憑試合格或「捐款」' },
  { id: 8, name: "Don't傾大學學士", type: 'chain', group: '大學', order: 4, prerequisite: '中學', cost: 2000, multiplier: 2.2, condition: '父或母有海外護照' },
  
  // Single Events
  { id: 9, name: '明愛補習社', type: 'single', group: '補習', cost: 1000, multiplier: 1.4, condition: '考試後，海關有可能會隨機抽查一人查問' },
  { id: 10, name: '明愛補習社優質內部影片流出', type: 'single', group: '補習', cost: 200, multiplier: 1.4, condition: '如發現非法下載，留案底' },
  { id: 11, name: '電腦/寬頻/手機電話', type: 'single', group: '設備', cost: 1000, multiplier: 1.4 },
  { id: 12, name: '流動數據', type: 'single', group: '設備', cost: 500, multiplier: 1.2 },
  { id: 13, name: '體育', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項' },
  { id: 14, name: '藝術', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項' },
  { id: 15, name: '學術', type: 'single', group: '課外活動', cost: 0, multiplier: 1.1, condition: '每人最多只可參加2項' },
  { id: 16, name: '海外交換生計劃', type: 'single', group: '海外交換', cost: 2000, multiplier: 2.0, quota: 2 },
  { id: 17, name: '擂台賽（男）', type: 'single', group: '機會', cost: 0, multiplier: 1.1, quota: 1 },
  { id: 18, name: 'Sit-up（女）', type: 'single', group: '機會', cost: 0, multiplier: 1.2, quota: 1 },
]; 