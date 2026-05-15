import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { formatCurrency, formatDate } from "../lib/utils";
import { Search, ShoppingCart, Trash2, Plus, Minus, History, Edit2, Clock } from "lucide-react";
import type { Sale } from "../types";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function POS() {
  const { state, registerSale, deleteSale, editingSaleId, setEditingSaleId } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "debito" | "credito">("dinheiro");
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Delete/Edit sale Modals
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  React.useEffect(() => {
    if (editingSaleId) {
      const sale = state.sales.find(s => s.id === editingSaleId);
      if (sale) {
        handleEditSale(sale);
      }
      setEditingSaleId(null);
    }
  }, [editingSaleId, state.sales]);

  // Only show products with stock > 0
  const availableProducts = state.products.filter(p => p.stockQuantity > 0);
  
  const filteredProducts = availableProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev; // Cannot exceed stock
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        maxStock: product.stockQuantity
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.maxStock) {
          return { ...item, quantity: newQ };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    try {
      registerSale(cart.map(i => ({ productId: i.productId, quantity: i.quantity })), paymentMethod);
      alert("Venda realizada com sucesso!");
      setCart([]); // Clear cart
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteConfirm = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete.id);
      setSaleToDelete(null);
    }
  };

  const handleEditSale = (sale: Sale) => {
    // Check if any product is already deleted completely from the system?
    const allProductsExist = sale.items.every(i => state.products.find(p => p.id === i.productId));
    if (!allProductsExist) {
      alert("Não é possível editar esta venda porque um dos produtos foi excluído do sistema.");
      return;
    }

    // Move items to cart
    const itemsForCart: CartItem[] = sale.items.map(item => {
      const p = state.products.find(p => p.id === item.productId)!;
      // Note: p.stockQuantity will increase after we delete the sale, but for now we add item.quantity to the current stock 
      // Because deleting the sale will restore stock!
      return {
        productId: p.id,
        name: p.name,
        price: item.unitPrice,
        quantity: item.quantity,
        maxStock: p.stockQuantity + item.quantity
      };
    });

    setCart(itemsForCart);
    setPaymentMethod(sale.paymentMethod);
    
    // Delete the original sale entirely to free up stock & cashflow
    deleteSale(sale.id);
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#f1f5f9] overflow-hidden">
        <div className="p-4 border-b border-[#f1f5f9]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={20} />
            <input 
              type="text"
              placeholder="Buscar produtos (código ou nome)..."
              className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:bg-white transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col items-start p-4 bg-white border border-[#f1f5f9] rounded-[12px] hover:border-[#10b981] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition text-left h-full"
              >
                <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.025em] mb-2">{product.category}</div>
                <div className="font-medium text-slate-900 line-clamp-2 mb-1 flex-1 text-[13px]">{product.name}</div>
                <div className="font-bold text-[#10b981] mt-2 text-[16px]">{formatCurrency(product.price)}</div>
                <div className="text-[11px] text-slate-500 mt-1">Estoque: {product.stockQuantity}</div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                Nenhum produto disponível em estoque para essa busca.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shopping Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-[16px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-[#f1f5f9] flex flex-col">
        <div className="p-4 border-b border-[#f1f5f9] bg-white rounded-t-[16px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-slate-600" size={20} />
            <h2 className="font-semibold text-slate-800 text-[16px]">Carrinho</h2>
          </div>
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium px-3 py-1.5 bg-slate-50 rounded-lg transition"
          >
            <History size={16} />
            <span className="hidden sm:inline">Histórico</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.productId} className="flex flex-col gap-2 relative">
              <div className="flex justify-between items-start pr-8">
                <span className="font-medium text-slate-800 text-sm leading-tight">{item.name}</span>
                <span className="font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600">
                    <Minus size={14} />
                  </button>
                  <span className="font-mono text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600">
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-xs text-slate-400">Unit: {formatCurrency(item.price)}</span>
              </div>

              <button 
                onClick={() => removeFromCart(item.productId)}
                className="absolute top-0 right-0 p-1 text-slate-300 hover:text-red-500 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 py-10">
              <ShoppingCart size={48} strokeWidth={1} />
              <p>Carrinho vazio</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500">Total</span>
            <span className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</span>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              {(["dinheiro", "debito", "credito"] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 text-sm font-medium rounded-lg capitalize border transition ${
                    paymentMethod === method 
                      ? "bg-slate-800 text-white border-slate-800" 
                      : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-4 bg-[#10b981] hover:bg-emerald-600 disabled:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:cursor-not-allowed text-white rounded-[12px] font-bold text-[16px] transition"
          >
            Finalizar Venda
          </button>
        </div>
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Histórico de Vendas</h2>
                <p className="text-sm text-slate-500">Vendas mais recentes</p>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {state.sales.slice().reverse().map(sale => (
                <div key={sale.id} className="border border-slate-200 rounded-lg p-4 shadow-sm relative group bg-white">
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{formatDate(sale.date)}</span>
                      </div>
                      <span className="text-xs uppercase text-slate-500 tracking-wider bg-slate-100 px-2 py-1 rounded">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 text-lg mb-1">{formatCurrency(sale.totalAmount)}</div>
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditSale(sale)}
                          className="flex items-center gap-1 text-xs text-[#10b981] hover:text-emerald-700 font-medium px-2 py-1 rounded bg-[#10b981]/10 hover:bg-[#10b981]/20 transition"
                          title="Editar Venda"
                        >
                          <Edit2 size={12} /> Editar
                        </button>
                        <button 
                          onClick={() => setSaleToDelete(sale)}
                          className="flex items-center gap-1 text-xs text-[#800020] hover:text-[#991b1b] font-medium px-2 py-1 rounded bg-[#800020]/10 hover:bg-[#800020]/20 transition"
                          title="Excluir Venda"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {sale.items.map((item, idx) => {
                      const product = state.products.find(p => p.id === item.productId);
                      return (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.quantity}x {product?.name || 'Produto Excluído'}</span>
                          <span className="text-slate-500">{formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {state.sales.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma venda registrada ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Excluir Venda</h2>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir esta venda do dia <strong>{formatDate(saleToDelete.date)}</strong>? Os produtos retornarão ao estoque e o fluxo de caixa será atualizado.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSaleToDelete(null)} 
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
