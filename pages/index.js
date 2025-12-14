import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, Download, Settings as SettingsIcon, FileText, BarChart3, ShoppingCart, Gamepad2 } from 'lucide-react';
import ConsoleCard from '../components/ConsoleCard';
import { storage } from '../utils/storage';
import STORAGE_KEYS from '../utils/storage';
import { formatCurrency, getCurrentDate, getCurrentTime, downloadTextFile, formatDuration, getCategoryColor } from '../utils/helpers';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [consoles, setConsoles] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState({
    price_ps3_hour: 5000,
    price_ps3_30min: 3000,
    price_ps4_hour: 7000,
    price_ps4_30min: 4000,
    price_ps5_hour: 9000,
    price_ps5_30min: 5000,
  });
  const [dailyLogs, setDailyLogs] = useState({});
  const [systemLogs, setSystemLogs] = useState([]);
  const [gridColumns, setGridColumns] = useState(3);

  // Form states
  const [consoleName, setConsoleName] = useState('PS 1');
  const [consoleIP, setConsoleIP] = useState('192.168.1.100');
  const [consolePort, setConsolePort] = useState('5555');
  const [consoleType, setConsoleType] = useState('PS4');

  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuCategory, setMenuCategory] = useState('Makanan');

  const [selectedConsole, setSelectedConsole] = useState('');
  const [currentOrder, setCurrentOrder] = useState({});

  const [logDate, setLogDate] = useState(getCurrentDate());
  const [showReceipt, setShowReceipt] = useState(null);

  // Load data from localStorage
  useEffect(() => {
    setConsoles(storage.get(STORAGE_KEYS.CONSOLES, []));
    setMenuItems(storage.get(STORAGE_KEYS.MENU_ITEMS, []));
    setSettings(storage.get(STORAGE_KEYS.SETTINGS, settings));
    setDailyLogs(storage.get(STORAGE_KEYS.DAILY_LOGS, {}));
    setSystemLogs(storage.get(STORAGE_KEYS.SYSTEM_LOGS, []));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    storage.set(STORAGE_KEYS.CONSOLES, consoles);
  }, [consoles]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.MENU_ITEMS, menuItems);
  }, [menuItems]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.DAILY_LOGS, dailyLogs);
  }, [dailyLogs]);

  useEffect(() => {
    storage.set(STORAGE_KEYS.SYSTEM_LOGS, systemLogs);
  }, [systemLogs]);

  const addLog = (message, category = 'INFO') => {
    const log = {
      timestamp: `${getCurrentDate()} ${getCurrentTime()}`,
      category,
      message,
    };
    setSystemLogs(prev => [...prev, log]);
  };

  // Console management
  const addConsole = () => {
    if (!consoleName || !consoleIP) {
      alert('Nama dan IP wajib diisi!');
      return;
    }

    const newConsole = {
      id: Date.now().toString(),
      name: consoleName,
      ip: consoleIP,
      port: consolePort,
      type: consoleType,
      timer: { running: false, remaining: 0, total: 0 },
      foodTotal: 0,
      foods: [],
      drinks: [],
      startTime: null,
    };

    setConsoles(prev => [...prev, newConsole]);
    setConsoleName(`PS ${consoles.length + 2}`);
    addLog(`Added console: ${consoleName} (${consoleType})`, 'CONSOLE');
  };

  const deleteConsole = (id) => {
    if (confirm('Hapus unit ini?')) {
      const console = consoles.find(c => c.id === id);
      setConsoles(prev => prev.filter(c => c.id !== id));
      addLog(`Deleted console: ${console?.name}`, 'CONSOLE');
    }
  };

  const updateConsoleTimer = (id, timer) => {
    setConsoles(prev => prev.map(c => 
      c.id === id ? { ...c, timer, startTime: c.startTime || getCurrentTime() } : c
    ));
  };

  // Menu management
  const addMenu = () => {
    if (!menuName || !menuPrice) {
      alert('Nama dan harga wajib diisi!');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: menuName,
      price: parseInt(menuPrice),
      category: menuCategory,
    };

    setMenuItems(prev => [...prev, newItem]);
    setMenuName('');
    setMenuPrice('');
    addLog(`Added menu: ${menuName} - ${formatCurrency(parseInt(menuPrice))}`, 'MENU');
  };

  const deleteMenu = (id) => {
    if (confirm('Hapus menu ini?')) {
      const item = menuItems.find(m => m.id === id);
      setMenuItems(prev => prev.filter(m => m.id !== id));
      addLog(`Deleted menu: ${item?.name}`, 'MENU');
    }
  };

  // Order management
  const addToOrder = (itemId) => {
    setCurrentOrder(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const calculateOrderTotal = () => {
    return Object.entries(currentOrder).reduce((total, [itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId);
      return total + (item ? item.price * qty : 0);
    }, 0);
  };

  const processOrder = () => {
    if (!selectedConsole || Object.keys(currentOrder).length === 0) {
      alert('Pilih unit dan tambahkan item!');
      return;
    }

    const foods = [];
    const drinks = [];
    let total = 0;

    Object.entries(currentOrder).forEach(([itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId);
      if (item) {
        total += item.price * qty;
        const orderText = `${item.name} x${qty}`;
        if (item.category === 'Minuman') {
          drinks.push(orderText);
        } else {
          foods.push(orderText);
        }
      }
    });

    setConsoles(prev => prev.map(c => 
      c.id === selectedConsole 
        ? { 
            ...c, 
            foodTotal: (c.foodTotal || 0) + total,
            foods: [...(c.foods || []), ...foods],
            drinks: [...(c.drinks || []), ...drinks],
          }
        : c
    ));

    addLog(`Order for ${consoles.find(c => c.id === selectedConsole)?.name}: ${formatCurrency(total)}`, 'ORDER');
    setCurrentOrder({});
    alert(`Order berhasil! Total: ${formatCurrency(total)}`);
  };

  const finishSession = (console, autoClose = false) => {
    const priceKey = `price_${console.type.toLowerCase()}`;
    const hourPrice = settings[`${priceKey}_hour`] || 7000;
    const halfPrice = settings[`${priceKey}_30min`] || 4000;
    
    const totalSec = console.timer?.total || 0;
    const h = Math.floor(totalSec / 3600);
    const half = Math.floor((totalSec % 3600) / 1800);
    
    const timePrice = (h * hourPrice) + (half * halfPrice);
    const foodPrice = console.foodTotal || 0;
    const total = timePrice + foodPrice;

    const sessionData = {
      unit: console.name,
      startTime: console.startTime || getCurrentTime(),
      endTime: getCurrentTime(),
      duration: formatDuration(totalSec),
      foods: console.foods || [],
      drinks: console.drinks || [],
      total,
      timePrice,
      foodPrice,
      hours: h,
      halfHours: half,
    };

    // Show receipt
    setShowReceipt(sessionData);

    if (autoClose) {
      // Add to daily log
      const today = getCurrentDate();
      setDailyLogs(prev => ({
        ...prev,
        [today]: [...(prev[today] || []), sessionData],
      }));

      // Reset console
      setConsoles(prev => prev.map(c => 
        c.id === console.id 
          ? {
              ...c,
              timer: { running: false, remaining: 0, total: 0 },
              foodTotal: 0,
              foods: [],
              drinks: [],
              startTime: null,
            }
          : c
      ));

      addLog(`Session finished: ${console.name} - ${formatCurrency(total)}`, 'FINISH');
    }
  };

  const exportDailyLog = () => {
    const logs = dailyLogs[logDate] || [];
    if (logs.length === 0) {
      alert('Tidak ada data!');
      return;
    }

    let content = `${'='.repeat(50)}\nLOG HARIAN - ${logDate}\n${'='.repeat(50)}\n\n`;
    let total = 0;

    logs.forEach((log, i) => {
      content += `[${i + 1}] ${log.unit}: ${log.startTime}-${log.endTime} (${log.duration})\n`;
      const fb = [...(log.foods || []), ...(log.drinks || [])].join(', ');
      if (fb) content += `    F&B: ${fb}\n`;
      content += `    Total: ${formatCurrency(log.total)}\n\n`;
      total += log.total;
    });

    content += `${'='.repeat(50)}\nTOTAL: ${formatCurrency(total)}\nSESI: ${logs.length}\n`;

    downloadTextFile(content, `log_${logDate}.txt`);
    addLog(`Exported daily log: ${logDate}`, 'EXPORT');
  };

  const resetAllData = () => {
    if (confirm('Reset semua data? Tindakan ini tidak dapat dibatalkan!')) {
      storage.clear();
      setConsoles([]);
      setMenuItems([]);
      setDailyLogs({});
      setSystemLogs([]);
      setCurrentOrder({});
      addLog('All data reset', 'SYSTEM');
      alert('Semua data telah direset!');
    }
  };

  // Render tabs
  const tabs = [
    { id: 'dashboard', icon: Gamepad2, label: 'Dashboard' },
    { id: 'menu', icon: ShoppingCart, label: 'Menu & Order' },
    { id: 'daily', icon: BarChart3, label: 'Log Harian' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    { id: 'log', icon: FileText, label: 'System Log' },
  ];

  return (
    <>
      <Head>
        <title>PS Rental Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="Sistem Manajemen Rental Playstation" />
      </Head>

      <div className="min-h-screen bg-dark-bg pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-dark-primary border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-accent-light">PLAYSTATION</h1>
                <p className="text-xs md:text-sm text-gray-400">Rental Management System</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-sm text-gray-400">{getCurrentDate()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation - Desktop */}
        <nav className="hidden md:block bg-dark-secondary border-b border-gray-800 sticky top-[72px] z-30">
          <div className="container mx-auto px-4">
            <div className="flex gap-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'text-white border-accent'
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="container mx-auto px-4 py-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              consoles={consoles}
              consoleName={consoleName}
              setConsoleName={setConsoleName}
              consoleIP={consoleIP}
              setConsoleIP={setConsoleIP}
              consolePort={consolePort}
              setConsolePort={setConsolePort}
              consoleType={consoleType}
              setConsoleType={setConsoleType}
              addConsole={addConsole}
              deleteConsole={deleteConsole}
              finishSession={finishSession}
              updateConsoleTimer={updateConsoleTimer}
              gridColumns={gridColumns}
              setGridColumns={setGridColumns}
              settings={settings}
            />
          )}

          {activeTab === 'menu' && (
            <MenuTab
              menuName={menuName}
              setMenuName={setMenuName}
              menuPrice={menuPrice}
              setMenuPrice={setMenuPrice}
              menuCategory={menuCategory}
              setMenuCategory={setMenuCategory}
              addMenu={addMenu}
              menuItems={menuItems}
              deleteMenu={deleteMenu}
              consoles={consoles}
              selectedConsole={selectedConsole}
              setSelectedConsole={setSelectedConsole}
              currentOrder={currentOrder}
              addToOrder={addToOrder}
              setCurrentOrder={setCurrentOrder}
              calculateOrderTotal={calculateOrderTotal}
              processOrder={processOrder}
            />
          )}

          {activeTab === 'daily' && (
            <DailyLogTab
              logDate={logDate}
              setLogDate={setLogDate}
              dailyLogs={dailyLogs}
              exportDailyLog={exportDailyLog}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              setSettings={setSettings}
              resetAllData={resetAllData}
            />
          )}

          {activeTab === 'log' && (
            <SystemLogTab logs={systemLogs} setLogs={setSystemLogs} />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-primary border-t border-gray-800 z-50">
          <div className="grid grid-cols-5">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-2 ${
                    activeTab === tab.id ? 'text-accent' : 'text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Receipt Modal */}
        {showReceipt && (
          <ReceiptModal receipt={showReceipt} onClose={() => setShowReceipt(null)} />
        )}
      </div>
    </>
  );
}

// Dashboard Tab Component
function DashboardTab({ 
  consoles, consoleName, setConsoleName, consoleIP, setConsoleIP,
  consolePort, setConsolePort, consoleType, setConsoleType,
  addConsole, deleteConsole, finishSession, updateConsoleTimer,
  gridColumns, setGridColumns, settings
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Panel - Add Form */}
      <div className="lg:col-span-1">
        <div className="card sticky top-32">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus size={20} className="text-accent" />
            Tambah Unit
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">NAMA UNIT</label>
              <input
                type="text"
                value={consoleName}
                onChange={(e) => setConsoleName(e.target.value)}
                className="input-field"
                placeholder="PS 1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">TIPE CONSOLE</label>
              <div className="grid grid-cols-3 gap-2">
                {['PS3', 'PS4', 'PS5'].map(type => (
                  <button
                    key={type}
                    onClick={() => setConsoleType(type)}
                    className={`py-2 rounded-lg font-bold transition ${
                      consoleType === type
                        ? type === 'PS3' ? 'bg-amber-500 text-white'
                        : type === 'PS4' ? 'bg-cyan-500 text-white'
                        : 'bg-purple-500 text-white'
                        : 'bg-dark-input text-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">IP ADDRESS</label>
              <input
                type="text"
                value={consoleIP}
                onChange={(e) => setConsoleIP(e.target.value)}
                className="input-field"
                placeholder="192.168.1.100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">PORT</label>
              <input
                type="text"
                value={consolePort}
                onChange={(e) => setConsolePort(e.target.value)}
                className="input-field"
                placeholder="5555"
              />
            </div>

            <button onClick={addConsole} className="btn-success w-full flex items-center justify-center gap-2">
              <Plus size={18} />
              Tambah Unit
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Console Grid */}
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">📺 Daftar Unit</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden md:inline">Kolom:</span>
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setGridColumns(num)}
                className={`w-8 h-8 rounded ${
                  gridColumns === num ? 'bg-accent text-white' : 'bg-dark-card text-gray-400'
                } font-bold`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {consoles.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">Belum ada unit. Tambahkan unit baru!</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridColumns} gap-4`}>
            {consoles.map(console => (
              <ConsoleCard
                key={console.id}
                console={console}
                onDelete={deleteConsole}
                onFinish={finishSession}
                onUpdateTimer={updateConsoleTimer}
                settings={settings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// Menu Tab Component
function MenuTab({
  menuName, setMenuName, menuPrice, setMenuPrice,
  menuCategory, setMenuCategory, addMenu, menuItems, deleteMenu,
  consoles, selectedConsole, setSelectedConsole, currentOrder,
  addToOrder, setCurrentOrder, calculateOrderTotal, processOrder
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Add Menu Form */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus size={20} className="text-accent" />
            Tambah Menu
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">NAMA</label>
              <input
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                className="input-field"
                placeholder="Nasi Goreng"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">HARGA</label>
              <input
                type="number"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                className="input-field"
                placeholder="15000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">KATEGORI</label>
              <select
                value={menuCategory}
                onChange={(e) => setMenuCategory(e.target.value)}
                className="input-field"
              >
                <option>Makanan</option>
                <option>Minuman</option>
                <option>Snack</option>
              </select>
            </div>

            <button onClick={addMenu} className="btn-success w-full">
              Tambah Menu
            </button>
          </div>
        </div>

        {/* Menu List */}
        <div className="card">
          <h3 className="font-bold mb-3">📋 Daftar Menu</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {menuItems.map(item => (
              <div key={item.id} className="bg-dark-secondary p-2 rounded flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`${getCategoryColor(item.category)} w-2 h-2 rounded-full`} />
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">{formatCurrency(item.price)}</span>
                  <button onClick={() => deleteMenu(item.id)} className="text-red-500 hover:text-red-400">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Order */}
      <div className="lg:col-span-3">
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-accent" />
            Buat Pesanan
          </h2>

          {/* Console Selector */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-400 block mb-2">Pilih Unit:</label>
            <select
              value={selectedConsole}
              onChange={(e) => setSelectedConsole(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">-- Pilih Unit --</option>
              {consoles.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Menu Grid */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-400 block mb-2">Pilih Menu:</label>
            {['Makanan', 'Minuman', 'Snack'].map(category => {
              const items = menuItems.filter(m => m.category === category);
              if (items.length === 0) return null;

              return (
                <div key={category} className="mb-4">
                  <h4 className={`text-sm font-bold mb-2 ${
                    category === 'Makanan' ? 'text-amber-500' :
                    category === 'Minuman' ? 'text-cyan-500' : 'text-purple-500'
                  }`}>
                    ── {category} ──
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => addToOrder(item.id)}
                        className="bg-dark-card hover:bg-dark-hover p-3 rounded-lg transition text-sm"
                      >
                        <div className="font-bold mb-1">{item.name}</div>
                        <div className="text-emerald-500 text-xs">{formatCurrency(item.price)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Order */}
          <div className="bg-dark-secondary rounded-lg p-4">
            <h4 className="font-bold mb-2">Pesanan Saat Ini:</h4>
            <div className="bg-dark-input p-3 rounded mb-3 min-h-24 max-h-32 overflow-y-auto">
              {Object.keys(currentOrder).length === 0 ? (
                <p className="text-gray-400 text-sm">Belum ada pesanan</p>
              ) : (
                <div className="space-y-1 text-sm font-mono">
                  {Object.entries(currentOrder).map(([itemId, qty]) => {
                    const item = menuItems.find(m => m.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex justify-between">
                        <span>{item.name} x{qty}</span>
                        <span className="text-emerald-500">{formatCurrency(item.price * qty)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-emerald-500">
                Total: {formatCurrency(calculateOrderTotal())}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentOrder({})}
                  className="btn-danger"
                >
                  Clear
                </button>
                <button 
                  onClick={processOrder}
                  className="btn-success"
                >
                  Proses Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Daily Log Tab Component
function DailyLogTab({ logDate, setLogDate, dailyLogs, exportDailyLog }) {
  const logs = dailyLogs[logDate] || [];
  const total = logs.reduce((sum, log) => sum + log.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-accent" />
            Log Harian
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="input-field"
            />
            <button onClick={exportDailyLog} className="btn-success flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Total Pendapatan</div>
          <div className="text-2xl font-bold text-emerald-500">{formatCurrency(total)}</div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Jumlah Sesi</div>
          <div className="text-2xl font-bold text-cyan-500">{logs.length}</div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Rata-rata/Sesi</div>
          <div className="text-2xl font-bold text-purple-500">
            {logs.length > 0 ? formatCurrency(Math.round(total / logs.length)) : formatCurrency(0)}
          </div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Tanggal</div>
          <div className="text-2xl font-bold text-amber-500">{logDate}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Tidak ada data untuk tanggal ini
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">No</th>
                <th className="text-left p-2">Unit</th>
                <th className="text-left p-2">Mulai</th>
                <th className="text-left p-2">Selesai</th>
                <th className="text-left p-2">Durasi</th>
                <th className="text-left p-2 hidden md:table-cell">F&B</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-dark-secondary' : ''}>
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2 font-bold">{log.unit}</td>
                  <td className="p-2 font-mono text-xs">{log.startTime}</td>
                  <td className="p-2 font-mono text-xs">{log.endTime}</td>
                  <td className="p-2">{log.duration}</td>
                  <td className="p-2 text-xs text-gray-400 hidden md:table-cell">
                    {[...(log.foods || []), ...(log.drinks || [])].join(', ') || '-'}
                  </td>
                  <td className="p-2 text-right font-bold text-emerald-500">
                    {formatCurrency(log.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ settings, setSettings, resetAllData }) {
  const updatePrice = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <SettingsIcon size={20} className="text-accent" />
          Pengaturan Harga
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3">Tipe</th>
                <th className="text-left p-3">Per Jam</th>
                <th className="text-left p-3">Per 30 Menit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'PS3', color: 'text-amber-500' },
                { type: 'PS4', color: 'text-cyan-500' },
                { type: 'PS5', color: 'text-purple-500' },
              ].map(({ type, color }) => {
                const key = type.toLowerCase();
                return (
                  <tr key={type} className="border-b border-gray-800">
                    <td className={`p-3 font-bold ${color}`}>{type}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={settings[`price_${key}_hour`]}
                        onChange={(e) => updatePrice(`price_${key}_hour`, e.target.value)}
                        className="input-field max-w-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={settings[`price_${key}_30min`]}
                        onChange={(e) => updatePrice(`price_${key}_30min`, e.target.value)}
                        className="input-field max-w-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => alert('Pengaturan tersimpan otomatis!')}
            className="btn-success"
          >
            💾 Simpan
          </button>
          <button 
            onClick={resetAllData}
            className="btn-danger"
          >
            🗑️ Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}

// System Log Tab Component
function SystemLogTab({ logs, setLogs }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText size={20} className="text-accent" />
          System Log
        </h2>
        <button 
          onClick={() => setLogs([])}
          className="btn-danger"
        >
          Clear Log
        </button>
      </div>

      <div className="bg-dark-secondary rounded-lg p-4 font-mono text-xs max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-400">No logs yet...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1">
              <span className="text-gray-500">[{log.timestamp}]</span>{' '}
              <span className={`font-bold ${
                log.category === 'ERROR' ? 'text-red-500' :
                log.category === 'WARNING' ? 'text-amber-500' :
                log.category === 'SUCCESS' ? 'text-emerald-500' :
                'text-cyan-500'
              }`}>[{log.category}]</span>{' '}
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Receipt Modal Component
function ReceiptModal({ receipt, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white text-black rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-dark-primary text-white p-6 text-center">
          <h2 className="text-2xl font-bold">RENTAL PLAYSTATION</h2>
          <p className="text-accent-light mt-1">{receipt.unit}</p>
          <p className="text-gray-400 text-sm mt-2">{getCurrentDate()} {getCurrentTime()}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-bold text-lg mb-2">BIAYA MAIN</h3>
            <p className="text-gray-600">
              {receipt.hours} jam + {receipt.halfHours} x 30mnt = {formatCurrency(receipt.timePrice)}
            </p>
          </div>

          {(receipt.foods?.length > 0 || receipt.drinks?.length > 0) && (
            <div>
              <h3 className="font-bold text-lg mb-2">Makanan & Minuman</h3>
              <ul className="text-gray-600 space-y-1">
                {[...(receipt.foods || []), ...(receipt.drinks || [])].map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
              <p className="text-right mt-2">Subtotal F&B: {formatCurrency(receipt.foodPrice)}</p>
            </div>
          )}

          <div className="border-t-2 border-dashed border-gray-300 pt-4">
            <h3 className="font-bold text-lg">TOTAL</h3>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(receipt.total)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button onClick={onClose} className="btn-primary w-full">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}