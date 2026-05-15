import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Bell, LogOut } from "lucide-react";
import { useApp } from "../context/AppContext";
import { logout } from "../lib/firebase";
import { User } from "firebase/auth";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setPage: (page: any) => void;
  user?: User | null;
  userRole?: 'admin' | 'funcionario' | null;
}

export function Layout({ children, currentPage, setPage, user, userRole }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { state } = useApp();

  const lowStockProducts = state.products.filter(p => p.stockQuantity <= p.minStock);
  const hasAlerts = lowStockProducts.length > 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentPage={currentPage as any} 
        setPage={setPage} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        userRole={userRole}
      />
      
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
        {/* Top Header */}
        <header className="h-[64px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="font-medium text-slate-500 hidden sm:block">
              Visão Geral / <span className="text-slate-900 capitalize">
                {currentPage === 'pos' ? 'Nova Venda' : 
                 currentPage === 'inventory' ? 'Estoque' : 
                 currentPage === 'cashflow' ? 'Fluxo de Caixa' : 
                 currentPage === 'reports' ? 'Relatórios' : 'Dashboard'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer" onClick={() => setPage('inventory')}>
              <Bell size={20} className="text-slate-500 hover:text-slate-700 transition" />
              {hasAlerts && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#800020] rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[13px] font-semibold text-slate-900">{user?.displayName || "Usuário"}</div>
                <div className="text-[11px] text-slate-500 capitalize">{userRole || 'Usuário'}</div>
              </div>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-8 w-8 rounded-full shadow-sm" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-[12px] text-slate-900">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="ml-2 text-slate-400 hover:text-[#800020] transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {hasAlerts && currentPage !== 'inventory' && (
          <div className="bg-[#fff1f2] border border-[#fee2e2] p-3 mx-8 mt-6 rounded-[8px] flex justify-between items-center">
            <div className="flex flex-col">
              <div className="font-semibold text-[14px] text-slate-900">Atenção ao Estoque</div>
              <div className="text-[11px] text-[#991b1b]">
                Você tem {lowStockProducts.length} produto(s) com estoque baixo. <button onClick={() => setPage('inventory')} className="font-bold underline ml-1">Ver estoque</button>
              </div>
            </div>
            <span className="bg-[#800020] text-white text-[10px] px-2 py-0.5 rounded-[4px] font-semibold">CRÍTICO</span>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
