import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency, formatDate } from "../lib/utils";
import { Plus, TrendingUp, TrendingDown, Search, Trash2 } from "lucide-react";

export default function CashFlow() {
  const { state, addCashTransaction, deleteCashTransaction } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<{id: string, description: string} | null>(null);

  const transactions = state.cashFlow
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    
    addCashTransaction({
      type: formData.get("type") as "in" | "out",
      amount,
      description: formData.get("description") as string,
    });
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      deleteCashTransaction(transactionToDelete.id);
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  // Safe checks for total
  const totalEntries = state.cashFlow.filter(t => t.type === 'in').reduce((acc, t) => acc + t.amount, 0);
  const totalExits = state.cashFlow.filter(t => t.type === 'out').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalEntries - totalExits;

  return (
    <div className="space-y-6">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#f1f5f9]">
          <p className="text-[12px] text-slate-500 uppercase tracking-[0.025em] mb-2">Entradas</p>
          <p className="text-[24px] font-bold text-[#10b981]">{formatCurrency(totalEntries)}</p>
        </div>
        <div className="bg-white p-5 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#f1f5f9]">
          <p className="text-[12px] text-slate-500 uppercase tracking-[0.025em] mb-2">Saídas</p>
          <p className="text-[24px] font-bold text-[#800020]">{formatCurrency(totalExits)}</p>
        </div>
        <div className={`p-5 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border ${balance >= 0 ? 'bg-[#10b981]/5 border-[#10b981]/20' : 'bg-[#800020]/5 border-[#800020]/20'}`}>
          <p className={`text-[12px] uppercase tracking-[0.025em] mb-2 ${balance >= 0 ? 'text-[#10b981]' : 'text-[#800020]'}`}>Saldo Geral</p>
          <p className={`text-[24px] font-bold ${balance >= 0 ? 'text-[#10b981]' : 'text-[#800020]'}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar lançamentos..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <Plus size={20} />
          Novo Lançamento
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#f1f5f9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1f5f9] text-[#94a3b8] text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-4">Data/Hora</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition p-4 border-b border-[#f8fafc] text-[13px]">
                  <td className="p-4 text-slate-500 text-[13px]">{formatDate(tx.date)}</td>
                  <td className="p-4 font-medium text-slate-800">{tx.description}</td>
                  <td className="p-4">
                    {tx.type === 'in' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#10b981]/10 text-[#10b981]">
                        <TrendingUp size={14} /> Entrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#800020]/10 text-[#800020]">
                        <TrendingDown size={14} /> Saída
                      </span>
                    )}
                  </td>
                  <td className={`p-4 text-right font-medium ${tx.type === 'in' ? 'text-[#10b981]' : 'text-[#800020]'}`}>
                    {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setTransactionToDelete({ id: tx.id, description: tx.description });
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-[#800020] transition"
                      title="Excluir Lançamento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Novo Lançamento Manual</h2>
            </div>
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select name="type" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                  <option value="in">Entrada (Receita)</option>
                  <option value="out">Saída (Despesa)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input required name="description" type="text" placeholder="Ex: Pagamento Fornecedor" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input required min="0.01" step="0.01" name="amount" type="number" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && transactionToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Excluir Lançamento</h2>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir o lançamento <strong>{transactionToDelete.description}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-4 py-2 bg-[#800020] text-white rounded-lg hover:bg-[#991b1b] font-medium"
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
