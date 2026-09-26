"use client";

import React, { useState } from "react";
import { useInventory } from "@/lib/useInventory";
import {
  History,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Scale,
  Calendar,
  User,
  Filter,
} from "lucide-react";
import { OperationType } from "@/lib/types";

export default function LedgerView() {
  const { data } = useInventory();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredLedger = data.ledger.filter((entry) => {
    const matchesSearch =
      entry.reference.toLowerCase().includes(search.toLowerCase()) ||
      entry.productName.toLowerCase().includes(search.toLowerCase()) ||
      entry.sku.toLowerCase().includes(search.toLowerCase()) ||
      entry.fromLocationName.toLowerCase().includes(search.toLowerCase()) ||
      entry.toLocationName.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "ALL" || entry.operationType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: OperationType) => {
    switch (type) {
      case "RECEIPT":
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <ArrowDownLeft className="w-3 h-3" /> Receipt
          </span>
        );
      case "DELIVERY":
        return (
          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <ArrowUpRight className="w-3 h-3" /> Delivery
          </span>
        );
      case "INTERNAL":
        return (
          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <ArrowLeftRight className="w-3 h-3" /> Internal Transfer
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
            <Scale className="w-3 h-3" /> Adjustment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-600" />
            Move History &amp; Stock Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Immutable, audit-grade chronological ledger recording all stock entries, dispatches, transfers, and adjustments.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          Total Recorded Moves: <strong>{data.ledger.length}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Reference, SKU, Product, or Location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
          >
            <option value="ALL">All Movement Types</option>
            <option value="RECEIPT">Receipts</option>
            <option value="DELIVERY">Deliveries</option>
            <option value="INTERNAL">Internal Transfers</option>
            <option value="ADJUSTMENT">Stock Adjustments</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Product (SKU)</th>
                <th className="px-5 py-3">From Location</th>
                <th className="px-5 py-3">To Location</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Balance After</th>
                <th className="px-5 py-3">Auditor / User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400 font-sans">
                    No ledger transactions match your search filter.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {item.reference}
                    </td>
                    <td className="px-5 py-3.5 font-sans">{getTypeBadge(item.operationType)}</td>
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-800">
                      <div>{item.productName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="px-5 py-3.5 font-sans text-slate-600">
                      {item.fromLocationName}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-slate-600">
                      {item.toLocationName}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                      {item.operationType === "DELIVERY" ? `-${item.quantity}` : `+${item.quantity}`}{" "}
                      <span className="text-[10px] text-slate-500">{item.uom}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-brand-700">
                      {item.resultingBalance} <span className="text-[10px]">{item.uom}</span>
                    </td>
                    <td className="px-5 py-3.5 font-sans text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.createdBy}
                      </div>
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
