/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { doc, getDoc, setDoc, getDocs, collection, query, limit } from "firebase/firestore";
import { Login } from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import CashFlow from "./pages/CashFlow";
import Reports from "./pages/Reports";

export type UserRole = 'admin' | 'funcionario';

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "pos" | "inventory" | "cashflow" | "reports"
  >("pos");
  
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          const intendedRole = localStorage.getItem('intended_role') as UserRole || 'funcionario';
          let role: UserRole = intendedRole;
          
          if (userSnap.exists()) {
             const data = userSnap.data();
             if (data.role) {
                role = data.role as UserRole;
             }
          } else {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName,
              role: role,
              createdAt: new Date().toISOString()
            });
          }
          
          setUserRole(role);
          setCurrentPage(role === 'admin' ? 'dashboard' : 'pos');
          setUser(currentUser);
        } catch (error) {
          console.warn("Aviso: Permissões insuficientes no Firestore. Continuando com perfil local.", error);
          const intendedRole = localStorage.getItem('intended_role') as UserRole || 'funcionario';
          setUserRole(intendedRole);
          setCurrentPage(intendedRole === 'admin' ? 'dashboard' : 'pos');
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10b981] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return userRole === 'admin' ? <Dashboard setPage={setCurrentPage} /> : <POS />;
      case "pos":
        return <POS />;
      case "inventory":
        return <Inventory />;
      case "cashflow":
        return userRole === 'admin' ? <CashFlow /> : <POS />;
      case "reports":
        return userRole === 'admin' ? <Reports /> : <POS />;
      default:
        return <POS />;
    }
  };

  return (
    <AppProvider>
      <Layout currentPage={currentPage} setPage={setCurrentPage} user={user} userRole={userRole}>
        {renderPage()}
      </Layout>
    </AppProvider>
  );
}


