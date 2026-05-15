import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product, StockMovement, CashTransaction, Sale } from "../types";

interface AppState {
  products: Product[];
  movements: StockMovement[];
  cashFlow: CashTransaction[];
  sales: Sale[];
}

interface AppContextType {
  state: AppState;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  registerStockMovement: (
    productId: string,
    quantity: number,
    type: "in" | "out"
  ) => void;
  registerSale: (
    items: { productId: string; quantity: number }[],
    paymentMethod: "dinheiro" | "credito" | "debito"
  ) => void;
  addCashTransaction: (transaction: Omit<CashTransaction, "id" | "date">) => void;
  deleteProduct: (id: string) => void;
  deleteCashTransaction: (id: string) => void;
  deleteSale: (id: string) => void;
  editingSaleId: string | null;
  setEditingSaleId: (id: string | null) => void;
}

const defaultState: AppState = {
  products: [],
  movements: [],
  cashFlow: [],
  sales: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem("padaria_data");
      return saved ? JSON.parse(saved) : defaultState;
    } catch {
      return defaultState;
    }
  });

  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("padaria_data", JSON.stringify(state));
  }, [state]);

  const addProduct = (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
    };
    setState((prev) => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const deleteProduct = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const registerStockMovement = (
    productId: string,
    quantity: number,
    type: "in" | "out"
  ) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) throw new Error("Produto não encontrado.");

    if (type === "out" && product.stockQuantity < quantity) {
      throw new Error("Estoque insuficiente.");
    }

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      productId,
      type,
      quantity,
      date: new Date().toISOString(),
    };

    setState((prev) => {
      const newProducts = prev.products.map((p) => {
        if (p.id === productId) {
          const newQuantity =
            type === "in" ? p.stockQuantity + quantity : p.stockQuantity - quantity;
          return { ...p, stockQuantity: newQuantity };
        }
        return p;
      });

      return {
        ...prev,
        products: newProducts,
        movements: [...prev.movements, movement],
      };
    });
  };

  const registerSale = (
    items: { productId: string; quantity: number }[],
    paymentMethod: "dinheiro" | "credito" | "debito"
  ) => {
    // Validate stock and calculate total
    const products = state.products;
    let totalAmount = 0;
    const saleItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Produto id ${item.productId} não encontrado.`);
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}.`);
      }
      totalAmount += product.price * item.quantity;
      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    const date = new Date().toISOString();
    const newSale: Sale = {
      id: crypto.randomUUID(),
      totalAmount,
      date,
      items: saleItems,
      paymentMethod,
    };

    const cashEntry: CashTransaction = {
      id: crypto.randomUUID(),
      type: "in",
      amount: totalAmount,
      description: `Venda ${newSale.id.substring(0, 8)}`,
      date,
      paymentMethod,
    };

    const newMovements: StockMovement[] = saleItems.map((item) => ({
      id: crypto.randomUUID(),
      productId: item.productId,
      type: "out",
      quantity: item.quantity,
      date,
    }));

    setState((prev) => {
      const newProducts = [...prev.products];
      saleItems.forEach((item) => {
        const pIndex = newProducts.findIndex((p) => p.id === item.productId);
        if (pIndex > -1) {
          newProducts[pIndex] = {
            ...newProducts[pIndex],
            stockQuantity: newProducts[pIndex].stockQuantity - item.quantity,
          };
        }
      });

      return {
        ...prev,
        products: newProducts,
        sales: [...prev.sales, newSale],
        cashFlow: [...prev.cashFlow, cashEntry],
        movements: [...prev.movements, ...newMovements],
      };
    });
  };

  const addCashTransaction = (
    transactionData: Omit<CashTransaction, "id" | "date">
  ) => {
    const newTransaction: CashTransaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      cashFlow: [...prev.cashFlow, newTransaction],
    }));
  };

  const deleteCashTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      cashFlow: prev.cashFlow.filter((tx) => tx.id !== id),
    }));
  };

  const deleteSale = (id: string) => {
    setState((prev) => {
      const sale = prev.sales.find((s) => s.id === id);
      if (!sale) return prev;

      const newProducts = [...prev.products];
      sale.items.forEach((item) => {
        const pIndex = newProducts.findIndex((p) => p.id === item.productId);
        if (pIndex > -1) {
          newProducts[pIndex] = {
            ...newProducts[pIndex],
            stockQuantity: newProducts[pIndex].stockQuantity + item.quantity,
          };
        }
      });

      const reversalMovements: StockMovement[] = sale.items.map((item) => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        type: "in",
        quantity: item.quantity,
        date: new Date().toISOString(),
      }));

      return {
        ...prev,
        products: newProducts,
        sales: prev.sales.filter((s) => s.id !== id),
        cashFlow: prev.cashFlow.filter((tx) => tx.description !== `Venda ${sale.id.substring(0, 8)}`),
        movements: [...prev.movements, ...reversalMovements],
      };
    });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addProduct,
        updateProduct,
        deleteProduct,
        registerStockMovement,
        registerSale,
        addCashTransaction,
        deleteCashTransaction,
        deleteSale,
        editingSaleId,
        setEditingSaleId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
