import React, { useState, useMemo } from 'react';
import { Customer, Order, CustomerPreferences } from '../../types';
import {
  Search,
  UserPlus,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shirt,
  Printer,
  ChevronRight,
  Edit2,
  Check,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface CustomerDirectoryProps {
  customers: Customer[];
  orders: Order[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onOpenNewOrderForCustomer: (customer: Customer) => void;
  onOpenSlipModal: (order: Order) => void;
  nextCustomerNumber: number;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  customers,
  orders,
  onSaveCustomer,
  onDeleteCustomer,
  onOpenNewOrderForCustomer,
  onOpenSlipModal,
  nextCustomerNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Active customer object
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Preference edit form state
  const [prefForm, setPrefForm] = useState<CustomerPreferences>(
    selectedCustomer?.preferences || {
      starch: 'Medium',
      packaging: 'Hanger',
      fragrance: 'Standard',
      crease: 'Single Crease',
      specialInstructions: '',
    }
  );

  // New customer modal state
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    starch: 'Medium' as CustomerPreferences['starch'],
    packaging: 'Hanger' as CustomerPreferences['packaging'],
    fragrance: 'Standard' as CustomerPreferences['fragrance'],
    crease: 'Single Crease' as CustomerPreferences['crease'],
    specialInstructions: '',
  });

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Orders for selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter((o) => o.customerId === selectedCustomer.id);
  }, [orders, selectedCustomer]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setPrefForm({ ...c.preferences });
    setIsEditingPreferences(false);
  };

  const handleSavePreferences = () => {
    if (!selectedCustomer) return;
    const updated: Customer = {
      ...selectedCustomer,
      preferences: prefForm,
    };
    onSaveCustomer(updated);
    setIsEditingPreferences(false);
  };

  const handleCreateCustomer = () => {
    if (!newCustForm.name.trim() || !newCustForm.phone.trim()) {
      setAddError('Please provide both full name and phone number.');
      return;
    }
    setAddError('');

    const newCust: Customer = {
      id: `CUST-${nextCustomerNumber}`,
      name: newCustForm.name.trim(),
      phone: newCustForm.phone.trim(),
      address: newCustForm.address,
      notes: newCustForm.notes,
      preferences: {
        starch: newCustForm.starch,
        packaging: newCustForm.packaging,
        fragrance: newCustForm.fragrance,
        crease: newCustForm.crease,
        specialInstructions: newCustForm.specialInstructions,
      },
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastVisit: new Date().toISOString().split('T')[0],
    };

    onSaveCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setPrefForm(newCust.preferences);
    setIsAddModalOpen(false);
    setNewCustForm({
      name: '',
      phone: '',
      address: '',
      notes: '',
      starch: 'Medium',
      packaging: 'Hanger',
      fragrance: 'Standard',
      crease: 'Single Crease',
      specialInstructions: '',
    });
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    const deletedName = customerToDelete.name;
    const deletedId = customerToDelete.id;
    onDeleteCustomer(deletedId);
    setCustomerToDelete(null);
    setDeleteNotice(`Customer "${deletedName}" (${deletedId}) was removed.`);
    setTimeout(() => setDeleteNotice(null), 3000);

    // If currently selected customer was deleted, pick another customer
    if (selectedCustomerId === deletedId) {
      const remaining = customers.filter((c) => c.id !== deletedId);
      if (remaining.length > 0) {
        setSelectedCustomerId(remaining[0].id);
        setPrefForm({ ...remaining[0].preferences });
      } else {
        setSelectedCustomerId('');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {deleteNotice && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{deleteNotice}</span>
          <button onClick={() => setDeleteNotice(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
      {/* LEFT: Customer List Panel (5 cols) */}
      <div className="col-span-12 lg:col-span-5 space-y-3">
        <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Customer Directory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {customers.length} registered profiles with unique IDs
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white rounded-lg transition-all shadow-md shadow-blue-500/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Customer
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID (CUST-...), Phone, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* Customer list items */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredCustomers.map((cust) => {
              const isSelected = cust.id === selectedCustomerId;

              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#1450A3] dark:border-cyan-500/80 bg-blue-50/70 dark:bg-cyan-950/25 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111A2E] hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{cust.name}</span>
                        <span className="font-mono text-[10px] font-bold bg-[#1450A3] dark:bg-blue-600 text-white px-1.5 py-0.2 rounded shadow-2xs">
                          {cust.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{cust.phone}</div>
                    </div>

                    <div className="text-right text-[11px] flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#0A3275] dark:text-emerald-400">
                          Rs {cust.totalSpent.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(cust);
                          }}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                          title={`Delete ${cust.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px]">{cust.totalOrders} orders</div>
                    </div>
                  </div>

                  {/* Quick info */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400">
                    <span className="truncate max-w-[180px] text-slate-500 dark:text-slate-400">
                      {cust.address || 'Karachi'}
                    </span>
                    {cust.lastVisit && (
                      <span className="text-slate-400 dark:text-slate-500">Last: {cust.lastVisit}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Selected Customer Profile, Preferences & History (7 cols) */}
      <div className="col-span-12 lg:col-span-7 space-y-4">
        {selectedCustomer ? (
          <>
            {/* Customer Details Card */}
            <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{selectedCustomer.name}</h3>
                    <span className="font-mono text-xs font-bold bg-blue-100 dark:bg-cyan-950/80 text-[#0A3275] dark:text-cyan-300 border border-blue-300 dark:border-cyan-700/60 px-2.5 py-0.5 rounded">
                      {selectedCustomer.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {selectedCustomer.phone}
                    </span>
                    {selectedCustomer.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {selectedCustomer.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(selectedCustomer)}
                    className="px-3 py-2 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="Delete this customer profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Customer</span>
                  </button>

                  <button
                    onClick={() => onOpenNewOrderForCustomer(selectedCustomer)}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    New Order with This Customer
                  </button>
                </div>
              </div>

              {/* Stats KPI */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Orders</div>
                  <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedCustomer.totalOrders}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Spent</div>
                  <div className="font-mono text-base font-black text-[#0A3275] dark:text-emerald-400 mt-0.5">
                    Rs {selectedCustomer.totalSpent.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Customer Since</div>
                  <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    {selectedCustomer.createdAt}
                  </div>
                </div>
              </div>

              {/* Customer Handling Instructions & Notes */}
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#1450A3] dark:text-cyan-400" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                      Customer Handling Notes & Instructions
                    </h4>
                  </div>
                  {!isEditingPreferences ? (
                    <button
                      onClick={() => setIsEditingPreferences(true)}
                      className="text-xs text-[#1450A3] dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit Notes
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingPreferences(false)}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePreferences}
                        className="px-2.5 py-1 bg-[#1450A3] dark:bg-cyan-600 text-white rounded text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingPreferences ? (
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 min-h-[44px] flex items-center">
                    {selectedCustomer.preferences?.specialInstructions ? (
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedCustomer.preferences.specialInstructions}</p>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">No special instructions or notes recorded for this customer</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 text-xs">
                    <label className="text-[11px] text-slate-600 dark:text-slate-400 font-bold block">
                      Special Handling Instructions / Notes:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Delicate fabric, stain on lapel, rush urgent delivery"
                      value={prefForm.specialInstructions}
                      onChange={(e) =>
                        setPrefForm({ ...prefForm, specialInstructions: e.target.value })
                      }
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Customer Order History Table */}
            <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
                Order History ({customerOrders.length} slips on record)
              </h3>

              {customerOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No orders recorded yet for this customer
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {order.id}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {order.bookingDate} → {order.deliveryDate}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              order.status === 'Ready for Pickup'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : order.status === 'Delivered'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} garments:{' '}
                          {order.items.map((i) => `${i.quantity}x ${i.description}`).join(', ')}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            Rs {order.total.toLocaleString()}
                          </div>
                          <div className="text-[10px]">
                            {order.balanceDue > 0 ? (
                              <span className="text-red-700 dark:text-rose-400 font-semibold font-mono">
                                Bal: Rs {order.balanceDue}
                              </span>
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Paid</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenSlipModal(order)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-cyan-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          title="Reprint Slips"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500">
            Select a customer from the left to view profile and order history.
          </div>
        )}
      </div>
      </div>

      {/* MODAL: Register New Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#0D1527] rounded-xl shadow-2xl w-full max-w-lg p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Add New Customer Profile</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unique Customer ID: <strong className="font-mono text-[#1450A3] dark:text-cyan-400">CUST-{nextCustomerNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold">
                {addError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Asad Ullah Khan"
                  value={newCustForm.name}
                  onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 03001234567"
                  value={newCustForm.phone}
                  onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Address / Society</label>
                <input
                  type="text"
                  placeholder="e.g. Defence Phase 2 / Karachi"
                  value={newCustForm.address}
                  onChange={(e) => setNewCustForm({ ...newCustForm, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Customer Handling Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Delicate garments, regular counter customer"
                  value={newCustForm.specialInstructions}
                  onChange={(e) =>
                    setNewCustForm({ ...newCustForm, specialInstructions: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-4 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Save Profile (CUST-{nextCustomerNumber})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CUSTOMER CONFIRMATION (Sandboxed iFrame Safe) */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#0D1527] rounded-xl shadow-2xl w-full max-w-sm p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Delete Customer Profile?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{customerToDelete.name}</strong> (<span className="font-mono font-bold text-[#1450A3] dark:text-cyan-400">{customerToDelete.id}</span>)?
            </p>

            <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div>Phone: <strong className="font-mono text-slate-800 dark:text-slate-200">{customerToDelete.phone}</strong></div>
              <div>Past Orders: <strong className="font-mono text-slate-800 dark:text-slate-200">{customerToDelete.totalOrders}</strong></div>
              <div>Total Spent: <strong className="font-mono text-blue-900 dark:text-emerald-400 font-bold">Rs {customerToDelete.totalSpent.toLocaleString()}</strong></div>
            </div>

            <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800/60">
              All saved preferences and records for this customer ID will be removed.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30 transition-colors"
              >
                Yes, Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
