export type StarchPreference = 'None' | 'Light' | 'Medium' | 'Heavy';
export type FoldingPreference = 'Hanger' | 'Folded' | 'Boxed';
export type FragrancePreference = 'Standard' | 'Fragrance-Free' | 'Extra Fresh';
export type CreasePreference = 'Single Crease' | 'No Crease' | 'Double Crease';

export interface CustomerPreferences {
  starch: StarchPreference;
  packaging: FoldingPreference;
  fragrance: FragrancePreference;
  crease: CreasePreference;
  specialInstructions: string;
}

export interface Customer {
  id: string; // Unique Customer ID e.g. "CUST-1001"
  name: string;
  phone: string;
  address?: string;
  preferences: CustomerPreferences;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  lastVisit?: string;
  notes?: string;
}

export type ServiceType = 'Dry Clean' | 'Steam Press' | 'Wash & Iron' | 'Stain Removal' | 'Special Care';

export interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  serviceType: ServiceType;
  unitPrice: number;
  totalPrice: number;
  color?: string;
  stainNotes?: string;
  specialCare?: string;
}

export type OrderStatus = 'Received' | 'In Process' | 'Ready for Pickup' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type PaymentMethod = 'Cash' | 'JazzCash' | 'EasyPaisa' | 'Card';

export interface Order {
  id: string; // Unique Slip ID e.g. "SLIP-1025"
  customerId: string; // Unique Customer ID e.g. "CUST-1001"
  customerName: string;
  customerPhone: string;
  bookingDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime?: string; // e.g. "After 7:00 pm"
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  advancePaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  rackLocation?: string; // e.g. "Rack A-04"
  customerPreferencesSnapshot: CustomerPreferences;
  urgent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: 'Men' | 'Women' | 'Household';
  defaultService: ServiceType;
  dryCleanPrice: number;
  pressPrice: number;
  washIronPrice: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Chemicals & Solvents' | 'Packaging & Hangers' | 'Tags & Stationery' | 'Detergents & Additives';
  currentStock: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked: string;
}

export interface ShopConfig {
  shopName: string;
  tagline: string;
  phone: string;
  businessHours: string;
  deliveryHours: string;
  addressLine1: string;
  addressLine2: string;
  currency: string;
}
