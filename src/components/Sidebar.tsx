import React, { useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  CircleDollarSign, 
  BarChart, 
  Menu,
  X,
  Croissant
} from "lucide-react";
import { cn } from "../lib/utils";

type Page = "dashboard" | "pos" | "inventory" | "cashflow" | "reports";

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userRole?: 'admin' | 'funcionario' | null;
}

export function Sidebar({ currentPage, setPage, isOpen, setIsOpen, userRole }: SidebarProps) {
  const menuItems = [
    ...(userRole === 'admin' ? [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
    { id: "pos", label: "Nova Venda", icon: ShoppingCart },
    { id: "inventory", label: "Estoque", icon: Package },
    ...(userRole === 'admin' ? [
      { id: "cashflow", label: "Fluxo de Caixa", icon: CircleDollarSign },
      { id: "reports", label: "Relatórios", icon: BarChart },
    ] : []),
  ] as const;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-[#e2e8f0] z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col p-6",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center mb-[32px]">
          <div className="flex items-center gap-[12px] font-bold text-[20px] text-[#0f172a]">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#800020] to-[#0f172a] flex items-center justify-center shrink-0">
               <Croissant size={16} className="text-white" />
            </div>
            System Padaria
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-slate-800"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id as Page);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-[12px] px-[16px] py-[12px] rounded-[8px] text-[14px] font-medium transition-all duration-200 cursor-pointer",
                  active 
                    ? "bg-[#0f172a] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]" 
                    : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] bg-transparent"
                )}
              >
                <Icon size={20} className={active ? "text-white" : "text-inherit"} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-6 text-[11px] text-slate-500 text-center">
          v1.2.0 - ERP Scalable
        </div>
      </aside>
    </>
  );
}
