import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({ startOnLoad: false });

function safeId(str) {
  return String(str).replace(/[^a-zA-Z0-9_]/g, '_');
}

function buildMermaidFlow(chainCards) {
  if (!chainCards || chainCards.length === 0) return 'graph TD\n';

  let mermaidStr = 'graph TD\n';
  mermaidStr += '  start((開始))\n';

  // Helper to escape characters in node text
  const escape = (text) => `"${text.replace(/"/g, '#quot;')}"`;

  // 1. Create all nodes first, grouped by their 'group' property
  const groups = {};
  chainCards.forEach(card => {
    if (!groups[card.group]) {
      groups[card.group] = [];
    }
    groups[card.group].push(card);
  });

  // Generate node definitions within subgraphs
  for (const groupName in groups) {
    const safeGroupName = safeId(groupName);
    mermaidStr += `\n  subgraph ${safeGroupName} [${escape(groupName)}]\n`;
    groups[groupName].forEach(card => {
      const cardId = safeId(card.id);
      mermaidStr += `    ${cardId}[${escape(card.name)}]\n`;
    });
    mermaidStr += '  end\n';
  }

  // 2. Create connections based on prerequisites
  const allCardsMap = new Map(chainCards.map(c => [c.group, c]));

  chainCards.forEach(card => {
    const cardId = safeId(card.id);
    if (card.prerequisite) {
      // Find all cards that could be a prerequisite
      const prerequisiteCards = chainCards.filter(c => c.group === card.prerequisite);
      if (prerequisiteCards.length > 0) {
        prerequisiteCards.forEach(preCard => {
          const preCardId = safeId(preCard.id);
          mermaidStr += `  ${preCardId} --> ${cardId}\n`;
        });
      } else {
        // If prerequisite group exists but no specific card is found, link from start
        mermaidStr += `  start --> ${cardId}\n`;
      }
    } else {
      // If no prerequisite, link from start
      mermaidStr += `  start --> ${cardId}\n`;
    }
  });

  console.log('Generated Mermaid code:', mermaidStr);
  return mermaidStr;
}

const DynamicChainFlowChart = ({ chainCards }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && chainCards.length > 0) {
      ref.current.innerHTML = '';
      const code = buildMermaidFlow(chainCards);
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code;
      ref.current.appendChild(div);
      mermaid.run({ nodes: [div] });
    }
  }, [chainCards]);
  return (
    <div ref={ref} style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: 16, marginBottom: 24, overflowX: 'auto' }} />
  );
};

export default DynamicChainFlowChart; 