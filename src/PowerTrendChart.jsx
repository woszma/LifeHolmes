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
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: '玩家戰鬥力趨勢圖',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return `回合 ${context[0].dataIndex}`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} 戰鬥力`;
          },
          afterLabel: function(context) {
            const initialPower = roundHistory[0]?.playerPowers.find(p => p.name === context.dataset.label)?.power || 1;
            const multiplier = context.parsed.y / initialPower;
            return `倍數: ${multiplier.toFixed(2)}x`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '戰鬥力',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: '回合',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2
      },
      line: {
        borderWidth: 3,
        tension: 0.2
      }
    },
    hover: {
      mode: 'index',
      intersect: false
    }
  };

  const labels = roundHistory.map((_, index) => `回合 ${index}`);

  const datasets = roundHistory[0]?.playerPowers.map(player => ({
    label: player.name,
    data: roundHistory.map(round => 
      round.playerPowers.find(p => p.name === player.name)?.power || 0
    ),
    borderColor: player.color,
    backgroundColor: player.color + '40', // 加入透明度
    pointBackgroundColor: player.color,
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: player.color,
    pointHoverBorderColor: '#fff',
    tension: 0.2
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