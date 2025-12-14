import { useState, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Receipt, CheckCircle, Tv, Moon, Power } from 'lucide-react';
import { formatTime, formatCurrency, getConsoleColor } from '../utils/helpers';

export default function ConsoleCard({ 
  console, 
  onDelete, 
  onFinish, 
  onUpdateTimer,
  settings 
}) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timer, setTimer] = useState(console.timer || { running: false, remaining: 0, total: 0 });
  const [tvStatus, setTvStatus] = useState('READY');

  const colors = getConsoleColor(console.type);

  useEffect(() => {
    let interval;
    if (timer.running && timer.remaining > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newRemaining = prev.remaining - 1;
          if (newRemaining <= 0) {
            alert(`Waktu ${console.name} habis!`);
            return { ...prev, remaining: 0, running: false };
          }
          return { ...prev, remaining: newRemaining };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.running, timer.remaining, console.name]);

  useEffect(() => {
    onUpdateTimer(console.id, timer);
  }, [timer]);

  const calculatePrice = () => {
    const priceKey = `price_${console.type.toLowerCase()}`;
    const hourPrice = settings[`${priceKey}_hour`] || 7000;
    const halfPrice = settings[`${priceKey}_30min`] || 4000;
    
    const totalSec = timer.total;
    const h = Math.floor(totalSec / 3600);
    const half = Math.floor((totalSec % 3600) / 1800);
    
    const timePrice = (h * hourPrice) + (half * halfPrice);
    const foodPrice = console.foodTotal || 0;
    
    return timePrice + foodPrice;
  };

  const handleStart = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) {
      alert('Set waktu terlebih dahulu!');
      return;
    }
    setTimer({ running: true, remaining: totalSeconds, total: totalSeconds });
    setTvStatus('PLAYING');
  };

  const handlePause = () => {
    setTimer(prev => ({ ...prev, running: false }));
    setTvStatus('PAUSED');
  };

  const handleAddTime = () => {
    const addSeconds = hours * 3600 + minutes * 60 + seconds;
    if (addSeconds <= 0) return;
    
    setTimer(prev => ({
      running: true,
      remaining: prev.remaining + addSeconds,
      total: prev.total + addSeconds,
    }));
    setTvStatus('PLAYING');
  };

  const handleTVControl = (action) => {
    const statuses = {
      on: 'TV ON',
      sleep: 'SLEEP',
      off: 'TV OFF',
    };
    setTvStatus(statuses[action] || 'READY');
  };

  const getTimerColor = () => {
    if (timer.remaining <= 60) return 'text-red-500';
    if (timer.remaining <= 300) return 'text-amber-500';
    return 'text-white';
  };

  const getStatusColor = () => {
    if (tvStatus === 'PLAYING') return 'text-emerald-500';
    if (tvStatus === 'PAUSED') return 'text-amber-500';
    if (tvStatus === 'TV OFF') return 'text-red-500';
    if (tvStatus === 'SLEEP') return 'text-cyan-500';
    return 'text-emerald-500';
  };

  return (
    <div className="card animate-slideIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${colors.bg} text-dark-bg px-2 py-1 rounded text-xs font-bold`}>
            {console.type}
          </span>
          <h3 className="font-bold text-lg">{console.name}</h3>
        </div>
        <span className={`text-sm font-bold ${getStatusColor()}`}>
          ● {tvStatus}
        </span>
      </div>

      {/* IP Display */}
      <div className="bg-dark-secondary rounded-lg p-2 mb-3 text-center">
        <span className="text-cyan-400 font-mono text-sm">
          🌐 {console.ip}:{console.port}
        </span>
      </div>

      {/* Timer Inputs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'JAM', value: hours, setter: setHours, max: 24 },
          { label: 'MNT', value: minutes, setter: setMinutes, max: 59 },
          { label: 'DTK', value: seconds, setter: setSeconds, max: 59 },
        ].map(({ label, value, setter, max }) => (
          <div key={label}>
            <label className="text-xs text-gray-400 block text-center">{label}</label>
            <input
              type="number"
              min="0"
              max={max}
              value={value}
              onChange={(e) => setter(Math.min(max, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full bg-dark-input text-center py-1 rounded border border-gray-700 focus:border-accent focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* Countdown Display */}
      <div className={`text-center text-3xl font-bold font-mono mb-2 ${getTimerColor()}`}>
        {formatTime(timer.remaining)}
      </div>

      {/* Price Display */}
      <div className="text-center text-emerald-500 font-bold text-xl mb-4">
        {formatCurrency(calculatePrice())}
      </div>

      {/* Timer Controls */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button onClick={handleStart} className="btn-success text-xs py-2 flex items-center justify-center gap-1">
          <Play size={14} /> START
        </button>
        <button onClick={handlePause} className="btn-warning text-xs py-2 flex items-center justify-center gap-1">
          <Pause size={14} /> PAUSE
        </button>
        <button onClick={handleAddTime} className="btn-info text-xs py-2 flex items-center justify-center gap-1">
          <Plus size={14} /> ADD
        </button>
      </div>

      {/* TV Controls */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button onClick={() => handleTVControl('on')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded transition flex items-center justify-center gap-1">
          <Tv size={12} /> ON
        </button>
        <button onClick={() => handleTVControl('sleep')} className="bg-amber-600 hover:bg-amber-700 text-white text-xs py-2 rounded transition flex items-center justify-center gap-1">
          <Moon size={12} /> SLEEP
        </button>
        <button onClick={() => handleTVControl('off')} className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded transition flex items-center justify-center gap-1">
          <Power size={12} /> OFF
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onFinish(console)} className="btn-primary text-xs py-2 flex items-center justify-center gap-1">
          <Receipt size={14} /> STRUK
        </button>
        <button onClick={() => onFinish(console, true)} className="btn-success text-xs py-2 flex items-center justify-center gap-1">
          <CheckCircle size={14} /> SELESAI
        </button>
        <button onClick={() => onDelete(console.id)} className="btn-danger text-xs py-2 flex items-center justify-center gap-1">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}