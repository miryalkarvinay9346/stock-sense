"use client";

import React, { useState } from "react";
import { useInventory } from "@/lib/useInventory";
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  AlertTriangle,
} from "lucide-react";

export default function TransfersView({ currentUser }: { currentUser: { name: string } }) {
  const { data, createOperation, validateOperation, getProductStockAtLocation } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceLocationId, setSourceLocationId] = useState("loc_main_store");
  const [destLocationId, setDestLocationId] = useState("loc_prod_floor");
  const [productId, setProductId] = useState(data.products[1]?.id || data.products[0]?.id || "");
  const [quantity, setQuantity] = useState(20);
  const [notes, setNotes] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const internalLocations = data.locations.filter((l) => l.type === "internal");
  const transfers = data.operations.filter((o) => o.type === "INTERNAL");

  const openCreateModal = () => {
    setSourceLocationId("loc_main_store");
    setDestLocationId("loc_prod_floor");
    setProductId(data.products[1]?.id || data.products[0]?.id || "");
    setQuantity(20);
    setNotes("Move to production rack for frames");
    setIsModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceLocationId === destLocationId) {
      setNotification({
        type: "error",
        text: "Source and destination locations cannot be the same.",
      });
      return;
    }

    createOperation({
      type: "INTERNAL",
      sourceLocationId,
      destLocationId,
      lines: [{ productId, quantity: Number(quantity) }],
      date: new Date().toISOString().split("T")[0],
      notes,
      createdBy: currentUser.name,
      status: "READY",
    });
    setIsModalOpen(false);
    setNotification({
      type: "success",
      text: "Internal transfer scheduled in READY status. Click 'Validate' to perform transfer.",
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleValidate = (id: string) => {
    const res = validateOperation(id, currentUser.name);
    setNotification({
      type: res.success ? "success" : "error",
      text: res.message,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-600" />
            Internal Transfers (Inter-Location &amp; Production Floor Moves)
          </h2>
          <p className="text-xs text-slate-500">
            Relocate stock across warehouses and racks (e.g. Main Store &rarr; Production Floor). Total stock is unchanged, but location balances update automatically.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Internal Transfer
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800 font-semibold"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            {notification.text}
          </div>
          <button onClick={() => setNotification(null)} className="font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">From Source</th>
                <th className="px-5 py-3">To Destination</th>
                <th className="px-5 py-3">Items & Quantity</th>
                <th className="px-5 py-3">Source Availability</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No internal transfers recorded. Click "New Internal Transfer" to schedule one.
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => {
                  const srcLoc = data.locations.find((l) => l.id === tr.sourceLocationId);
                  const dstLoc = data.locations.find((l) => l.id === tr.destLocationId);

                  return (
                    <tr key={tr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {tr.reference}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {srcLoc?.name || "Source"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {dstLoc?.name || "Destination"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {tr.lines.map((l, i) => {
                          const prod = data.products.find((p) => p.id === l.productId);
                          return (
                            <div key={i} className="text-slate-800">
                              <span className="font-extrabold text-purple-700">{l.quantity}</span>{" "}
                              {prod?.uom} of {prod?.name}
                            </div>
                          );
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        {tr.lines.map((l, i) => {
                          const avail = getProductStockAtLocation(l.productId, tr.sourceLocationId);
                          const prod = data.products.find((p) => p.id === l.productId);
                          return (
                            <div key={i} className="font-semibold text-slate-700">
                              {avail} {prod?.uom}
                            </div>
                          );
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        {tr.status === "DONE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Transferred
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <Clock className="w-3 h-3" /> Ready
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {tr.status === "READY" ? (
                          <button
                            onClick={() => handleValidate(tr.id)}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                          >
                            Validate Transfer
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">Completed</span>
                        )}
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
              <h3 className="text-base font-bold text-slate-900">Schedule Internal Transfer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Location</label>
                  <select
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    {internalLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Location</label>
                  <select
                    value={destLocationId}
                    onChange={(e) => setDestLocationId(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    {internalLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
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
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Purpose / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Move to production rack for frames"
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Schedule Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
