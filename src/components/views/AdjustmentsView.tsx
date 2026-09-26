"use client";

import React, { useState } from "react";
import { useInventory } from "@/lib/useInventory";
import {
  Scale,
  Plus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  X,
  History,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export default function AdjustmentsView({ currentUser }: { currentUser: { name: string } }) {
  const { data, createOperation, validateOperation, getProductStockAtLocation } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState(data.products[0]?.id || "");
  const [locationId, setLocationId] = useState("loc_main_store");
  const [countedQty, setCountedQty] = useState(0);
  const [reason, setReason] = useState("Physical inventory discrepancy");

  const [notification, setNotification] = useState<string | null>(null);

  const internalLocations = data.locations.filter((l) => l.type === "internal");
  const adjustments = data.operations.filter((o) => o.type === "ADJUSTMENT");

  const currentRecordedQty = getProductStockAtLocation(productId, locationId);
  const selectedProduct = data.products.find((p) => p.id === productId);
  const diff = countedQty - currentRecordedQty;

  const openModal = () => {
    const pId = data.products[0]?.id || "";
    const locId = internalLocations[0]?.id || "loc_main_store";
    setProductId(pId);
    setLocationId(locId);
    setCountedQty(getProductStockAtLocation(pId, locId));
    setReason("Damaged goods / Physical recount");
    setIsModalOpen(true);
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();

    const op = createOperation({
      type: "ADJUSTMENT",
      sourceLocationId: locationId,
      destLocationId: "loc_loss",
      lines: [{ productId, quantity: Number(countedQty) }],
      date: new Date().toISOString().split("T")[0],
      notes: reason,
      createdBy: currentUser.name,
      status: "READY",
    });

    const res = validateOperation(op.id, currentUser.name);
    setIsModalOpen(false);
    setNotification(`Adjustment recorded and applied! Stock updated to ${countedQty} ${selectedProduct?.uom}. Difference of ${diff > 0 ? "+" : ""}${diff} logged to ledger.`);
    setTimeout(() => setNotification(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            Stock Adjustments (Physical Count Reconciliation)
          </h2>
          <p className="text-xs text-slate-500">
            Fix mismatches between recorded ledger inventory and on-site physical counts (e.g. damaged goods, scrap, or recount deltas).
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Count Adjustment
        </button>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notification}
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">New Count Quantity</th>
                <th className="px-5 py-3">Reason / Notes</th>
                <th className="px-5 py-3">Auditor</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No physical adjustments recorded yet. Click "New Count Adjustment" to reconcile stock.
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => {
                  const loc = data.locations.find((l) => l.id === adj.sourceLocationId);

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {adj.reference}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          {loc?.name}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {adj.lines.map((l, i) => {
                          const prod = data.products.find((p) => p.id === l.productId);
                          return (
                            <span key={i} className="font-bold text-slate-800">
                              {prod?.name} ({prod?.sku})
                            </span>
                          );
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        {adj.lines.map((l, i) => {
                          const prod = data.products.find((p) => p.id === l.productId);
                          return (
                            <span key={i} className="font-mono font-extrabold text-slate-900">
                              {l.quantity} {prod?.uom}
                            </span>
                          );
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{adj.notes || "Count update"}</td>
                      <td className="px-5 py-3.5 text-slate-500">{adj.createdBy}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Reconciled
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Physical Stock Count Adjustment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setCountedQty(getProductStockAtLocation(e.target.value, locationId));
                  }}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse Location</label>
                <select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                    setCountedQty(getProductStockAtLocation(productId, e.target.value));
                  }}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  {internalLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Currently Recorded Stock:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {currentRecordedQty} {selectedProduct?.uom}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physical Counted Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={countedQty}
                  onChange={(e) => setCountedQty(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Delta indicator */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  diff < 0
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : diff > 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {diff < 0 ? (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  ) : diff > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : null}
                  Adjustment Impact:
                </div>
                <div className="font-mono font-bold">
                  {diff > 0 ? `+${diff}` : diff} {selectedProduct?.uom}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Scrap Note</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. 3 kg steel damaged or physical count difference"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Apply &amp; Reconcile Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
