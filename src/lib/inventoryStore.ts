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

export interface InventoryData {
  warehouses: Warehouse[];
  locations: Location[];
  products: Product[];
  stocks: LocationStock[];
  operations: StockOperation[];
  ledger: StockMoveLedger[];
}

export const INITIAL_INVENTORY_DATA: InventoryData = {
  warehouses: [
    {
      id: "wh_main",
      name: "Main Warehouse",
      code: "WH-MAIN",
      address: "Sector 4 Industrial Zone, North Dock",
    },
    {
      id: "wh_east",
      name: "Warehouse 2 (Logistics Hub)",
      code: "WH-EAST",
      address: "Logistics Hub East, Bay 12",
    },
  ],
  locations: [
    { id: "loc_vendor", warehouseId: "", name: "Partner Locations / Vendors", code: "VENDORS", type: "vendor" },
    { id: "loc_customer", warehouseId: "", name: "Partner Locations / Customers", code: "CUSTOMERS", type: "customer" },
    { id: "loc_loss", warehouseId: "", name: "Virtual Locations / Inventory Loss & Scrap", code: "LOSS", type: "inventory_loss" },
    { id: "loc_main_store", warehouseId: "wh_main", name: "Main Store (Central Rack)", code: "WH1/STOCK", type: "internal" },
    { id: "loc_rack_a", warehouseId: "wh_main", name: "Rack A (Finished Goods)", code: "WH1/RACK-A", type: "internal" },
    { id: "loc_rack_b", warehouseId: "wh_main", name: "Rack B (Hardware & Parts)", code: "WH1/RACK-B", type: "internal" },
    { id: "loc_prod_floor", warehouseId: "wh_main", name: "Production Floor", code: "WH1/PROD", type: "internal" },
    { id: "loc_wh2_stock", warehouseId: "wh_east", name: "WH2 General Storage", code: "WH2/STOCK", type: "internal" },
  ],
  products: [
    {
      id: "prod_steel_rods",
      name: "Steel Rods (12mm)",
      sku: "STL-ROD-01",
      category: "Raw Materials",
      uom: "units",
      minStockAlert: 25,
    },
    {
      id: "prod_raw_steel",
      name: "Structural Steel",
      sku: "STL-BLK-100",
      category: "Raw Materials",
      uom: "kg",
      minStockAlert: 50,
    },
    {
      id: "prod_office_chairs",
      name: "Ergonomic Office Chairs",
      sku: "CHR-OFF-09",
      category: "Furniture",
      uom: "units",
      minStockAlert: 15,
    },
    {
      id: "prod_screws",
      name: "Industrial Screws M8",
      sku: "SCR-M8-500",
      category: "Hardware",
      uom: "boxes",
      minStockAlert: 20,
    },
    {
      id: "prod_helmets",
      name: "Safety Helmets (ANSI Z89.1)",
      sku: "PPE-HLM-02",
      category: "Safety Equipment",
      uom: "units",
      minStockAlert: 15,
    },
  ],
  stocks: [
    { id: "stk_1", productId: "prod_steel_rods", locationId: "loc_main_store", quantity: 50 },
    { id: "stk_2", productId: "prod_raw_steel", locationId: "loc_main_store", quantity: 100 },
    { id: "stk_3", productId: "prod_office_chairs", locationId: "loc_rack_a", quantity: 25 },
    { id: "stk_4", productId: "prod_screws", locationId: "loc_rack_b", quantity: 40 },
    { id: "stk_5", productId: "prod_helmets", locationId: "loc_main_store", quantity: 8 }, // Low stock trigger!
  ],
  operations: [
    {
      id: "op_rec_001",
      reference: "WH/IN/0001",
      type: "RECEIPT",
      status: "DONE",
      partnerName: "Apex Steel Mills Ltd.",
      sourceLocationId: "loc_vendor",
      destLocationId: "loc_main_store",
      lines: [{ productId: "prod_steel_rods", quantity: 50 }],
      date: new Date(Date.now() - 3600000 * 24).toISOString().split("T")[0],
      notes: "Initial replenishment from vendor.",
      createdBy: "Inventory Manager",
    },
    {
      id: "op_del_001",
      reference: "WH/OUT/0001",
      type: "DELIVERY",
      status: "READY",
      partnerName: "Metro Workspace Furnishings",
      sourceLocationId: "loc_rack_a",
      destLocationId: "loc_customer",
      lines: [{ productId: "prod_office_chairs", quantity: 10 }],
      date: new Date().toISOString().split("T")[0],
      notes: "Sales order shipment.",
      createdBy: "Inventory Manager",
    },
    {
      id: "op_int_001",
      reference: "WH/INT/0001",
      type: "INTERNAL",
      status: "READY",
      sourceLocationId: "loc_main_store",
      destLocationId: "loc_prod_floor",
      lines: [{ productId: "prod_raw_steel", quantity: 20 }],
      date: new Date().toISOString().split("T")[0],
      notes: "Material transfer for frame production.",
      createdBy: "Warehouse Staff",
    },
  ],
  ledger: [
    {
      id: "ledg_001",
      date: new Date(Date.now() - 3600000 * 24).toISOString().replace("T", " ").substring(0, 19),
      reference: "WH/IN/0001",
      operationType: "RECEIPT",
      productId: "prod_steel_rods",
      productName: "Steel Rods (12mm)",
      sku: "STL-ROD-01",
      fromLocationName: "Partner Locations / Vendors",
      toLocationName: "Main Store (Central Rack)",
      quantity: 50,
      uom: "units",
      resultingBalance: 50,
      createdBy: "Inventory Manager",
    },
  ],
};
