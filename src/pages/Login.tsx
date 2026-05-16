import React, { useState } from 'react';
import { loginWithGoogle } from '../lib/firebase';
import { Croissant, LogIn, Lock, User } from 'lucide-react';

export function Login() {
  const [role, setRole] = useState<'admin' | 'funcionario'>('funcionario');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (role === 'admin' && password !== 'admin123') {
      alert("Senha de administrador incorreta.");
      return;
    }
    try {
      localStorage.setItem('intended_role', role);
      await loginWithGoogle();
    } catch (error: any) {
      alert(`Erro ao fazer login: ${error.message || 'Tente novamente.'}`);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#10b981] to-[#800020] flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Croissant size={32} className="text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">System Padaria</h1>
        <p className="text-slate-500 mb-8 text-sm">Selecione seu perfil de acesso</p>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRole('funcionario')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              role === 'funcionario' 
                ? 'bg-[#10b981] text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User size={18} />
            Funcionário
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              role === 'admin' 
                ? 'bg-[#800020] text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Lock size={18} />
            Admin
          </button>
        </div>

        {role === 'admin' && (
          <div className="mb-6 text-left">
            <label className="block text-sm font-medium text-slate-700 mb-2">Senha do Administrador</label>
            <input
              type="password"
              placeholder="Digite a senha (admin123)"
              className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-[#800020] focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Acessar com Google
        </button>
      </div>
      
      <p className="mt-8 text-slate-400 text-xs">v1.2.0 - ERP Scalable</p>
    </div>
  );
}
