import React, { useState, useMemo } from 'react';
import { ShopConfig, CatalogItem } from '../../types';
import {
  Store,
  Edit2,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Check,
  Search,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';

interface ShopSettingsProps {
  shopConfig: ShopConfig;
  catalog: CatalogItem[];
  onUpdateShopConfig: (config: ShopConfig) => void;
  onUpdateCatalog: (catalog: CatalogItem[]) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetToDefault: () => void;
}

export const ShopSettings: React.FC<ShopSettingsProps> = ({
  shopConfig,
  catalog,
  onUpdateShopConfig,
  onUpdateCatalog,
  onExportData,
  onImportData,
  onResetToDefault,
}) => {
  const [configForm, setConfigForm] = useState<ShopConfig>({ ...shopConfig });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Search & category filter in catalog table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // New catalog item modal
  const [isAddCatModal, setIsAddCatModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [newCatItem, setNewCatItem] = useState<{
    name: string;
    category: CatalogItem['category'];
    defaultService: CatalogItem['defaultService'];
    dryCleanPrice: number;
    pressPrice: number;
    washIronPrice: number;
  }>({
    name: '',
    category: 'Men',
    defaultService: 'Dry Clean',
    dryCleanPrice: 350,
    pressPrice: 120,
    washIronPrice: 250,
  });

  // Editing existing item modal / inline
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Delete confirmation modal state (replaces window.confirm which is blocked in sandboxed iframes)
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShopConfig(configForm);
    showNotification('Shop information and slip print details updated!');
  };

  // Add new garment to catalog
  const handleAddCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCatItem.name.trim();

    if (!trimmedName) {
      setFormError('Please enter a garment name (e.g. Silk Kameez, Prince Coat)');
      return;
    }

    const newItem: CatalogItem = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      category: newCatItem.category,
      defaultService: newCatItem.defaultService,
      dryCleanPrice: Math.max(0, Number(newCatItem.dryCleanPrice) || 0),
      pressPrice: Math.max(0, Number(newCatItem.pressPrice) || 0),
      washIronPrice: Math.max(0, Number(newCatItem.washIronPrice) || 0),
    };

    onUpdateCatalog([newItem, ...catalog]);
    setIsAddCatModal(false);
    setFormError('');
    setNewCatItem({
      name: '',
      category: 'Men',
      defaultService: 'Dry Clean',
      dryCleanPrice: 350,
      pressPrice: 120,
      washIronPrice: 250,
    });

    showNotification(`"${newItem.name}" added to price catalog successfully!`);
  };

  // Save edited garment
  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    const updatedCatalog = catalog.map((item) =>
      item.id === editingItem.id ? { ...editingItem, name: editingItem.name.trim() } : item
    );

    onUpdateCatalog(updatedCatalog);
    showNotification(`"${editingItem.name}" updated successfully!`);
    setEditingItem(null);
  };

  // Confirm delete (in-app UI modal, immune to iframe sandbox restrictions)
  const confirmDelete = () => {
    if (!itemToDelete) return;
    const deletedName = itemToDelete.name;
    const filtered = catalog.filter((c) => c.id !== itemToDelete.id);
    onUpdateCatalog(filtered);
    setItemToDelete(null);
    showNotification(`"${deletedName}" removed from price catalog.`, 'info');
  };

  // Filtered catalog list
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchCategory = filterCategory === 'All' || item.category === filterCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.dryCleanPrice.toString().includes(q);
      return matchCategory && matchSearch;
    });
  }, [catalog, filterCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-cyan-300 border-blue-300 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-current" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Garment Catalog & Pricing Management (Primary User Request Focus) */}
      <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Garment Price Catalog (PKR / Rs)</h3>
              <span className="font-mono text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-[#0A3275] dark:text-cyan-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
                {catalog.length} Garments
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure and update rates for Dry Clean, Steam Press, and Washing in real-time
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError('');
              setIsAddCatModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white rounded-lg shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Garment</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Men', 'Women', 'Household'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? 'bg-[#1450A3] dark:bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search garment or price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10.5px] font-bold sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="p-3">Garment Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Dry Clean</th>
                <th className="p-3 text-right">Steam Press</th>
                <th className="p-3 text-right">Wash & Iron</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCatalog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No garments found matching &ldquo;{searchQuery}&rdquo;.
                    <button
                      type="button"
                      onClick={() => {
                        setNewCatItem((prev) => ({ ...prev, name: searchQuery }));
                        setIsAddCatModal(true);
                      }}
                      className="block mx-auto mt-2 text-[#1450A3] dark:text-cyan-400 font-bold hover:underline"
                    >
                      + Add &ldquo;{searchQuery}&rdquo; as new garment
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCatalog.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">ID: {item.id}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-900 dark:text-cyan-400">
                      Rs {item.dryCleanPrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 dark:text-purple-300 font-semibold">
                      Rs {item.pressPrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 dark:text-emerald-400">
                      Rs {item.washIronPrice.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...item })}
                          className="p-1.5 text-blue-700 dark:text-cyan-400 hover:bg-blue-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Edit Garment & Prices"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-red-500 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                          title="Delete Garment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shop Info Form (Receipt & Side Slip Print Header) */}
      <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#1450A3] dark:text-cyan-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Shop Information & Slip Print Header</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These details appear on both Customer Receipts and Side Slips
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Dry Cleaner Brand Name</label>
              <input
                type="text"
                value={configForm.shopName}
                onChange={(e) => setConfigForm({ ...configForm, shopName: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-[#0A3275] dark:text-cyan-400 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Official Slip Phone No</label>
              <input
                type="text"
                value={configForm.phone}
                onChange={(e) => setConfigForm({ ...configForm, phone: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Business Hours</label>
              <input
                type="text"
                value={configForm.businessHours}
                onChange={(e) => setConfigForm({ ...configForm, businessHours: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Delivery Time Tag</label>
              <input
                type="text"
                value={configForm.deliveryHours}
                onChange={(e) => setConfigForm({ ...configForm, deliveryHours: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Address Line 1</label>
              <input
                type="text"
                value={configForm.addressLine1}
                onChange={(e) => setConfigForm({ ...configForm, addressLine1: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Address Line 2 (City / Area)</label>
              <input
                type="text"
                value={configForm.addressLine2}
                onChange={(e) => setConfigForm({ ...configForm, addressLine2: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              Update Shop & Slip Details
            </button>
          </div>
        </form>
      </div>

      {/* Backup & System Data */}
      <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Data Backup & Restore</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export all customers, orders, price catalog, and slips into a JSON backup file
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportData}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
            Export Backup
          </button>

          <label className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
            Import Backup
            <input type="file" accept=".json" onChange={onImportData} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onResetToDefault}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-rose-400 rounded-lg text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Initial Data
          </button>
        </div>
      </div>

      {/* MODAL: ADD NEW GARMENT (Guaranteed Form Validation & Immediate State Update) */}
      {isAddCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#0D1527] rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#1450A3] dark:text-cyan-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Add New Garment to Catalog</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCatModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCatalogItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Garment Name / Description *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Silk Kurti, Velvet Shawl, Prince Coat"
                  value={newCatItem.name}
                  onChange={(e) => {
                    setNewCatItem({ ...newCatItem, name: e.target.value });
                    if (formError) setFormError('');
                  }}
                  autoFocus
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newCatItem.category}
                    onChange={(e) =>
                      setNewCatItem({
                        ...newCatItem,
                        category: e.target.value as CatalogItem['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Household">Household</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Default Service</label>
                  <select
                    value={newCatItem.defaultService}
                    onChange={(e) =>
                      setNewCatItem({
                        ...newCatItem,
                        defaultService: e.target.value as CatalogItem['defaultService'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="Dry Clean">Dry Clean</option>
                    <option value="Steam Press">Steam Press</option>
                    <option value="Wash & Iron">Wash & Iron</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Dry Clean (Rs) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newCatItem.dryCleanPrice}
                    onChange={(e) =>
                      setNewCatItem({ ...newCatItem, dryCleanPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-blue-900 dark:text-cyan-400 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Press Rate (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newCatItem.pressPrice}
                    onChange={(e) =>
                      setNewCatItem({ ...newCatItem, pressPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-semibold text-slate-700 dark:text-purple-300 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Wash & Iron (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newCatItem.washIronPrice}
                    onChange={(e) =>
                      setNewCatItem({ ...newCatItem, washIronPrice: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCatModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  Save Garment to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EXISTING GARMENT */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#0D1527] rounded-xl shadow-2xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#1450A3] dark:text-cyan-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Edit Garment & Prices</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Garment Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value as CatalogItem['category'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Household">Household</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Default Service</label>
                  <select
                    value={editingItem.defaultService}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        defaultService: e.target.value as CatalogItem['defaultService'],
                      })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="Dry Clean">Dry Clean</option>
                    <option value="Steam Press">Steam Press</option>
                    <option value="Wash & Iron">Wash & Iron</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Dry Clean (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editingItem.dryCleanPrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        dryCleanPrice: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-blue-900 dark:text-cyan-400 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Press Rate (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editingItem.pressPrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        pressPrice: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs font-semibold text-slate-700 dark:text-purple-300 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Wash & Iron (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editingItem.washIronPrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        washIronPrice: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-700 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION (Sandboxed iFrame Safe) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#0D1527] rounded-xl shadow-2xl w-full max-w-sm p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Delete Garment?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">&ldquo;{itemToDelete.name}&rdquo;</strong> from your dry cleaning price catalog?
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div>Category: <strong className="text-slate-800 dark:text-slate-200">{itemToDelete.category}</strong></div>
              <div>Dry Clean Rate: <strong className="font-mono text-blue-900 dark:text-cyan-400 font-bold">Rs {itemToDelete.dryCleanPrice}</strong></div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30 transition-colors"
              >
                Yes, Delete Garment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
