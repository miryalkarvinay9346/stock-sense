"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Product,
  Warehouse,
  Location,
  LocationStock,
  StockOperation,
  StockMoveLedger,
  OperationType,
  OperationStatus,
} from "./types";
import { INITIAL_INVENTORY_DATA, InventoryData } from "./inventoryStore";

const STORAGE_KEY = "stocksense_inventory_v1";

interface InventoryContextType {
  data: InventoryData;
  getProductStock: (productId: string) => number;
  getProductStockAtLocation: (productId: string, locationId: string) => number;
  getProductLocations: (productId: string) => { location: Location; quantity: number }[];
  getKpis: () => {
    totalProductsInStock: number;
    lowStockCount: number;
    pendingReceipts: number;
    pendingDeliveries: number;
    internalTransfersScheduled: number;
  };
  addProduct: (product: Omit<Product, "id">, initialLocationId?: string, initialQty?: number, createdBy?: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  createOperation: (op: Omit<StockOperation, "id" | "reference" | "status"> & { status?: OperationStatus }) => StockOperation;
  validateOperation: (operationId: string, validatedBy: string) => { success: boolean; message: string };
  cancelOperation: (operationId: string) => void;
  createWarehouse: (wh: Omit<Warehouse, "id">) => void;
  createLocation: (loc: Omit<Location, "id">) => void;
  resetToDemoData: () => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<InventoryData>(INITIAL_INVENTORY_DATA);
  const [hydrated, setHydrated] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load inventory from storage:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save inventory to storage:", e);
      }
    }
  }, [data, hydrated]);

  const getProductStock = (productId: string): number => {
    const internalLocationIds = new Set(
      data.locations.filter((l) => l.type === "internal").map((l) => l.id)
    );
    return data.stocks
      .filter((s) => s.productId === productId && internalLocationIds.has(s.locationId))
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  const getProductStockAtLocation = (productId: string, locationId: string): number => {
    const entry = data.stocks.find(
      (s) => s.productId === productId && s.locationId === locationId
    );
    return entry ? entry.quantity : 0;
  };

  const getProductLocations = (productId: string) => {
    return data.locations
      .filter((l) => l.type === "internal")
      .map((l) => ({
        location: l,
        quantity: getProductStockAtLocation(productId, l.id),
      }))
      .filter((item) => item.quantity > 0);
  };

  const getKpis = () => {
    const totalProductsInStock = data.products.filter(
      (p) => getProductStock(p.id) > 0
    ).length;

    const lowStockCount = data.products.filter(
      (p) => getProductStock(p.id) <= p.minStockAlert
    ).length;

    const pendingReceipts = data.operations.filter(
      (o) => o.type === "RECEIPT" && (o.status === "READY" || o.status === "WAITING" || o.status === "DRAFT")
    ).length;

    const pendingDeliveries = data.operations.filter(
      (o) => o.type === "DELIVERY" && (o.status === "READY" || o.status === "WAITING" || o.status === "DRAFT")
    ).length;

    const internalTransfersScheduled = data.operations.filter(
      (o) => o.type === "INTERNAL" && (o.status === "READY" || o.status === "WAITING" || o.status === "DRAFT")
    ).length;

    return {
      totalProductsInStock,
      lowStockCount,
      pendingReceipts,
      pendingDeliveries,
      internalTransfersScheduled,
    };
  };

  const addProduct = (
    productInput: Omit<Product, "id">,
    initialLocationId?: string,
    initialQty = 0,
    createdBy = "User"
  ) => {
    const newId = `prod_${Date.now()}`;
    const newProduct: Product = {
      ...productInput,
      id: newId,
    };

    let newStocks = [...data.stocks];
    let newLedger = [...data.ledger];

    if (initialLocationId && initialQty > 0) {
      newStocks.push({
        id: `stk_${Date.now()}`,
        productId: newId,
        locationId: initialLocationId,
        quantity: initialQty,
      });

      const loc = data.locations.find((l) => l.id === initialLocationId);
      newLedger.unshift({
        id: `ledg_${Date.now()}`,
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        reference: "INV/INIT",
        operationType: "RECEIPT",
        productId: newId,
        productName: newProduct.name,
        sku: newProduct.sku,
        fromLocationName: "Initial Inventory Balance",
        toLocationName: loc ? loc.name : "Warehouse",
        quantity: initialQty,
        uom: newProduct.uom,
        resultingBalance: initialQty,
        createdBy,
      });
    }

    setData((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
      stocks: newStocks,
      ledger: newLedger,
    }));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const createOperation = (
    op: Omit<StockOperation, "id" | "reference" | "status"> & { status?: OperationStatus }
  ): StockOperation => {
    const prefix =
      op.type === "RECEIPT"
        ? "WH/IN"
        : op.type === "DELIVERY"
        ? "WH/OUT"
        : op.type === "INTERNAL"
        ? "WH/INT"
        : "WH/ADJ";

    const count = data.operations.filter((o) => o.type === op.type).length + 1;
    const ref = `${prefix}/${String(count).padStart(4, "0")}`;

    const newOp: StockOperation = {
      ...op,
      id: `op_${Date.now()}`,
      reference: ref,
      status: op.status || "READY",
    };

    setData((prev) => ({
      ...prev,
      operations: [newOp, ...prev.operations],
    }));

    return newOp;
  };

  const validateOperation = (
    operationId: string,
    validatedBy: string
  ): { success: boolean; message: string } => {
    const op = data.operations.find((o) => o.id === operationId);
    if (!op) return { success: false, message: "Operation not found" };
    if (op.status === "DONE") return { success: false, message: "Operation is already completed" };

    let updatedStocks = [...data.stocks];
    let newLedgerEntries: StockMoveLedger[] = [];

    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

    const fromLoc = data.locations.find((l) => l.id === op.sourceLocationId);
    const toLoc = data.locations.find((l) => l.id === op.destLocationId);

    for (const line of op.lines) {
      const product = data.products.find((p) => p.id === line.productId);
      if (!product) continue;

      if (op.type === "RECEIPT") {
        // Incoming from Vendor -> Add to Dest
        const existingIdx = updatedStocks.findIndex(
          (s) => s.productId === line.productId && s.locationId === op.destLocationId
        );
        let newQty = line.quantity;
        if (existingIdx >= 0) {
          updatedStocks[existingIdx] = {
            ...updatedStocks[existingIdx],
            quantity: updatedStocks[existingIdx].quantity + line.quantity,
          };
          newQty = updatedStocks[existingIdx].quantity;
        } else {
          updatedStocks.push({
            id: `stk_${Date.now()}_${line.productId}`,
            productId: line.productId,
            locationId: op.destLocationId,
            quantity: line.quantity,
          });
        }

        newLedgerEntries.push({
          id: `ledg_${Date.now()}_${line.productId}`,
          date: nowStr,
          reference: op.reference,
          operationType: "RECEIPT",
          productId: line.productId,
          productName: product.name,
          sku: product.sku,
          fromLocationName: fromLoc ? fromLoc.name : (op.partnerName || "Vendor"),
          toLocationName: toLoc ? toLoc.name : "Warehouse Stock",
          quantity: line.quantity,
          uom: product.uom,
          resultingBalance: newQty,
          createdBy: validatedBy,
        });
      } else if (op.type === "DELIVERY") {
        // Outgoing to Customer -> Subtract from Source
        const existingIdx = updatedStocks.findIndex(
          (s) => s.productId === line.productId && s.locationId === op.sourceLocationId
        );
        const currentQty = existingIdx >= 0 ? updatedStocks[existingIdx].quantity : 0;

        if (currentQty < line.quantity) {
          return {
            success: false,
            message: `Insufficient stock for ${product.name} at ${fromLoc?.name || "source"}. Current: ${currentQty}, Required: ${line.quantity}`,
          };
        }

        updatedStocks[existingIdx] = {
          ...updatedStocks[existingIdx],
          quantity: currentQty - line.quantity,
        };

        newLedgerEntries.push({
          id: `ledg_${Date.now()}_${line.productId}`,
          date: nowStr,
          reference: op.reference,
          operationType: "DELIVERY",
          productId: line.productId,
          productName: product.name,
          sku: product.sku,
          fromLocationName: fromLoc ? fromLoc.name : "Warehouse Stock",
          toLocationName: toLoc ? toLoc.name : (op.partnerName || "Customer"),
          quantity: line.quantity,
          uom: product.uom,
          resultingBalance: currentQty - line.quantity,
          createdBy: validatedBy,
        });
      } else if (op.type === "INTERNAL") {
        // Transfer: Subtract from Source, Add to Dest
        const srcIdx = updatedStocks.findIndex(
          (s) => s.productId === line.productId && s.locationId === op.sourceLocationId
        );
        const currentSrcQty = srcIdx >= 0 ? updatedStocks[srcIdx].quantity : 0;

        if (currentSrcQty < line.quantity) {
          return {
            success: false,
            message: `Insufficient stock for transfer of ${product.name}. Available at ${fromLoc?.name}: ${currentSrcQty}`,
          };
        }

        updatedStocks[srcIdx] = {
          ...updatedStocks[srcIdx],
          quantity: currentSrcQty - line.quantity,
        };

        const dstIdx = updatedStocks.findIndex(
          (s) => s.productId === line.productId && s.locationId === op.destLocationId
        );
        let finalDstQty = line.quantity;
        if (dstIdx >= 0) {
          updatedStocks[dstIdx] = {
            ...updatedStocks[dstIdx],
            quantity: updatedStocks[dstIdx].quantity + line.quantity,
          };
          finalDstQty = updatedStocks[dstIdx].quantity;
        } else {
          updatedStocks.push({
            id: `stk_${Date.now()}_${line.productId}`,
            productId: line.productId,
            locationId: op.destLocationId,
            quantity: line.quantity,
          });
        }

        newLedgerEntries.push({
          id: `ledg_${Date.now()}_${line.productId}`,
          date: nowStr,
          reference: op.reference,
          operationType: "INTERNAL",
          productId: line.productId,
          productName: product.name,
          sku: product.sku,
          fromLocationName: fromLoc ? fromLoc.name : "Source Location",
          toLocationName: toLoc ? toLoc.name : "Destination Location",
          quantity: line.quantity,
          uom: product.uom,
          resultingBalance: finalDstQty,
          createdBy: validatedBy,
        });
      } else if (op.type === "ADJUSTMENT") {
        // Physical count adjustment
        const existingIdx = updatedStocks.findIndex(
          (s) => s.productId === line.productId && s.locationId === op.sourceLocationId
        );
        const recordedQty = existingIdx >= 0 ? updatedStocks[existingIdx].quantity : 0;
        const countedQty = line.quantity;
        const diff = countedQty - recordedQty;

        if (existingIdx >= 0) {
          updatedStocks[existingIdx] = {
            ...updatedStocks[existingIdx],
            quantity: countedQty,
          };
        } else {
          updatedStocks.push({
            id: `stk_${Date.now()}_${line.productId}`,
            productId: line.productId,
            locationId: op.sourceLocationId,
            quantity: countedQty,
          });
        }

        newLedgerEntries.push({
          id: `ledg_${Date.now()}_${line.productId}`,
          date: nowStr,
          reference: op.reference,
          operationType: "ADJUSTMENT",
          productId: line.productId,
          productName: product.name,
          sku: product.sku,
          fromLocationName: diff < 0 ? (fromLoc ? fromLoc.name : "Stock") : "Inventory Physical Count",
          toLocationName: diff < 0 ? "Inventory Loss / Scrap" : (fromLoc ? fromLoc.name : "Stock"),
          quantity: Math.abs(diff),
          uom: product.uom,
          resultingBalance: countedQty,
          createdBy: validatedBy,
        });
      }
    }

    setData((prev) => ({
      ...prev,
      stocks: updatedStocks,
      ledger: [...newLedgerEntries, ...prev.ledger],
      operations: prev.operations.map((o) =>
        o.id === operationId ? { ...o, status: "DONE" as OperationStatus } : o
      ),
    }));

    return { success: true, message: `Operation ${op.reference} validated successfully!` };
  };

  const cancelOperation = (operationId: string) => {
    setData((prev) => ({
      ...prev,
      operations: prev.operations.map((o) =>
        o.id === operationId ? { ...o, status: "CANCELED" as OperationStatus } : o
      ),
    }));
  };

  const createWarehouse = (wh: Omit<Warehouse, "id">) => {
    const newWh: Warehouse = {
      ...wh,
      id: `wh_${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      warehouses: [...prev.warehouses, newWh],
    }));
  };

  const createLocation = (loc: Omit<Location, "id">) => {
    const newLoc: Location = {
      ...loc,
      id: `loc_${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      locations: [...prev.locations, newLoc],
    }));
  };

  const resetToDemoData = () => {
    setData(INITIAL_INVENTORY_DATA);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <InventoryContext.Provider
      value={{
        data,
        getProductStock,
        getProductStockAtLocation,
        getProductLocations,
        getKpis,
        addProduct,
        updateProduct,
        createOperation,
        validateOperation,
        cancelOperation,
        createWarehouse,
        createLocation,
        resetToDemoData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
