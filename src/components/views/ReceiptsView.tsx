"use client";

import React, { useState } from "react";
import { useInventory } from "@/lib/useInventory";
import {
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  X,
  AlertCircle,
} from "lucide-react";

export default function ReceiptsView({ currentUser }: { currentUser: { name: string } }) {
  const { data, createOperation, validateOperation } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [destLocationId, setDestLocationId] = useState("loc_main_store");
  const [productId, setProductId] = useState(data.products[0]?.id || "");
  const [quantity, setQuantity] = useState(50);
  const [notes, setNotes] = useState("");

  const [notification, setNotification] = useState<string | null>(null);

  const internalLocations = data.locations.filter((l) => l.type === "internal");
  const receipts = data.operations.filter((o) => o.type === "RECEIPT");

  const openCreateModal = () => {
    setPartnerName("Apex Steel Mills Ltd.");
    setDestLocationId(internalLocations[0]?.id || "loc_main_store");
    setProductId(data.products[0]?.id || "");
    setQuantity(50);
    setNotes("Standard replenishment from vendor");
    setIsModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createOperation({
      type: "RECEIPT",
      partnerName,
      sourceLocationId: "loc_vendor",
      destLocationId,
      lines: [{ productId, quantity: Number(quantity) }],
      date: new Date().toISOString().split("T")[0],
      notes,
      createdBy: currentUser.name,
      status: "READY",
    });
    setIsModalOpen(false);
    setNotification("New Receipt document created in READY status. Click 'Validate' to receive stock.");
    setTimeout(() => setNotification(null), 5000);
  };

  const handleValidate = (id: string) => {
    const res = validateOperation(id, currentUser.name);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            Receipts (Incoming Goods from Vendors)
          </h2>
          <p className="text-xs text-slate-500">
            Process supplier deliveries. Validating a receipt automatically increases stock at the destination.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Receipt
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

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Supplier / Vendor</th>
                <th className="px-5 py-3">Destination Rack/Store</th>
                <th className="px-5 py-3">Items & Quantity</th>
                <th className="px-5 py-3">Created By</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No receipts found. Click "Create Receipt" to add one.
                  </td>
                </tr>
              ) : (
                receipts.map((rec) => {
                  const dstLoc = data.locations.find((l) => l.id === rec.destLocationId);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {rec.reference}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {rec.partnerName}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {dstLoc?.name || "Warehouse"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {rec.lines.map((l, i) => {
                          const prod = data.products.find((p) => p.id === l.productId);
                          return (
                            <div key={i} className="text-slate-800">
                              <span className="font-extrabold text-emerald-700">+{l.quantity}</span>{" "}
                              {prod?.uom} of {prod?.name}
                            </div>
                          );
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{rec.createdBy}</td>
                      <td className="px-5 py-3.5">
                        {rec.status === "DONE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Done (Stock Added)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" /> Ready
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {rec.status === "READY" ? (
                          <button
                            onClick={() => handleValidate(rec.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                          >
                            Validate &amp; Receive
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">Validated</span>
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
              <h3 className="text-base font-bold text-slate-900">Create Incoming Receipt</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor Name</label>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. Apex Steel Mills"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
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
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
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
                <label className="block font-semibold text-slate-700 mb-1">Notes / PO Reference</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Purchase order PO-2026-90"
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Create &amp; Ready
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
