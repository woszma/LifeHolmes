import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({ startOnLoad: false });

function DynamicChainFlowChart({ cards }) {
  const mermaidRef = useRef(null);
  const mermaidId = 'mermaid-chart-' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (mermaidRef.current) {
      const chainCards = cards.filter(c => c.type === 'chain');
      if (chainCards.length === 0) {
        mermaidRef.current.innerHTML = '';
        return;
      }

      const getCardId = (card) => `card_${card.id || card.name.replace(/\W/g, '')}`;
      
      const groups = {};
      chainCards.forEach(card => {
        if (!groups[card.group]) groups[card.group] = [];
        groups[card.group].push(card);
      });

      let mermaidSyntax = 'graph TD\n';
      for (const groupName in groups) {
        mermaidSyntax += `  subgraph ${groupName}\n`;
        groups[groupName].forEach(card => {
          mermaidSyntax += `    ${getCardId(card)}["${card.name.replace(/"/g, '#quot;')}"]\n`;
        });
        mermaidSyntax += '  end\n';
      }
      
      chainCards.forEach(card => {
        if (card.prerequisite && groups[card.prerequisite]) {
          groups[card.prerequisite].forEach(preCard => {
            mermaidSyntax += `  ${getCardId(preCard)} --> ${getCardId(card)}\n`;
          });
        }
      });
      
      mermaidRef.current.innerHTML = mermaidSyntax;
      mermaidRef.current.removeAttribute('data-processed');

      try {
        mermaid.run({
          nodes: [mermaidRef.current],
        });
      } catch(e) {
        console.error("Mermaid run error:", e);
      }
    }
  }, [cards]); // Rerun when cards change

  return (
    <div style={{ marginBottom: 24, background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: 16 }}>
      <h4 style={{ marginTop: 0 }}>升學路徑流程圖</h4>
      <div ref={mermaidRef} className="mermaid">
        {/* Mermaid will process the content of this div */}
      </div>
    </div>
  );
}

export default DynamicChainFlowChart; 