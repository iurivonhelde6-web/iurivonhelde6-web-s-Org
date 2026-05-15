/**
 * Entities Types
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  minStock: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: "in" | "out";
  quantity: number;
  date: string;
}

export interface CashTransaction {
  id: string;
  type: "in" | "out";
  amount: number;
  description: string;
  date: string;
  paymentMethod?: "dinheiro" | "credito" | "debito"; // Optional for generic transactions, required for sales
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  totalAmount: number;
  date: string;
  items: SaleItem[];
  paymentMethod: "dinheiro" | "credito" | "debito";
}
