"use client";

import React, { useState } from "react";
import { useInventory } from "@/lib/useInventory";
import {
  Settings,
  Building2,
  MapPin,
  Plus,
  X,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function SettingsView() {
  const { data, createWarehouse, createLocation, resetToDemoData } = useInventory();

  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);

  // Warehouse Form
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress, setWhAddress] = useState("");

  // Location Form
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [locWarehouseId, setLocWarehouseId] = useState(data.warehouses[0]?.id || "");
  const [locType, setLocType] = useState<"internal" | "vendor" | "customer" | "inventory_loss">("internal");

  const [notification, setNotification] = useState<string | null>(null);

  const handleCreateWh = (e: React.FormEvent) => {
    e.preventDefault();
    createWarehouse({
      name: whName,
      code: whCode.toUpperCase(),
      address: whAddress,
    });
    setIsWhModalOpen(false);
    setWhName("");
    setWhCode("");
    setWhAddress("");
    setNotification("New warehouse registered successfully!");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateLoc = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation({
      name: locName,
      code: locCode.toUpperCase(),
      warehouseId: locWarehouseId,
      type: locType,
    });
    setIsLocModalOpen(false);
    setLocName("");
    setLocCode("");
    setNotification("New storage location added successfully!");
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-600" />
            Warehouse &amp; Location Infrastructure
          </h2>
          <p className="text-xs text-slate-500">
            Configure enterprise physical warehouses, storage racks, and operational zones
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("Reset inventory data back to standard demo state?")) {
              resetToDemoData();
              setNotification("Reset to demo data completed!");
              setTimeout(() => setNotification(null), 3000);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          Reset Demo Data
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

      {/* Warehouses Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-800">Warehouses ({data.warehouses.length})</h3>
          </div>
          <button
            onClick={() => setIsWhModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Warehouse
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.warehouses.map((wh) => (
            <div
              key={wh.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 text-sm">{wh.name}</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    {wh.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{wh.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Locations Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-800">Locations &amp; Storage Racks ({data.locations.length})</h3>
          </div>
          <button
            onClick={() => setIsLocModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Location
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-2.5">Location Name</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Assigned Warehouse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.locations.map((loc) => {
                const wh = data.warehouses.find((w) => w.id === loc.warehouseId);
                return (
                  <tr key={loc.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{loc.name}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{loc.code}</td>
                    <td className="px-4 py-2.5">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {loc.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {wh ? `${wh.name} (${wh.code})` : "Global / Virtual"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Modal */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Warehouse</h3>
              <button onClick={() => setIsWhModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWh} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. South Logistics Depot"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  placeholder="e.g. WH-SOUTH"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Dock</label>
                <input
                  type="text"
                  required
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="e.g. 104 Highway 9, Dock B"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl"
                >
                  Create Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Storage Location</h3>
              <button onClick={() => setIsLocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoc} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Name</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Rack C (Heavy Parts)"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value)}
                    placeholder="e.g. WH1/RACK-C"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warehouse</label>
                  <select
                    value={locWarehouseId}
                    onChange={(e) => setLocWarehouseId(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    {data.warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLocModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl"
                >
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
