import React from 'react';

// A small, reusable component for showing a tooltip on hover or click.
function InfoTip({ tip }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}>
      <span
        style={{
          marginLeft: 4,
          color: '#1976d2',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 15,
          borderRadius: '50%',
          border: '1px solid #1976d2',
          width: 16,
          height: 16,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: '16px',
          background: '#e3eafc',
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.stopPropagation(); // Prevent clicks from bubbling up
          setShow(s => !s)
        }}
      >
        i
      </span>
      {show && (
        <div style={{
          position: 'absolute',
          left: '120%',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#fff',
          color: '#333',
          border: '1px solid #bbb',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 14,
          whiteSpace: 'nowrap',
          zIndex: 1001, // Ensure it's above other elements
          boxShadow: '0 2px 8px #0002',
          minWidth: 150
        }}>{tip}</div>
      )}
    </span>
  );
}

export default InfoTip; 