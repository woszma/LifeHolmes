import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function PowerTrendChart({ roundHistory }) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '玩家戰鬥力趨勢圖',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '戰鬥力'
        }
      },
      x: {
        title: {
          display: true,
          text: '回合'
        }
      }
    }
  };

  const labels = roundHistory.map((_, index) => `回合 ${index}`);

  const datasets = roundHistory[0]?.playerPowers.map(player => ({
    label: player.name,
    data: roundHistory.map(round => 
      round.playerPowers.find(p => p.name === player.name)?.power || 0
    ),
    borderColor: player.color,
    backgroundColor: player.color,
    tension: 0.1
  })) || [];

  const data = {
    labels,
    datasets
  };

  return (
    <div style={{ 
      padding: '1em', 
      background: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginTop: '1em'
    }}>
      <Line options={options} data={data} />
    </div>
  );
}

export default PowerTrendChart; 