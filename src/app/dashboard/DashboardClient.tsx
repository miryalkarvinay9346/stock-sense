"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Scale,
  History,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  Menu,
  X,
  Building2,
  Bell,
  ChevronRight,
} from "lucide-react";
import { JWTPayload } from "@/lib/auth";
import { InventoryProvider, useInventory } from "@/lib/useInventory";

// Views
import DashboardView from "@/components/views/DashboardView";
import ProductsView from "@/components/views/ProductsView";
import ReceiptsView from "@/components/views/ReceiptsView";
import DeliveriesView from "@/components/views/DeliveriesView";
import TransfersView from "@/components/views/TransfersView";
import AdjustmentsView from "@/components/views/AdjustmentsView";
import LedgerView from "@/components/views/LedgerView";
import SettingsView from "@/components/views/SettingsView";

interface DashboardClientProps {
  user: JWTPayload;
}

function MainIMSContent({ user }: { user: JWTPayload }) {
  const router = useRouter();
  const { getKpis } = useInventory();
  const kpis = getKpis();

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "products", label: "Products", icon: Package, badge: kpis.lowStockCount > 0 ? `${kpis.lowStockCount} alert` : null, badgeColor: "bg-rose-100 text-rose-700" },
    { id: "receipts", label: "Receipts", icon: ArrowDownLeft, badge: kpis.pendingReceipts > 0 ? kpis.pendingReceipts : null, badgeColor: "bg-emerald-100 text-emerald-700" },
    { id: "deliveries", label: "Delivery Orders", icon: ArrowUpRight, badge: kpis.pendingDeliveries > 0 ? kpis.pendingDeliveries : null, badgeColor: "bg-blue-100 text-blue-700" },
    { id: "transfers", label: "Internal Transfers", icon: ArrowLeftRight, badge: kpis.internalTransfersScheduled > 0 ? kpis.internalTransfersScheduled : null, badgeColor: "bg-purple-100 text-purple-700" },
    { id: "adjustments", label: "Stock Adjustments", icon: Scale, badge: null },
    { id: "ledger", label: "Move History", icon: History, badge: null },
    { id: "settings", label: "Settings", icon: Settings, badge: null },
  ];

  const roleLabel =
    user.role === "INVENTORY_MANAGER" ? "Inventory Manager" : "Warehouse Staff";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white">
              Stock<span className="text-brand-400">Sense</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Modular IMS &bull; Odoo Flow</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations &amp; Stock
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || "bg-slate-800 text-slate-300"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Menu (Left Sidebar bottom, as per PDF requirement) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate text-left text-xs">
                <div className="font-semibold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-brand-300 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {roleLabel}
                </div>
              </div>
            </div>
            <button
              onClick={() => setProfileModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              title="View Profile Details"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-white z-10">
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-white">StockSense</div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 text-rose-300 rounded-xl text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 capitalize flex items-center gap-1.5">
                {activeTab === "ledger" ? "Move History / Stock Ledger" : activeTab}
              </h1>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Centralized, real-time stock register &bull; Mode: Real-time Multi-Warehouse
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span className="font-semibold text-slate-700">Main Warehouse (WH-MAIN)</span>
            </div>

            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
            >
              <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{user.name}</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" && (
              <DashboardView onNavigate={(tab) => setActiveTab(tab)} currentUser={user} />
            )}
            {activeTab === "products" && <ProductsView currentUser={user} />}
            {activeTab === "receipts" && <ReceiptsView currentUser={user} />}
            {activeTab === "deliveries" && <DeliveriesView currentUser={user} />}
            {activeTab === "transfers" && <TransfersView currentUser={user} />}
            {activeTab === "adjustments" && <AdjustmentsView currentUser={user} />}
            {activeTab === "ledger" && <LedgerView />}
            {activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      {/* My Profile Modal (PDF Requirement: "7. Profile Menu (Left Sidebar) • My Profile") */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">My Profile</h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30 mb-3">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h4 className="font-bold text-slate-900 text-base">{user.name}</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs border border-slate-100 my-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full text-[11px]">
                  {roleLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Access:</span>
                <span className="font-semibold text-emerald-700">Full Operational Rights</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Warehouse:</span>
                <span className="font-semibold text-slate-800">Main Warehouse (WH-MAIN)</span>
              </div>
            </div>

            <button
              onClick={() => setProfileModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardClient({ user }: DashboardClientProps) {
  return (
    <InventoryProvider>
      <MainIMSContent user={user} />
    </InventoryProvider>
  );
}
