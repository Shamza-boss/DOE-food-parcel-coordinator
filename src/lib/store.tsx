"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildDeliveryPlan } from "./delivery";
import { todayISO, uid } from "./format";
import { buildLines, orderId, schoolTypeName } from "./order";
import { sumFoodCost } from "./calc";
import { seedState } from "./seed";
import type {
  AppState,
  DeliveryPlan,
  MenuItem,
  PortionUnit,
  PurchaseUom,
  Role,
  School,
  Weekday,
} from "./types";

const STORAGE_KEY = "doe-fpc-v1";
const ROLE_KEY = "doe-fpc-role";

export type Action =
  | "schools"
  | "menu"
  | "orders"
  | "variations"
  | "prices"
  | "deliveries"
  | "gas"
  | "accept";

export function can(role: Role, action: Action): boolean {
  if (action === "prices") return role === "capturer";
  if (action === "deliveries") return role === "coordinator" || role === "owner";
  if (action === "gas") return role === "coordinator" || role === "owner";
  if (action === "accept") return role === "owner";
  return role === "owner";
}

interface StoreValue {
  ready: boolean;
  role: Role;
  setRole: (role: Role) => void;
  state: AppState;
  reset: () => void;
  addSchoolType: (name: string) => void;
  addSchool: (school: Omit<School, "id" | "gasDeliveries">) => void;
  updateSchool: (id: string, patch: Partial<Pick<School, "name" | "schoolTypeId" | "learnerCount">>) => void;
  addGas: (schoolId: string, delivery: { date: string; cylinderSizeKg: number; notes: string }) => void;
  updateItem: (id: string, patch: Partial<MenuItem>) => void;
  addItem: (item: Omit<MenuItem, "id">) => void;
  upsertPortion: (schoolTypeId: string, itemId: string, qtyPerLearner: number, unit: PortionUnit) => void;
  addSupplier: (name: string, notes: string) => string;
  updateSupplier: (id: string, patch: { name?: string; notes?: string }) => void;
  addPrice: (input: {
    supplierId: string;
    itemId: string;
    price: number;
    unitSize: number;
    unitOfMeasure: PurchaseUom;
    notes: string;
  }) => void;
  reuseSupplierPrices: (supplierId: string) => number;
  choosePrice: (itemId: string, priceId: string | null) => void;
  ensureOrders: (year: number, month: number) => void;
  closeOrder: (id: string) => void;
  reopenOrder: (id: string) => void;
  useAsTemplate: (sourceId: string, year: number, month: number) => string | null;
  addVariation: (input: { year: number; month: number; label: string; amount: number; notes: string }) => void;
  removeVariation: (id: string) => void;
  updateSettings: (patch: Partial<AppState["settings"]>) => void;
  savePlan: (plan: DeliveryPlan) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): AppState {
  const seed = seedState();
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.schools)) return seed;
    return {
      ...seed,
      ...parsed,
      settings: { ...seed.settings, ...parsed.settings },
      priceChoices: parsed.priceChoices ?? {},
    };
  } catch {
    return seed;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRoleState] = useState<Role>("owner");
  const [state, setState] = useState<AppState>(seedState);

  useEffect(() => {
    setState(loadState());
    const stored = window.localStorage.getItem(ROLE_KEY);
    if (stored === "owner" || stored === "capturer" || stored === "coordinator") setRoleState(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const value = useMemo<StoreValue>(() => {
    const update = (fn: (current: AppState) => AppState) => setState(fn);
    return {
      ready,
      role,
      state,
      setRole: (next) => {
        setRoleState(next);
        window.localStorage.setItem(ROLE_KEY, next);
      },
      reset: () => setState(seedState()),
      addSchoolType: (name) =>
        update((current) => ({
          ...current,
          schoolTypes: [...current.schoolTypes, { id: uid("type"), name: name.trim() }],
        })),
      addSchool: (school) =>
        update((current) => ({
          ...current,
          schools: [...current.schools, { ...school, id: uid("school"), gasDeliveries: [] }],
        })),
      updateSchool: (id, patch) =>
        update((current) => ({
          ...current,
          schools: current.schools.map((school) => (school.id === id ? { ...school, ...patch } : school)),
        })),
      addGas: (schoolId, delivery) =>
        update((current) => ({
          ...current,
          schools: current.schools.map((school) =>
            school.id === schoolId
              ? { ...school, gasDeliveries: [{ id: uid("gas"), ...delivery }, ...school.gasDeliveries] }
              : school,
          ),
        })),
      updateItem: (id, patch) =>
        update((current) => ({
          ...current,
          items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addItem: (item) =>
        update((current) => ({
          ...current,
          items: [...current.items, { ...item, id: uid("item") }],
        })),
      upsertPortion: (schoolTypeId, itemId, qtyPerLearner, unit) =>
        update((current) => {
          const existing = current.portions.some(
            (portion) => portion.schoolTypeId === schoolTypeId && portion.itemId === itemId,
          );
          const portions = existing
            ? current.portions.map((portion) =>
                portion.schoolTypeId === schoolTypeId && portion.itemId === itemId
                  ? { ...portion, qtyPerLearner, unit }
                  : portion,
              )
            : [...current.portions, { schoolTypeId, itemId, qtyPerLearner, unit }];
          return { ...current, portions };
        }),
      addSupplier: (name, notes) => {
        const id = uid("supplier");
        update((current) => ({
          ...current,
          suppliers: [...current.suppliers, { id, name: name.trim(), notes }],
        }));
        return id;
      },
      updateSupplier: (id, patch) =>
        update((current) => ({
          ...current,
          suppliers: current.suppliers.map((supplier) => (supplier.id === id ? { ...supplier, ...patch } : supplier)),
        })),
      addPrice: (input) =>
        update((current) => ({
          ...current,
          prices: [
            {
              id: uid("price"),
              ...input,
              capturedOn: todayISO(),
            },
            ...current.prices,
          ],
        })),
      reuseSupplierPrices: (supplierId) => {
        const today = todayISO();
        const additions = state.items.flatMap((item) => {
          const latest = state.prices
            .filter((price) => price.supplierId === supplierId && price.itemId === item.id)
            .sort((a, b) => b.capturedOn.localeCompare(a.capturedOn) || b.id.localeCompare(a.id))[0];
          if (!latest || latest.capturedOn === today) return [];
          return [
            {
              ...latest,
              id: uid("price"),
              capturedOn: today,
              notes: latest.notes ? `Reused. ${latest.notes}` : `Reused from ${latest.capturedOn}.`,
            },
          ];
        });
        if (additions.length > 0) {
          update((current) => ({ ...current, prices: [...additions, ...current.prices] }));
        }
        return additions.length;
      },
      choosePrice: (itemId, priceId) =>
        update((current) => {
          const priceChoices = { ...current.priceChoices };
          if (!priceId) delete priceChoices[itemId];
          else priceChoices[itemId] = priceId;
          return { ...current, priceChoices };
        }),
      ensureOrders: (year, month) =>
        update((current) => {
          const orders = [...current.orders];
          for (const school of current.schools) {
            const id = orderId(school.id, year, month);
            if (!orders.some((order) => order.id === id)) {
              orders.push({ id, schoolId: school.id, year, month, status: "open" });
            }
          }
          return { ...current, orders };
        }),
      closeOrder: (id) =>
        update((current) => ({
          ...current,
          orders: current.orders.map((order) => {
            if (order.id !== id || order.status === "closed") return order;
            const school = current.schools.find((entry) => entry.id === order.schoolId);
            if (!school) return order;
            const lines = buildLines(current, school, order.year, order.month);
            return {
              ...order,
              status: "closed",
              closedAt: new Date().toISOString(),
              snapshot: {
                schoolName: school.name,
                schoolTypeName: schoolTypeName(current, school),
                learnerCount: school.learnerCount,
                lines,
                foodCost: sumFoodCost(lines),
              },
            };
          }),
        })),
      reopenOrder: (id) =>
        update((current) => ({
          ...current,
          orders: current.orders.map((order) =>
            order.id === id ? { ...order, status: "open", closedAt: undefined, snapshot: undefined } : order,
          ),
        })),
      useAsTemplate: (sourceId, year, month) => {
        const source = state.orders.find((order) => order.id === sourceId);
        if (!source) return "That order could not be found.";
        const id = orderId(source.schoolId, year, month);
        if (state.orders.some((order) => order.id === id)) return "That school already has an order for the chosen month.";
        update((current) => ({
          ...current,
          orders: [
            ...current.orders,
            { id, schoolId: source.schoolId, year, month, status: "open", templateSourceId: source.id },
          ],
        }));
        return null;
      },
      addVariation: (input) =>
        update((current) => ({
          ...current,
          variations: [{ id: uid("cost"), ...input }, ...current.variations],
        })),
      removeVariation: (id) =>
        update((current) => ({
          ...current,
          variations: current.variations.filter((variation) => variation.id !== id),
        })),
      updateSettings: (patch) =>
        update((current) => ({ ...current, settings: { ...current.settings, ...patch } })),
      savePlan: (plan) =>
        update((current) => ({
          ...current,
          plans: [plan, ...current.plans.filter((entry) => !(entry.year === plan.year && entry.month === plan.month))],
        })),
    };
  }, [ready, role, state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useApp(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useApp must be used inside StoreProvider");
  return value;
}

export function linesForOrder(state: AppState, orderIdValue: string) {
  const order = state.orders.find((entry) => entry.id === orderIdValue);
  if (!order) return null;
  if (order.status === "closed" && order.snapshot) {
    return { order, lines: order.snapshot.lines, frozen: true };
  }
  const school = state.schools.find((entry) => entry.id === order.schoolId);
  if (!school) return { order, lines: [], frozen: false };
  return { order, lines: buildLines(state, school, order.year, order.month), frozen: false };
}

export function planMonth(state: AppState, year: number, month: number) {
  const schools = state.schools.flatMap((school) => {
    const order = state.orders.find((entry) => entry.schoolId === school.id && entry.year === year && entry.month === month);
    if (!order) return [];
    const lines =
      order.status === "closed" && order.snapshot
        ? order.snapshot.lines
        : buildLines(state, school, year, month);
    return [{ schoolId: school.id, schoolName: school.name, lines }];
  });
  return buildDeliveryPlan({
    year,
    month,
    capacityKg: state.settings.vehicleCapacityKg,
    deliveryCostZar: state.settings.deliveryCostZar,
    schools,
  });
}

export function toggleDay(days: Weekday[], day: Weekday): Weekday[] {
  return days.includes(day) ? days.filter((entry) => entry !== day) : [...days, day];
}
