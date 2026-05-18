import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency, formatDate } from "../lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  PackageMinus, 
  DollarSign,
  ShoppingCart,
  Edit2,
  Trash2,
  Clock
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays, isAfter } from "date-fns";
import type { Sale } from "../types";

export default function Dashboard({ setPage }: { setPage?: (page: string) => void }) {
  const { state, setEditingSaleId, deleteSale } = useApp();
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // Metrics calculation
  const today = new Date();
  const startOfDay = new Date(today.setHours(0,0,0,0));
  
  const todaysSales = state.sales.filter(s => new Date(s.date) >= startOfDay);
  const todaysRevenue = todaysSales.reduce((acc, sale) => acc + sale.totalAmount, 0);

  const lowStockCount = state.products.filter(p => p.stockQuantity <= p.minStock).length;

  const thisWeekTrans = state.cashFlow.filter(c => new Date(c.date) >= subDays(new Date(), 7));
  const weekEntries = thisWeekTrans.filter(c => c.type === 'in').reduce((acc, curr) => acc + curr.amount, 0);
  const weekExits = thisWeekTrans.filter(c => c.type === 'out').reduce((acc, curr) => acc + curr.amount, 0);
  const weekProfit = weekEntries - weekExits;

  // Chart data (Last 7 days revenue)
  const chartData = Array.from({length: 7}).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'MMM dd');
    
    // sum sales for that day
    const dayStart = new Date(d.setHours(0,0,0,0));
    const dayEnd = new Date(d.setHours(23,59,59,999));
    
    const daySales = state.sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= dayStart && saleDate <= dayEnd;
    });
    
    return {
      name: dateStr,
      total: daySales.reduce((acc, sale) => acc + sale.totalAmount, 0)
    };
  });

  const handleEditSale = (sale: Sale) => {
    const allProductsExist = sale.items.every(i => state.products.find(p => p.id === i.productId));
    if (!allProductsExist) {
      alert("Não é possível editar esta venda porque um dos produtos foi excluído do sistema.");
      return;
    }
    setEditingSaleId(sale.id);
    if (setPage) setPage('pos');
  };

  const handleDeleteConfirm = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete.id);
      setSaleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <StatsCard 
          title="Vendas Hoje" 
          value={formatCurrency(todaysRevenue)} 
          icon={<ShoppingCart className="text-green-600" size={24} />} 
          trend={`${todaysSales.length} pedidos`}
          positive={true}
        />
        
        <StatsCard 
          title="Faturamento Semanal" 
          value={formatCurrency(weekEntries)} 
          icon={<TrendingUp className="text-blue-600" size={24} />} 
        />
        
        <StatsCard 
          title="Lucro Semanal" 
          value={formatCurrency(weekProfit)} 
          icon={<DollarSign className={weekProfit >= 0 ? "text-green-600" : "text-maroon-600"} size={24} />} 
          positive={weekProfit >= 0}
        />
        
        <StatsCard 
          title="Alertas de Estoque" 
          value={lowStockCount.toString()} 
          icon={<PackageMinus className="text-maroon-600" size={24} />} 
          trend={lowStockCount > 0 ? "Ação necessária" : "Tudo ok"}
          positive={lowStockCount === 0}
          alert={lowStockCount > 0}
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#f1f5f9] p-6">
          <div className="text-[16px] font-semibold text-slate-800 mb-5 flex justify-between items-center">
            <span>Receita (Últimos 7 dias)</span>
          </div>
          <div className="h-56 w-full mt-5">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11}}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  cursor={{fill: '#F1F5F9'}} 
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="total" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#f1f5f9] p-6 lg:h-full flex flex-col max-h-[460px]">
          <div className="text-[16px] font-semibold text-slate-800 mb-3">Vendas de Hoje</div>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            <div className="space-y-3">
              {todaysSales.slice().reverse().map(sale => (
                <div key={sale.id} className="border border-[#f1f5f9] rounded-lg p-3 shadow-sm hover:border-[#e2e8f0] transition group bg-white">
                  <div className="flex justify-between items-start mb-2 border-b border-[#f8fafc] pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[12px] font-semibold text-slate-700">{format(new Date(sale.date), 'HH:mm')}</span>
                      </div>
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded flex w-fit">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 text-[14px] leading-none mb-1.5">{formatCurrency(sale.totalAmount)}</div>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditSale(sale)}
                          className="flex items-center gap-1 text-[11px] text-[#10b981] hover:text-emerald-700 font-medium px-1.5 py-0.5 rounded bg-[#10b981]/10 hover:bg-[#10b981]/20 transition"
                          title="Editar Venda"
                          aria-label="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => setSaleToDelete(sale)}
                          className="flex items-center gap-1 text-[11px] text-[#800020] hover:text-[#991b1b] font-medium px-1.5 py-0.5 rounded bg-[#800020]/10 hover:bg-[#800020]/20 transition"
                          title="Excluir Venda"
                          aria-label="Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-0.5 max-h-[80px] overflow-y-auto text-[11px]" style={{ scrollbarWidth: 'none' }}>
                    {sale.items.map((item, idx) => {
                      const product = state.products.find(p => p.id === item.productId);
                      return (
                        <div key={idx} className="flex justify-between">
                          <span className="text-slate-600 truncate mr-2">{item.quantity}x {product?.name || 'Deletado'}</span>
                          <span className="text-slate-400 shrink-0">{formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {todaysSales.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma venda realizada hoje.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Excluir Venda</h2>
            <p className="text-slate-600 mb-6 text-[14px]">
              Tem certeza que deseja excluir esta venda de <strong>{formatCurrency(saleToDelete.totalAmount)}</strong>?<br/><br/>
              O estoque será restaurado e o caixa atualizado.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSaleToDelete(null)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-4 py-2 bg-[#800020] text-white rounded-lg hover:bg-[#991b1b] font-medium text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, icon, trend, positive, alert = false }: any) {
  return (
    <div className={`bg-white p-5 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border ${alert ? 'border-l-4 border-l-[#800020] border-[#f1f5f9]' : 'border-[#f1f5f9]'}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[12px] text-slate-500 uppercase tracking-[0.025em] mb-2">{title}</div>
          <div className={`text-[24px] font-bold ${alert ? 'text-[#800020]' : 'text-slate-900'}`}>{value}</div>
        </div>
        {/* Preserving Icon as requested to keep components */}
        <div className="text-slate-400">
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`text-[11px] mt-1 flex items-center gap-1 ${positive !== undefined ? (positive ? 'text-[#10b981]' : 'text-[#800020]') : 'text-slate-500'}`}>
          {positive !== undefined ? (positive ? '▲' : '▼') : ''} {trend}
        </div>
      )}
    </div>
  )
}
