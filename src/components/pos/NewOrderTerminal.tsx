import React, { useState, useMemo } from 'react';
import { Customer, CatalogItem, Order, OrderItem, ServiceType, ShopConfig, CustomerPreferences } from '../../types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  UserPlus,
  Printer,
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  Shirt,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface NewOrderTerminalProps {
  customers: Customer[];
  catalog: CatalogItem[];
  shopConfig: ShopConfig;
  onSaveOrder: (newOrder: Order, updatedCustomer?: Customer) => void;
  onOpenSlipModal: (order: Order) => void;
  nextSlipNumber: number;
  nextCustomerNumber: number;
}

export const NewOrderTerminal: React.FC<NewOrderTerminalProps> = ({
  customers,
  catalog,
  shopConfig,
  onSaveOrder,
  onOpenSlipModal,
  nextSlipNumber,
  nextCustomerNumber,
}) => {
  // Customer selection state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomerModal, setIsNewCustomerModal] = useState(false);
  const [newCustError, setNewCustError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccessNotice, setOrderSuccessNotice] = useState('');
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    starch: 'Medium' as CustomerPreferences['starch'],
    packaging: 'Hanger' as CustomerPreferences['packaging'],
    fragrance: 'Standard' as CustomerPreferences['fragrance'],
    crease: 'Single Crease' as CustomerPreferences['crease'],
    specialInstructions: '',
  });

  // Current order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [catalogCategory, setCatalogCategory] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Local date formatting helpers (YYYY-MM-DD)
  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseLocalDate = (str: string): Date => {
    if (!str) return new Date();
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0); // safe noon time avoids any timezone/DST jumps
    }
    return new Date();
  };

  const addDaysToDate = (baseDateStr: string, daysToAdd: number): string => {
    const date = parseLocalDate(baseDateStr);
    date.setDate(date.getDate() + daysToAdd);
    return formatLocalDate(date);
  };

  const formatDisplayDate = (dateStr: string): string => {
    try {
      const d = parseLocalDate(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Order dates & logistics
  const todayStr = formatLocalDate(new Date());
  const defaultDelivery = addDaysToDate(todayStr, 2);

  const [bookingDate, setBookingDate] = useState(todayStr);
  const [deliveryDate, setDeliveryDate] = useState(defaultDelivery);
  const [deliveryTime, setDeliveryTime] = useState('After 7:00 pm');
  const [rackLocation, setRackLocation] = useState(`Rack ${String.fromCharCode(65 + (nextSlipNumber % 6))}-${(nextSlipNumber % 20) + 1}`);
  const [isUrgent, setIsUrgent] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Active preferences for this specific order
  const [activePreferences, setActivePreferences] = useState<CustomerPreferences>({
    starch: 'Medium',
    packaging: 'Hanger',
    fragrance: 'Standard',
    crease: 'Single Crease',
    specialInstructions: '',
  });

  // Payment state
  const [discount, setDiscount] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'JazzCash' | 'EasyPaisa' | 'Card'>('Cash');

  // Customer search filtering
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const query = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.phone.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
    );
  }, [customerSearch, customers]);

  // Catalog item filtering
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchCat = catalogCategory === 'All' || item.category === catalogCategory;
      const matchSearch =
        !catalogSearch.trim() || item.name.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalog, catalogCategory, catalogSearch]);

  // Select customer handler
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setActivePreferences({ ...cust.preferences });
    setCustomerSearch('');
  };

  // Add catalog item to order
  const handleAddItem = (item: CatalogItem, serviceType: ServiceType = 'Dry Clean') => {
    let unitPrice = item.dryCleanPrice;
    if (serviceType === 'Steam Press') unitPrice = item.pressPrice;
    if (serviceType === 'Wash & Iron') unitPrice = item.washIronPrice;

    // Check if item with same service already in cart
    const existingIndex = orderItems.findIndex(
      (oi) => oi.description === item.name && oi.serviceType === serviceType
    );

    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setOrderItems(updated);
    } else {
      const newItem: OrderItem = {
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        description: item.name,
        quantity: 1,
        serviceType,
        unitPrice,
        totalPrice: unitPrice,
        color: '',
        stainNotes: '',
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const updated = [...orderItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
      updated[index].totalPrice = newQty * updated[index].unitPrice;
    }
    setOrderItems(updated);
  };

  const updateItemService = (index: number, service: ServiceType) => {
    const updated = [...orderItems];
    const item = updated[index];
    // Find catalog base to get price
    const catItem = catalog.find((c) => c.name === item.description);
    let price = item.unitPrice;
    if (catItem) {
      if (service === 'Dry Clean') price = catItem.dryCleanPrice;
      else if (service === 'Steam Press') price = catItem.pressPrice;
      else if (service === 'Wash & Iron') price = catItem.washIronPrice;
    }
    updated[index].serviceType = service;
    updated[index].unitPrice = price;
    updated[index].totalPrice = item.quantity * price;
    setOrderItems(updated);
  };

  const updateItemNotes = (index: number, notes: string) => {
    const updated = [...orderItems];
    updated[index].specialCare = notes;
    setOrderItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  // Totals calculations
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  // Quick delivery date adjustments - based directly on current bookingDate
  const setDeliveryPreset = (daysFromBooking: number) => {
    const target = addDaysToDate(bookingDate, daysFromBooking);
    setDeliveryDate(target);
    if (daysFromBooking <= 1) setIsUrgent(true);
    else setIsUrgent(false);
  };

  // When bookingDate changes, keep deliveryDate sensible
  const handleBookingDateChange = (newBookingDate: string) => {
    setBookingDate(newBookingDate);
    if (newBookingDate && deliveryDate) {
      const b = parseLocalDate(newBookingDate);
      const d = parseLocalDate(deliveryDate);
      if (d <= b) {
        setDeliveryDate(addDaysToDate(newBookingDate, 2));
      }
    }
  };

  // Compute active preset days
  const activePresetDays = useMemo(() => {
    if (!bookingDate || !deliveryDate) return null;
    const b = parseLocalDate(bookingDate);
    const d = parseLocalDate(deliveryDate);
    const diff = Math.round((d.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [bookingDate, deliveryDate]);

  // Create new customer form submit
  const handleCreateCustomer = () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      setNewCustError('Please enter both customer name and phone number');
      return;
    }
    setNewCustError('');

    const newCust: Customer = {
      id: `CUST-${nextCustomerNumber}`,
      name: newCustomerForm.name.trim(),
      phone: newCustomerForm.phone.trim(),
      address: newCustomerForm.address,
      preferences: {
        starch: newCustomerForm.starch,
        packaging: newCustomerForm.packaging,
        fragrance: newCustomerForm.fragrance,
        crease: newCustomerForm.crease,
        specialInstructions: newCustomerForm.specialInstructions,
      },
      totalOrders: 0,
      totalSpent: 0,
      createdAt: todayStr,
      lastVisit: todayStr,
    };

    setSelectedCustomer(newCust);
    setActivePreferences(newCust.preferences);
    setIsNewCustomerModal(false);
    setOrderError('');
    setNewCustomerForm({
      name: '',
      phone: '',
      address: '',
      starch: 'Medium',
      packaging: 'Hanger',
      fragrance: 'Standard',
      crease: 'Single Crease',
      specialInstructions: '',
    });
  };

  // 1-Click Quick Walk-in Customer helper
  const handleQuickWalkIn = () => {
    const walkInCust: Customer = {
      id: `CUST-${nextCustomerNumber}`,
      name: 'Walk-in Customer',
      phone: '0300-0000000',
      address: 'Counter Order (DHA Karachi)',
      preferences: {
        starch: 'Medium',
        packaging: 'Hanger',
        fragrance: 'Standard',
        crease: 'Single Crease',
        specialInstructions: '',
      },
      totalOrders: 0,
      totalSpent: 0,
      createdAt: todayStr,
      lastVisit: todayStr,
    };
    setSelectedCustomer(walkInCust);
    setActivePreferences({ ...walkInCust.preferences });
    setCustomerSearch('');
    setOrderError('');
  };

  // Submit and create order
  const handleSaveAndGenerateSlips = () => {
    setOrderError('');

    if (orderItems.length === 0) {
      setOrderError('⚠️ Please select at least one garment from the catalog on the left to create an order.');
      return;
    }

    let customerToUse = selectedCustomer;

    // If no customer explicitly picked, check if something was typed in customerSearch
    if (!customerToUse) {
      const trimmed = customerSearch.trim();
      if (trimmed) {
        if (filteredCustomers.length > 0) {
          customerToUse = filteredCustomers[0];
          setSelectedCustomer(customerToUse);
          setActivePreferences({ ...customerToUse.preferences });
        } else {
          const isPhone = /^[0-9+ -]+$/.test(trimmed);
          const autoCust: Customer = {
            id: `CUST-${nextCustomerNumber}`,
            name: isPhone ? `Customer (${trimmed})` : trimmed,
            phone: isPhone ? trimmed : '0300-0000000',
            address: 'Counter Order',
            preferences: { ...activePreferences },
            totalOrders: 0,
            totalSpent: 0,
            createdAt: todayStr,
            lastVisit: todayStr,
          };
          customerToUse = autoCust;
          setSelectedCustomer(autoCust);
        }
      } else {
        // Automatically default to Walk-in Customer so the user is never stuck
        const walkInCust: Customer = {
          id: `CUST-${nextCustomerNumber}`,
          name: 'Walk-in Customer',
          phone: '0300-0000000',
          address: 'Counter Order',
          preferences: { ...activePreferences },
          totalOrders: 0,
          totalSpent: 0,
          createdAt: todayStr,
          lastVisit: todayStr,
        };
        customerToUse = walkInCust;
        setSelectedCustomer(walkInCust);
      }
    }

    const slipId = `SLIP-${nextSlipNumber}`;
    const paymentStatus: Order['paymentStatus'] =
      balanceDue === 0 ? 'Paid' : advancePaid > 0 ? 'Partial' : 'Unpaid';

    const newOrder: Order = {
      id: slipId,
      customerId: customerToUse.id,
      customerName: customerToUse.name,
      customerPhone: customerToUse.phone,
      bookingDate,
      deliveryDate,
      deliveryTime,
      items: [...orderItems],
      subtotal,
      discount,
      total: totalAmount,
      advancePaid,
      balanceDue,
      paymentStatus,
      paymentMethod,
      status: 'Received',
      rackLocation,
      customerPreferencesSnapshot: { ...activePreferences },
      urgent: isUrgent,
      notes: orderNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update customer stats
    const updatedCustomer: Customer = {
      ...customerToUse,
      totalOrders: customerToUse.totalOrders + 1,
      totalSpent: customerToUse.totalSpent + totalAmount,
      lastVisit: bookingDate,
      preferences: { ...activePreferences },
    };

    onSaveOrder(newOrder, updatedCustomer);
    onOpenSlipModal(newOrder);

    setOrderSuccessNotice(`✓ Slip ${slipId} Generated & Saved! Dual Slips ready for Customer Receipt & Side Tag.`);
    setTimeout(() => setOrderSuccessNotice(''), 6000);

    // Reset order form for next customer
    setOrderItems([]);
    setDiscount(0);
    setAdvancePaid(0);
    setOrderNotes('');
  };

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* LEFT COLUMN: Customer Selection & Catalog Grid (7 cols) */}
      <div className="col-span-12 lg:col-span-7 space-y-4">
        {/* Customer Header Card */}
        <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#1450A3] dark:text-cyan-400 flex items-center justify-center">
                <Shirt className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Customer & Booking</h2>
            </div>
            {selectedCustomer ? (
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-blue-700 dark:text-cyan-400 hover:text-blue-900 dark:hover:text-cyan-300 font-bold underline"
              >
                Change Customer
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickWalkIn}
                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg border border-amber-300 dark:border-amber-600/50 transition-colors shadow-2xs"
                  title="1-Click checkout for walk-in counter customer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  ⚡ Quick Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-[#1450A3] dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-700/50 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New Customer (CUST-{nextCustomerNumber})
                </button>
              </div>
            )}
          </div>

          {!selectedCustomer ? (
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Phone (0300...), Name, or ID (CUST-...), or type and press Enter"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredCustomers.length > 0) {
                        handleSelectCustomer(filteredCustomers[0]);
                      } else if (customerSearch.trim()) {
                        handleSaveAndGenerateSlips();
                      }
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1450A3] dark:focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Customer search results drop */}
              {customerSearch.trim() && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className="p-3 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{c.name}</span>
                            <span className="font-mono text-[10px] text-blue-700 dark:text-cyan-300 bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded font-semibold">
                              {c.id}
                            </span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{c.phone}</div>
                          {c.address && <div className="text-slate-400 dark:text-slate-500 text-[10px] truncate max-w-sm">{c.address}</div>}
                        </div>
                        <div className="text-right text-[11px]">
                          <div className="text-slate-600 dark:text-slate-300 font-medium">{c.totalOrders} past orders</div>
                          <div className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">Rs {c.totalSpent.toLocaleString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      No customer found with &ldquo;{customerSearch}&rdquo;.
                      <button
                        onClick={() => {
                          setNewCustomerForm({
                            ...newCustomerForm,
                            phone: customerSearch.match(/^\d+$/) ? customerSearch : '',
                            name: !customerSearch.match(/^\d+$/) ? customerSearch : '',
                          });
                          setIsNewCustomerModal(true);
                        }}
                        className="block mx-auto mt-2 text-blue-700 dark:text-cyan-400 font-bold hover:underline"
                      >
                        + Create Customer &ldquo;{customerSearch}&rdquo;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Selected customer banner */
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedCustomer.name}</span>
                  <span className="font-mono text-xs font-bold bg-[#1450A3] dark:bg-blue-600 text-white px-2 py-0.5 rounded shadow-2xs">
                    {selectedCustomer.id}
                  </span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {selectedCustomer.phone}
                  </span>
                </div>
                {selectedCustomer.address && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{selectedCustomer.address}</p>
                )}
              </div>

              {/* Customer Activity Info */}
              <div className="text-xs text-blue-900 dark:text-cyan-300 bg-white dark:bg-slate-900/90 border border-blue-200 dark:border-slate-700 px-3 py-1.5 rounded-md shadow-2xs">
                <div className="text-[10.5px] font-bold text-[#0A3275] dark:text-cyan-400">
                  Customer Activity
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">
                  Orders: <strong className="text-slate-900 dark:text-white">{selectedCustomer.totalOrders}</strong> · Total Spent:{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400">Rs {selectedCustomer.totalSpent.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Garment Catalog Grid */}
        <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Dry Cleaning & Press Catalog</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click item to add to bill slip</p>
            </div>

            {/* Catalog search */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search garment..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
            {['All', 'Men', 'Women', 'Household'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCatalogCategory(cat)}
                className={`px-3 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
                  catalogCategory === cat
                    ? 'bg-[#1450A3] dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                className="border border-slate-200 dark:border-slate-800 hover:border-[#1450A3] dark:hover:border-cyan-500/60 p-2.5 rounded-lg bg-white dark:bg-[#111A2E] hover:bg-blue-50/30 dark:hover:bg-slate-800/60 transition-all flex flex-col justify-between group shadow-2xs hover:shadow-md"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.category}</div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold font-mono text-[#0A3275] dark:text-cyan-400">
                      Rs {item.dryCleanPrice}
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Press: Rs {item.pressPrice}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddItem(item, 'Steam Press')}
                      title="Add as Steam Press"
                      className="px-1.5 py-1 text-[10px] bg-slate-100 dark:bg-purple-950/40 hover:bg-slate-200 dark:hover:bg-purple-900/60 text-slate-700 dark:text-purple-300 dark:border dark:border-purple-800/40 rounded font-medium transition-colors"
                    >
                      Press
                    </button>
                    <button
                      onClick={() => handleAddItem(item, 'Dry Clean')}
                      title="Add as Dry Clean"
                      className="px-2 py-1 text-[10px] bg-[#1450A3] hover:bg-blue-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 text-white rounded font-bold shadow-2xs hover:scale-105 transition-all"
                    >
                      + Clean
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Handling Instructions (Optional) */}
        {selectedCustomer && (
          <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs transition-colors">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1450A3] dark:text-cyan-400" />
              Special Handling Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Delicate fabric, stain on lapel, rush urgent delivery..."
              value={activePreferences.specialInstructions}
              onChange={(e) =>
                setActivePreferences({
                  ...activePreferences,
                  specialInstructions: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Active Order Slip Summary & Checkout (5 cols) */}
      <div className="col-span-12 lg:col-span-5 space-y-4">
        <div className="bg-white dark:bg-[#0D1527] rounded-xl border-2 border-[#1450A3] dark:border-cyan-500/60 p-4 shadow-sm dark:shadow-[0_0_25px_rgba(6,182,212,0.1)] flex flex-col h-full transition-colors">
          {/* Slip Header Banner */}
          <div className="flex items-center justify-between border-b border-blue-200 dark:border-slate-800 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#0A3275] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:to-blue-400 text-base">New Order Slip</span>
                <span className="font-mono text-xs font-bold bg-blue-100 dark:bg-blue-950 text-[#0A3275] dark:text-cyan-300 border dark:border-blue-800 px-2 py-0.5 rounded">
                  SLIP-{nextSlipNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedCustomer ? `For: ${selectedCustomer.name}` : 'Select customer on left'}
              </p>
            </div>

            {/* Quick Urgent switch */}
            <button
              onClick={() => setIsUrgent(!isUrgent)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                isUrgent
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isUrgent ? '★ URGENT ORDER' : 'Standard'}
            </button>
          </div>

          {/* Schedule Strip */}
          <div className="text-xs mb-3 p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Booking Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => handleBookingDateChange(e.target.value)}
                  className="w-full text-xs font-semibold p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs font-bold text-blue-900 dark:text-cyan-300 p-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Quick Delivery Presets Bar */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Quick Delivery Presets:</span>
              </div>

              <div className="grid grid-cols-5 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDeliveryPreset(1)}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                    activePresetDays === 1
                      ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-xs ring-1 ring-amber-700 dark:ring-amber-400'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                  }`}
                  title="1 Day Express delivery (urgent)"
                >
                  +1 Day
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryPreset(2)}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                    activePresetDays === 2
                      ? 'bg-[#1450A3] dark:bg-cyan-600 text-white shadow-xs ring-1 ring-blue-900 dark:ring-cyan-400'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-[#1450A3] dark:text-cyan-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                  }`}
                  title="2 Days standard turnaround"
                >
                  +2 Days
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryPreset(3)}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                    activePresetDays === 3
                      ? 'bg-[#1450A3] dark:bg-cyan-600 text-white shadow-xs ring-1 ring-blue-900 dark:ring-cyan-400'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                  title="3 Days turnaround"
                >
                  +3 Days
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryPreset(4)}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                    activePresetDays === 4
                      ? 'bg-[#1450A3] dark:bg-cyan-600 text-white shadow-xs ring-1 ring-blue-900 dark:ring-cyan-400'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                  title="4 Days turnaround"
                >
                  +4 Days
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryPreset(7)}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer font-bold ${
                    activePresetDays === 7
                      ? 'bg-[#1450A3] dark:bg-cyan-600 text-white shadow-xs ring-1 ring-blue-900 dark:ring-cyan-400'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                  title="1 Week turnaround"
                >
                  +7 Days
                </button>
              </div>

              {/* Clear Delivery Day & Date Indicator */}
              <div className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-950 p-2 rounded border border-blue-100 dark:border-slate-800 shadow-2xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Ready on:{' '}
                  <strong className="text-[#0A3275] dark:text-cyan-300 font-bold">
                    {formatDisplayDate(deliveryDate)}
                  </strong>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  {deliveryTime}
                  {activePresetDays !== null && activePresetDays > 0 ? ` (${activePresetDays}d)` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Items In Bill (Receipt Table Style) */}
          <div className="flex-1 min-h-[180px] max-h-[300px] overflow-y-auto border border-blue-200 dark:border-slate-800 rounded-lg divide-y divide-blue-100 dark:divide-slate-800/80 mb-3 bg-white dark:bg-slate-950">
            {orderItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                <Shirt className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p>No items added yet</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Select items from the catalog on the left</p>
              </div>
            ) : (
              orderItems.map((item, idx) => (
                <div key={item.id} className="p-2 hover:bg-blue-50/40 dark:hover:bg-slate-900/60 text-xs transition-colors">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span className="truncate flex-1">{item.description}</span>
                    <span className="font-mono text-blue-900 dark:text-cyan-400 ml-2 font-bold">Rs {item.totalPrice}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {/* Service selector badge */}
                    <div className="flex items-center gap-1">
                      <select
                        value={item.serviceType}
                        onChange={(e) => updateItemService(idx, e.target.value as ServiceType)}
                        className="text-[10px] font-semibold text-[#1450A3] dark:text-cyan-300 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded px-1 py-0.5 focus:outline-none"
                      >
                        <option value="Dry Clean">Dry Clean</option>
                        <option value="Steam Press">Steam Press</option>
                        <option value="Wash & Iron">Wash & Iron</option>
                        <option value="Special Care">Special Care</option>
                      </select>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">@ Rs {item.unitPrice}</span>
                    </div>

                    {/* Quantity counter */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateItemQuantity(idx, -1)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(idx, 1)}
                        className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-5 h-5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Optional notes input */}
                  <input
                    type="text"
                    placeholder="Item stain/color note (optional)..."
                    value={item.specialCare || ''}
                    onChange={(e) => updateItemNotes(idx, e.target.value)}
                    className="w-full text-[10px] text-slate-600 dark:text-slate-300 px-1.5 py-0.5 mt-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              ))
            )}
          </div>

          {/* Payment & Calculation Box */}
          <div className="bg-slate-50 dark:bg-slate-900/90 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-2 mb-3">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal ({orderItems.reduce((s, i) => s + i.quantity, 0)} pcs):</span>
              <span className="font-mono font-semibold dark:text-slate-200">Rs {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">Discount (Rs):</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                placeholder="0"
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-20 text-right p-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="flex justify-between font-extrabold text-slate-900 dark:text-slate-100 text-sm border-t border-slate-200 dark:border-slate-800 pt-1.5">
              <span>Total Payable:</span>
              <span className="font-mono text-[#0A3275] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:to-blue-400 font-black text-base">
                Rs {totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">Advance Paid:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={advancePaid || ''}
                  placeholder="0"
                  onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                  className="w-24 text-right p-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 rounded bg-emerald-50 dark:bg-emerald-950/40 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setAdvancePaid(totalAmount)}
                  className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold rounded"
                >
                  Full
                </button>
              </div>
            </div>

            <div className="flex justify-between font-bold text-xs pt-1">
              <span className="dark:text-slate-300">Balance Due at Delivery:</span>
              <span
                className={`font-mono text-sm font-black ${
                  balanceDue > 0 ? 'text-red-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                Rs {balanceDue.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Payment Mode:</span>
              <div className="flex gap-1 text-[10px]">
                {(['Cash', 'JazzCash', 'EasyPaisa', 'Card'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      paymentMethod === method
                        ? 'bg-[#1450A3] dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 text-white font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Error Notice if any */}
          {orderError && (
            <div className="p-2.5 mb-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg text-xs font-bold flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{orderError}</span>
            </div>
          )}

          {/* Order Success Notice */}
          {orderSuccessNotice && (
            <div className="p-2.5 mb-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{orderSuccessNotice}</span>
            </div>
          )}

          {/* Action Button: Generate Slips & Save */}
          <button
            type="button"
            onClick={handleSaveAndGenerateSlips}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#1450A3] via-[#1A62C6] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 active:scale-[0.99] text-white font-black rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Save & Generate Slips (SLIP-{nextSlipNumber})</span>
          </button>
        </div>
      </div>

      {/* MODAL: Create New Customer */}
      {isNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-[#0D1527] rounded-xl shadow-2xl w-full max-w-lg p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Register New Customer</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assigned Unique ID: <strong className="font-mono text-[#1450A3] dark:text-cyan-400">CUST-{nextCustomerNumber}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNewCustomerModal(false);
                  setNewCustError('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {newCustError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{newCustError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Asif Mehmood"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Phone Number (Karachi / Pak) *</label>
                <input
                  type="text"
                  placeholder="e.g. 03001234567"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Address / Society Area</label>
                <input
                  type="text"
                  placeholder="e.g. DHA Phase 2 / C Housing Society"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Customer Notes / Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Delicate garments, regular customer"
                  value={newCustomerForm.specialInstructions}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, specialInstructions: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsNewCustomerModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-4 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Create & Assign CUST-{nextCustomerNumber}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
