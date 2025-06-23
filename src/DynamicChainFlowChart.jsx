import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({ startOnLoad: false });

function buildMermaidFlow(chainCards) {
  // 依 group 與 order 排序
  const sorted = [...chainCards].sort((a, b) => (a.order || 0) - (b.order || 0));
  let nodes = new Set();
  let edges = [];
  sorted.forEach(card => {
    nodes.add(card.name);
    if (card.prerequisite) {
      edges.push(`${card.prerequisite} --> ${card.name}`);
    }
  });
  // 若無前置，視為起點
  const startNodes = sorted.filter(card => !card.prerequisite).map(card => card.name);
  let mermaidStr = 'graph TD\n';
  edges.forEach(e => { mermaidStr += e + '\n'; });
  // 確保起點有顯示
  startNodes.forEach(n => { if (!edges.some(e => e.startsWith(n))) mermaidStr += `${n}\n`; });
  return mermaidStr;
}

const DynamicChainFlowChart = ({ chainCards }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && chainCards.length > 0) {
      ref.current.innerHTML = `<pre class='mermaid'>${buildMermaidFlow(chainCards)}</pre>`;
      mermaid.run({ nodes: [ref.current] });
    }
  }, [chainCards]);
  return (
    <div ref={ref} style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: 16, marginBottom: 24, overflowX: 'auto' }} />
  );
};

export default DynamicChainFlowChart; 