import React, { useState, useEffect } from 'react';
import {
  Customer,
  Order,
  CatalogItem,
  ShopConfig,
  OrderStatus,
} from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_CATALOG,
  INITIAL_SHOP_CONFIG,
} from './data/initialData';
import { NewOrderTerminal } from './components/pos/NewOrderTerminal';
import { CustomerDirectory } from './components/customers/CustomerDirectory';
import { DailyReports } from './components/reports/DailyReports';
import { ShopSettings } from './components/settings/ShopSettings';
import { SlipModal } from './components/slips/SlipModal';
import {
  Shirt,
  Users,
  BarChart3,
  Settings,
  Plus,
  Printer,
  Search,
  CheckCircle,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  // Local storage state with initial fallbacks
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('elite_pos_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('elite_pos_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const saved = localStorage.getItem('elite_pos_catalog');
    if (!saved) return INITIAL_CATALOG;
    try {
      const parsed: any[] = JSON.parse(saved);
      return parsed.map((item) => {
        if (item.category === 'Traditional' || item.category === 'Outerwear') {
          return {
            ...item,
            category: item.name.toLowerCase().includes('shawl') ? 'Women' : 'Men',
          };
        }
        return item;
      });
    } catch {
      return INITIAL_CATALOG;
    }
  });

  const [shopConfig, setShopConfig] = useState<ShopConfig>(() => {
    const saved = localStorage.getItem('elite_pos_shop_config');
    return saved ? JSON.parse(saved) : INITIAL_SHOP_CONFIG;
  });

  // Navigation tab: POS, Customers & History, Daily Reports, Settings
  const [activeTab, setActiveTab] = useState<
    'pos' | 'customers' | 'reports' | 'settings'
  >('pos');

  // Slip modal state
  const [activeSlipOrder, setActiveSlipOrder] = useState<Order | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Quick slip search input
  const [quickSlipSearch, setQuickSlipSearch] = useState('');

  // Dark / Light Theme state (Default to dark as requested)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('elite_pos_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('elite_pos_theme', theme);
  }, [theme]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('elite_pos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('elite_pos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('elite_pos_catalog', JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem('elite_pos_shop_config', JSON.stringify(shopConfig));
  }, [shopConfig]);

  // Compute next slip and customer numbers
  const nextSlipNumber = React.useMemo(() => {
    const nums = orders.map((o) => {
      const match = o.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 1000;
    });
    return Math.max(1025, ...nums) + 1;
  }, [orders]);

  const nextCustomerNumber = React.useMemo(() => {
    const nums = customers.map((c) => {
      const match = c.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 1000;
    });
    return Math.max(1005, ...nums) + 1;
  }, [customers]);

  // Order Handlers
  const handleSaveOrder = (newOrder: Order, updatedCustomer?: Customer) => {
    setOrders((prev) => [newOrder, ...prev]);

    if (updatedCustomer) {
      setCustomers((prev) => {
        const index = prev.findIndex((c) => c.id === updatedCustomer.id);
        if (index > -1) {
          const copy = [...prev];
          copy[index] = updatedCustomer;
          return copy;
        } else {
          return [updatedCustomer, ...prev];
        }
      });
    }
  };

  const handleOpenSlipModal = (order: Order) => {
    setActiveSlipOrder(order);
    setIsSlipModalOpen(true);
  };

  // Customer Handlers
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const index = prev.findIndex((c) => c.id === customer.id);
      if (index > -1) {
        const copy = [...prev];
        copy[index] = customer;
        return copy;
      }
      return [customer, ...prev];
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const handleOpenNewOrderForCustomer = (customer: Customer) => {
    setActiveTab('pos');
  };

  // Quick slip search
  const handleQuickSlipLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSlipSearch.trim()) return;
    const clean = quickSlipSearch.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === clean ||
        o.id.toLowerCase() === `slip-${clean}` ||
        o.customerPhone.includes(clean)
    );

    if (found) {
      handleOpenSlipModal(found);
      setQuickSlipSearch('');
    }
  };

  // Export & Import backup
  const handleExportData = () => {
    const data = {
      customers,
      orders,
      catalog,
      shopConfig,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Elite_POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.catalog) setCatalog(parsed.catalog);
        if (parsed.shopConfig) setShopConfig(parsed.shopConfig);
      } catch (err) {
        console.error('Invalid JSON file format', err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    localStorage.clear();
    setCustomers(INITIAL_CUSTOMERS);
    setOrders(INITIAL_ORDERS);
    setCatalog(INITIAL_CATALOG);
    setShopConfig(INITIAL_SHOP_CONFIG);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* TOP BAR: Brand Zone — Nav Links — Quick Search, Theme Toggle & Primary Action */}
      <header className="bg-white/95 dark:bg-[#0D1527]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 print:hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single text element wordmark with icon */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1450A3] via-[#1A62C6] to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <Shirt className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-[#0A3275] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-300 block leading-none">
                ELITE CLASSIC
              </span>
              <span className="text-[10px] font-extrabold tracking-widest text-[#1971C2] dark:text-cyan-400 uppercase flex items-center gap-1">
                <span>DRY CLEANER POS</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </span>
            </div>
          </button>

          {/* Zone 2: Concise navigation links with colorful accents */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'pos'
                  ? 'bg-blue-50 dark:bg-blue-600/20 text-[#1450A3] dark:text-cyan-300 font-bold border border-blue-200/60 dark:border-cyan-500/40 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              POS Terminal
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                activeTab === 'customers'
                  ? 'bg-blue-50 dark:bg-indigo-600/20 text-[#1450A3] dark:text-indigo-300 font-bold border border-blue-200/60 dark:border-indigo-500/40 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>Customers & History</span>
              <span className="bg-[#1450A3] dark:bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shadow-xs">
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-50 dark:bg-emerald-600/20 text-[#1450A3] dark:text-emerald-300 font-bold border border-blue-200/60 dark:border-emerald-500/40 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Daily Reports
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-50 dark:bg-purple-600/20 text-[#1450A3] dark:text-purple-300 font-bold border border-blue-200/60 dark:border-purple-500/40 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Settings & Prices
            </button>
          </nav>

          {/* Zone 3: Quick Slip Lookup, Theme Toggle & Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Slip Finder */}
            <form onSubmit={handleQuickSlipLookup} className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Slip # (e.g. 1039)..."
                value={quickSlipSearch}
                onChange={(e) => setQuickSlipSearch(e.target.value)}
                className="w-36 pl-7 pr-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400 dark:text-slate-500" />
            </form>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all shadow-xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Dark/Light Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('pos');
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#1450A3] to-blue-600 dark:from-blue-600 dark:to-cyan-600 hover:from-[#0A3275] hover:to-blue-700 dark:hover:from-blue-500 dark:hover:to-cyan-500 rounded-lg transition-all whitespace-nowrap shrink-0 shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Order Slip</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-200 dark:border-slate-800 py-1.5 px-2 bg-slate-50 dark:bg-[#0a101f] text-[11px] font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1 rounded ${activeTab === 'pos' ? 'bg-blue-100 dark:bg-blue-900/60 text-[#1450A3] dark:text-cyan-300' : ''}`}
          >
            POS Terminal
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1 rounded ${activeTab === 'customers' ? 'bg-blue-100 dark:bg-indigo-900/60 text-[#1450A3] dark:text-indigo-300' : ''}`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1 rounded ${activeTab === 'reports' ? 'bg-blue-100 dark:bg-emerald-900/60 text-[#1450A3] dark:text-emerald-300' : ''}`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 rounded ${activeTab === 'settings' ? 'bg-blue-100 dark:bg-purple-900/60 text-[#1450A3] dark:text-purple-300' : ''}`}
          >
            Settings
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 print:p-0 print:m-0">
        {activeTab === 'pos' && (
          <NewOrderTerminal
            customers={customers}
            catalog={catalog}
            shopConfig={shopConfig}
            onSaveOrder={handleSaveOrder}
            onOpenSlipModal={handleOpenSlipModal}
            nextSlipNumber={nextSlipNumber}
            nextCustomerNumber={nextCustomerNumber}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerDirectory
            customers={customers}
            orders={orders}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onOpenNewOrderForCustomer={handleOpenNewOrderForCustomer}
            onOpenSlipModal={handleOpenSlipModal}
            nextCustomerNumber={nextCustomerNumber}
          />
        )}

        {activeTab === 'reports' && (
          <DailyReports
            orders={orders}
            customers={customers}
            shopConfig={shopConfig}
          />
        )}

        {activeTab === 'settings' && (
          <ShopSettings
            shopConfig={shopConfig}
            catalog={catalog}
            onUpdateShopConfig={setShopConfig}
            onUpdateCatalog={setCatalog}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetToDefault={handleResetToDefault}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-[#0D1527] border-t border-slate-200 dark:border-slate-800/80 py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 print:hidden mt-auto transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; 2026 Elite Classic Dry Cleaners — Karachi Defence Phase 2 POS System
          </div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-medium">
            <span className="text-cyan-600 dark:text-cyan-400">Customer Unique ID Automated</span>
            <span>·</span>
            <span className="text-blue-600 dark:text-blue-400">Dual Slip Generator</span>
            <span>·</span>
            <span className="text-emerald-600 dark:text-emerald-400">Customer Preference Engine</span>
          </div>
        </div>
      </footer>

      {/* SLIP MODAL (Customer Receipt & Side Slip) */}
      <SlipModal
        order={activeSlipOrder}
        shopConfig={shopConfig}
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
      />
    </div>
  );
}
