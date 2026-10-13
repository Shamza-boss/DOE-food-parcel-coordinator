export type Role = "owner" | "capturer" | "coordinator";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri";

export type PortionUnit = "g" | "ml" | "each";

export type PurchaseUom = "kg" | "L" | "box";

export interface SchoolType {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  unitSize: number;
  unitOfMeasure: PurchaseUom;
  /** How many portion units are inside one pack, such as fruit in one box. Null when the pack size already converts, for example kilograms to grams. */
  contentsPerPack: number | null;
  packWeightKg: number;
  perishable: boolean;
  consumptionDays: Weekday[];
}

export interface Portion {
  schoolTypeId: string;
  itemId: string;
  qtyPerLearner: number;
  unit: PortionUnit;
}

export interface GasDelivery {
  id: string;
  date: string;
  cylinderSizeKg: number;
  notes: string;
}

export interface School {
  id: string;
  name: string;
  schoolTypeId: string;
  learnerCount: number;
  gasDeliveries: GasDelivery[];
}

export interface Supplier {
  id: string;
  name: string;
  notes: string;
}

export interface PriceCapture {
  id: string;
  supplierId: string;
  itemId: string;
  price: number;
  unitSize: number;
  unitOfMeasure: PurchaseUom;
  /** Overrides the menu when this supplier's pack holds a different amount. */
  contentsPerPack: number | null;
  notes: string;
  capturedOn: string;
}

export interface Variation {
  id: string;
  year: number;
  month: number;
  label: string;
  amount: number;
  notes: string;
}

export interface OrderLineSnapshot {
  itemId: string;
  itemName: string;
  unitSize: number;
  unitOfMeasure: PurchaseUom;
  packWeightKg: number;
  price: number;
  supplierId: string | null;
  supplierName: string | null;
  priceSource: "cheapest" | "chosen" | "none";
  qtyPerLearner: number;
  portionUnit: PortionUnit;
  learnerCount: number;
  consumptionDays: Weekday[];
  perishable: boolean;
  dayCounts: Record<Weekday, number>;
  totalDays: number;
  requiredQty: number;
  quantityInUnit: number;
  contentsPerPack: number | null;
  learnersPerPack: number | null;
  contentsMissing: boolean;
  packsToBuy: number;
  lineCost: number;
}

export interface OrderSnapshot {
  schoolName: string;
  schoolTypeName: string;
  learnerCount: number;
  lines: OrderLineSnapshot[];
  foodCost: number;
}

export interface Order {
  id: string;
  schoolId: string;
  year: number;
  month: number;
  status: "open" | "closed";
  closedAt?: string;
  templateSourceId?: string;
  snapshot?: OrderSnapshot;
}

export interface DeliveryDrop {
  itemId: string;
  itemName: string;
  perishable: boolean;
  packs: number;
  weightKg: number;
  reason: string;
}

export interface DeliveryTrip {
  id: string;
  schoolId: string;
  schoolName: string;
  date: string;
  drops: DeliveryDrop[];
  weightKg: number;
  capacityKg: number;
  cost: number;
}

export interface DeliveryPlan {
  year: number;
  month: number;
  status: "draft" | "accepted";
  acceptedAt?: string;
  vehicleCapacityKg: number;
  deliveryCostZar: number;
  trips: DeliveryTrip[];
  totalCost: number;
  notes: string[];
  comment: string;
}

export interface Settings {
  vehicleCapacityKg: number;
  deliveryCostZar: number;
}

export interface AppState {
  schoolTypes: SchoolType[];
  items: MenuItem[];
  portions: Portion[];
  schools: School[];
  suppliers: Supplier[];
  prices: PriceCapture[];
  priceChoices: Record<string, string>;
  orders: Order[];
  plans: DeliveryPlan[];
  variations: Variation[];
  settings: Settings;
}
