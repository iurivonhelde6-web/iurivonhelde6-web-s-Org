import React from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency, formatDate } from "../lib/utils";
import { 
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip, ResponsiveContainer 
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Printer } from "lucide-react";

export default function Reports() {
  const { state } = useApp();

  // Weekly calculations
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const thisWeekCashFlow = state.cashFlow.filter(tx => 
    isWithinInterval(new Date(tx.date), { start: weekStart, end: weekEnd })
  );

  const weeklyIncome = thisWeekCashFlow.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
  const weeklyExpense = thisWeekCashFlow.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0);
  const weeklyProfit = weeklyIncome - weeklyExpense;

  // Payment Methods calculation inside sales
  const salesByMethod = state.sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Dinheiro', value: salesByMethod['dinheiro'] || 0, color: '#10b981' },
    { name: 'Débito', value: salesByMethod['debito'] || 0, color: '#3b82f6' },
    { name: 'Crédito', value: salesByMethod['credito'] || 0, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Last 7 days flow area chart
  const areaData = Array.from({length: 7}).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'MMM dd');
    
    const dayStart = new Date(d.setHours(0,0,0,0));
    const dayEnd = new Date(d.setHours(23,59,59,999));
    
    const dayTxs = state.cashFlow.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= dayStart && txDate <= dayEnd;
    });

    return {
      name: dateStr,
      Entradas: dayTxs.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0),
      Saídas: dayTxs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0),
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto printable-area">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[16px] border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatório Semanal</h2>
          <p className="text-slate-500 text-sm mt-1">{formatDate(weekStart)} até {formatDate(weekEnd)}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">Lucro Líquido</p>
            <p className={`text-3xl font-bold ${weeklyProfit >= 0 ? "text-green-600" : "text-maroon-600"}`}>
              {formatCurrency(weeklyProfit)}
            </p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Receitas vs Despesas (Últimos 7 dias) */}
        <div className="bg-white p-6 rounded-[16px] border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <h3 className="text-[16px] font-semibold text-slate-800 mb-6">Fluxo - Últimos 7 dias</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748B', fontSize: 12}}
                  tickFormatter={(val) => `R$${val}`}
                />
                <AreaTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="Entradas" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="Saídas" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métodos de Pagamento */}
        <div className="bg-white p-6 rounded-[16px] border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
          <h3 className="text-[16px] font-semibold text-slate-800 mb-6">Vendas por Forma de Pagamento</h3>
          
          {pieData.length > 0 ? (
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <PieTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400">
              <p>Nenhuma venda registrada.</p>
            </div>
          )}
        </div>

      </div>

      {/* Resumo da Semana */}
      <div className="bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#f1f5f9] overflow-hidden">
        <div className="p-6 border-b border-[#f1f5f9]">
          <h3 className="text-[16px] font-semibold text-slate-800">Detalhamento Semanal</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-4">Total de Entradas</p>
              <p className="text-3xl font-bold text-green-600 mb-4">{formatCurrency(weeklyIncome)}</p>
              <div className="space-y-2">
                {thisWeekCashFlow.filter(t => t.type === 'in').slice(0,5).map(t => (
                  <div key={t.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-600 truncate mr-4">{t.description}</span>
                    <span className="font-medium text-green-700">{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-4">Total de Saídas</p>
              <p className="text-3xl font-bold text-red-600 mb-4">{formatCurrency(weeklyExpense)}</p>
              <div className="space-y-2">
                {thisWeekCashFlow.filter(t => t.type === 'out').slice(0,5).map(t => (
                  <div key={t.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-600 truncate mr-4">{t.description}</span>
                    <span className="font-medium text-red-700">{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
