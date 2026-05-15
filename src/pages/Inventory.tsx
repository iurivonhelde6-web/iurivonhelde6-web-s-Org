import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency, formatDate } from "../lib/utils";
import { Plus, Search, Edit2, AlertCircle, Trash2 } from "lucide-react";
import type { Product } from "../types";

export default function Inventory() {
  const { state, addProduct, updateProduct, deleteProduct, registerStockMovement } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Edit mode vs Add mode in modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Move Stock Modal
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movementTarget, setMovementTarget] = useState<Product | null>(null);
  const [moveType, setMoveType] = useState<"in" | "out">("in");

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filteredProducts = state.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      price: Number(formData.get("price")),
      stockQuantity: Number(formData.get("stockQuantity")),
      minStock: Number(formData.get("minStock")),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setIsModalOpen(false);
  };

  const handleMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!movementTarget) return;

    const quantity = Number(new FormData(e.currentTarget).get("quantity"));
    try {
      registerStockMovement(movementTarget.id, quantity, moveType);
      setMoveModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-[#10b981] hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#f1f5f9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1f5f9] text-[#94a3b8] text-[11px] uppercase tracking-wider font-semibold">
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Estoque</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {filteredProducts.map((product) => {
                const isLowStock = product.stockQuantity <= product.minStock;
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition p-4 border-b border-[#f8fafc] text-[13px]">
                    <td className="p-4 font-medium text-slate-800">{product.name}</td>
                    <td className="p-4 text-slate-500">{product.category}</td>
                    <td className="p-4 text-slate-800">{formatCurrency(product.price)}</td>
                    <td className="p-4 font-mono text-slate-700">{product.stockQuantity}</td>
                    <td className="p-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#800020] text-white">
                          CRÍTICO
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#10b981] text-white">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setMovementTarget(product);
                            setMoveModalOpen(true);
                          }}
                          className="px-3 py-1 text-xs font-medium border border-slate-300 rounded hover:bg-slate-100 transition"
                        >
                          Movimentar
                        </button>
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-slate-500 hover:text-[#10b981] transition"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setProductToDelete(product);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-[#800020] transition"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h2>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input required defaultValue={editingProduct?.name} name="name" type="text" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <input required defaultValue={editingProduct?.category} name="category" type="text" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                <input required defaultValue={editingProduct?.price} step="0.01" min="0" name="price" type="number" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Atual</label>
                  <input required defaultValue={editingProduct?.stockQuantity ?? 0} min="0" name="stockQuantity" type="number" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input required defaultValue={editingProduct?.minStock ?? 5} min="0" name="minStock" type="number" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-emerald-600">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {moveModalOpen && movementTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Movimentar Estoque</h2>
              <p className="text-sm text-slate-500 mt-1">{movementTarget.name}</p>
            </div>
            <form onSubmit={handleMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Movimento</label>
                <select 
                  value={moveType} 
                  onChange={(e) => setMoveType(e.target.value as "in"|"out")}
                  className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
                  <option value="in">Entrada (+)</option>
                  <option value="out">Saída (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                <input required min="1" max={moveType === 'out' ? movementTarget.stockQuantity : undefined} name="quantity" type="number" className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setMoveModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-emerald-600">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Excluir Produto</h2>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir <strong>{productToDelete.name}</strong>? Esta ação não pode ser desfeita.
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
