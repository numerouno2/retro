import { format } from 'date-fns';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}j ${m}m`;
};

export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getCurrentTime = () => {
  return format(new Date(), 'HH:mm:ss');
};

export const downloadTextFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const getConsoleColor = (type) => {
  const colors = {
    PS3: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
    PS4: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' },
    PS5: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
  };
  return colors[type] || colors.PS4;
};

export const getCategoryColor = (category) => {
  const colors = {
    'Makanan': 'bg-amber-500',
    'Minuman': 'bg-cyan-500',
    'Snack': 'bg-purple-500',
  };
  return colors[category] || 'bg-gray-500';
};