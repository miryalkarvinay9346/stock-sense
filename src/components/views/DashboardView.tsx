"use client";

import React, { useState } from "react";
import { useInventory } from "@/lib/useInventory";
import {
  Boxes,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Plus,
} from "lucide-react";
import { OperationType, OperationStatus } from "@/lib/types";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  currentUser: { name: string; role: string };
}

export default function DashboardView({ onNavigate, currentUser }: DashboardViewProps) {
  const { data, getKpis, validateOperation, getProductStock } = useInventory();
  const kpis = getKpis();

  // Dynamic Filters
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const categories = Array.from(new Set(data.products.map((p) => p.category)));

  // Filtered operations
  const filteredOperations = data.operations.filter((op) => {
    if (filterType !== "ALL" && op.type !== filterType) return false;
    if (filterStatus !== "ALL" && op.status !== filterStatus) return false;

    if (filterWarehouse !== "ALL") {
      const srcLoc = data.locations.find((l) => l.id === op.sourceLocationId);
      const dstLoc = data.locations.find((l) => l.id === op.destLocationId);
      const matchesSrc = srcLoc?.warehouseId === filterWarehouse;
      const matchesDst = dstLoc?.warehouseId === filterWarehouse;
      if (!matchesSrc && !matchesDst) return false;
    }

    if (filterCategory !== "ALL") {
      const hasCat = op.lines.some((line) => {
        const prod = data.products.find((p) => p.id === line.productId);
        return prod?.category === filterCategory;
      });
      if (!hasCat) return false;
    }

    return true;
  });

  const handleQuickValidate = (opId: string) => {
    const res = validateOperation(opId, currentUser.name);
    setActionFeedback(res.message);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case "DONE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        );
      case "READY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Ready
          </span>
        );
      case "WAITING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Waiting
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case "CANCELED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Canceled
          </span>
        );
    }
  };

  const getTypeBadge = (type: OperationType) => {
    switch (type) {
      case "RECEIPT":
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Receipt
          </span>
        );
      case "DELIVERY":
        return (
          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold text-xs">
            <ArrowUpRight className="w-3.5 h-3.5" /> Delivery
          </span>
        );
      case "INTERNAL":
        return (
          <span className="inline-flex items-center gap-1 text-purple-700 font-semibold text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Internal Transfer
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-xs">
            Adjustment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div
          onClick={() => onNavigate("products")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total In Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{kpis.totalProductsInStock}</div>
            <p className="text-xs text-slate-500 mt-0.5">Active product lines</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => onNavigate("products")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              Low / Out of Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">{kpis.lowStockCount}</div>
            <p className="text-xs text-rose-500/80 mt-0.5">Needs reordering</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => onNavigate("receipts")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Pending Receipts
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{kpis.pendingReceipts}</div>
            <p className="text-xs text-slate-500 mt-0.5">Incoming shipments</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => onNavigate("deliveries")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Pending Deliveries
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{kpis.pendingDeliveries}</div>
            <p className="text-xs text-slate-500 mt-0.5">Outgoing customer orders</p>
          </div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => onNavigate("transfers")}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Transfers Scheduled
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{kpis.internalTransfersScheduled}</div>
            <p className="text-xs text-slate-500 mt-0.5">Inter-location transfers</p>
          </div>
        </div>
      </div>

      {/* Dynamic Filters Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-brand-600" />
          Dynamic Inventory Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Document Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Document Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Types (Receipts, Deliveries, Transfers, Adjustments)</option>
              <option value="RECEIPT">Receipts (Incoming)</option>
              <option value="DELIVERY">Delivery Orders (Outgoing)</option>
              <option value="INTERNAL">Internal Transfers</option>
              <option value="ADJUSTMENT">Stock Adjustments</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses (Draft, Waiting, Ready, Done, Canceled)</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting</option>
              <option value="READY">Ready (Can Validate)</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Warehouse / Location
            </label>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Warehouses</option>
              {data.warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Product Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Product Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Clear Button */}
        {(filterType !== "ALL" || filterStatus !== "ALL" || filterWarehouse !== "ALL" || filterCategory !== "ALL") && (
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">
              Showing <strong>{filteredOperations.length}</strong> matching operations
            </span>
            <button
              onClick={() => {
                setFilterType("ALL");
                setFilterStatus("ALL");
                setFilterWarehouse("ALL");
                setFilterCategory("ALL");
              }}
              className="text-brand-600 hover:text-brand-800 font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Operations Feed</h3>
            <p className="text-xs text-slate-500">
              Real-time register of incoming, outgoing, and transfer operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("receipts")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Receipt
            </button>
            <button
              onClick={() => onNavigate("deliveries")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Delivery
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Partner / Target</th>
                <th className="px-5 py-3">Products & Qty</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No operations found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredOperations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {op.reference}
                    </td>
                    <td className="px-5 py-3.5">{getTypeBadge(op.type)}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {op.partnerName || "Internal Movement"}
                    </td>
                    <td className="px-5 py-3.5">
                      {op.lines.map((line, idx) => {
                        const product = data.products.find((p) => p.id === line.productId);
                        return (
                          <div key={idx} className="text-slate-800">
                            <strong>{line.quantity}</strong> {product?.uom || "units"} of{" "}
                            <span className="text-slate-600">{product?.name || "Unknown"}</span>
                          </div>
                        );
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{op.date}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(op.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {op.status === "READY" ? (
                        <button
                          onClick={() => handleQuickValidate(op.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-colors cursor-pointer"
                        >
                          Validate
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
