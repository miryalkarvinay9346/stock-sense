"use client";

import React, { useState } from "react";
import { useInventory } from "@/lib/useInventory";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Edit2,
  X,
  Layers,
  BarChart2,
} from "lucide-react";
import { Product } from "@/lib/types";

export default function ProductsView({ currentUser }: { currentUser: { name: string } }) {
  const { data, getProductStock, getProductLocations, addProduct, updateProduct } = useInventory();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Raw Materials");
  const [uom, setUom] = useState("units");
  const [minStockAlert, setMinStockAlert] = useState(10);
  const [initialLocationId, setInitialLocationId] = useState("loc_main_store");
  const [initialQty, setInitialQty] = useState(0);

  // Expanded product for location view
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const categories = Array.from(new Set(data.products.map((p) => p.category)));
  const internalLocations = data.locations.filter((l) => l.type === "internal");

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setCategory("Raw Materials");
    setUom("units");
    setMinStockAlert(10);
    setInitialLocationId(internalLocations[0]?.id || "");
    setInitialQty(0);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setUom(p.uom);
    setMinStockAlert(p.minStockAlert);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        sku,
        category,
        uom,
        minStockAlert: Number(minStockAlert),
      });
    } else {
      addProduct(
        {
          name,
          sku,
          category,
          uom,
          minStockAlert: Number(minStockAlert),
        },
        initialLocationId,
        Number(initialQty),
        currentUser.name
      );
    }
    setIsModalOpen(false);
  };

  const filteredProducts = data.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const totalStock = getProductStock(p.id);
    const matchesLowStock = !showLowStockOnly || totalStock <= p.minStockAlert;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-brand-600" />
            Product Catalog & Stock Availability
          </h2>
          <p className="text-xs text-slate-500">
            Track product variants, SKU identifiers, location breakdown, and reordering rules
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              showLowStockOnly
                ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Low Stock Alerts
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">SKU / Code</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Unit (UoM)</th>
                <th className="px-5 py-3">Min Alert Rule</th>
                <th className="px-5 py-3">Total In Stock</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const totalStock = getProductStock(product.id);
                  const isLow = totalStock <= product.minStockAlert;
                  const isExpanded = expandedProductId === product.id;
                  const locBreakdown = getProductLocations(product.id);

                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-800">
                          {product.name}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-600">{product.sku}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{product.uom}</td>
                        <td className="px-5 py-3.5 text-slate-600">
                          &le; {product.minStockAlert} {product.uom}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-extrabold text-sm ${
                                isLow ? "text-rose-600" : "text-emerald-700"
                              }`}
                            >
                              {totalStock} {product.uom}
                            </span>
                            {isLow && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            onClick={() =>
                              setExpandedProductId(isExpanded ? null : product.id)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              isExpanded
                                ? "bg-brand-50 border-brand-300 text-brand-700"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            Locations ({locBreakdown.length})
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Location Breakdown Sub-row */}
                      {isExpanded && (
                        <tr className="bg-brand-50/30 border-y border-brand-100">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-brand-600" />
                              Stock Availability per Location for {product.name}:
                            </div>
                            {locBreakdown.length === 0 ? (
                              <p className="text-xs text-slate-500 italic">
                                No stock currently allocated to any internal location.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {locBreakdown.map((item) => (
                                  <div
                                    key={item.location.id}
                                    className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-semibold text-slate-800">
                                        {item.location.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {item.location.code}
                                      </div>
                                    </div>
                                    <div className="font-mono font-bold text-brand-700">
                                      {item.quantity} {product.uom}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steel Rods (12mm)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STL-ROD-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raw Materials"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure (UoM)</label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    <option value="units">units</option>
                    <option value="kg">kg</option>
                    <option value="boxes">boxes</option>
                    <option value="meters">meters</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold uppercase text-slate-500 mb-2">
                    Initial Stock Allocation (Optional)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Target Location</label>
                      <select
                        value={initialLocationId}
                        onChange={(e) => setInitialLocationId(e.target.value)}
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
                      <label className="block font-semibold text-slate-700 mb-1">Initial Quantity</label>
                      <input
                        type="number"
                        min={0}
                        value={initialQty}
                        onChange={(e) => setInitialQty(Number(e.target.value))}
                        className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
