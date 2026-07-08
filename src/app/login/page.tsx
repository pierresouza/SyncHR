'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_USERS, storage } from '@/lib/storage';
import { KeyRound, Mail, AlertTriangle, ShieldAlert, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    storage.initialize();
    const user = storage.getCurrentUser();
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const match = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (match) {
        storage.setCurrentUser({
          email: match.email,
          name: match.name,
          role: match.role,
          profile: match.profile,
        });
        router.push('/');
      } else {
        setError('Credenciais inválidas. Verifique o email e a senha digitados.');
        setLoading(false);
      }
    }, 500);
  };

  const handleSelectMock = (u: typeof MOCK_USERS[number]) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative z-10 font-sans">
      <div className="w-full max-w-[950px] grid md:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand Text & Pain points presentation */}
        <div className="md:col-span-6 text-left space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent font-extrabold font-title">
              SyncHR
            </span>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="text-xs tracking-widest text-indigo-400 uppercase font-mono">
              Smart Leading
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-title text-slate-100 leading-tight">
              Calibração de Liderança & Roteiros Inteligentes
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              O copiloto de IA construído especificamente para a Clear IT Brasil. 
              Gere pautas estruturadas, simule conversas difíceis e gerencie 
              escalações de conflitos de forma ética e em total conformidade com a LGPD.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <h4 className="text-sm font-semibold text-slate-200">Roteiros F-03</h4>
              <p className="text-xs text-slate-400">Modelos baseados em DISC e nível.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <h4 className="text-sm font-semibold text-slate-200">Escalação F-05</h4>
              <p className="text-xs text-slate-400">Verificação automática de 45 dias.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphism Login Card */}
        <div className="md:col-span-6 w-full">
          <div className="glass-card p-8 rounded-2xl border border-slate-800/60 bg-slate-950/70 shadow-2xl space-y-6">
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-title text-slate-100">Portal de Acesso</h2>
              <p className="text-xs text-slate-400">Entre com suas credenciais organizacionais</p>
            </div>

            {error && (
              <div className="flex gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 items-start">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">Email Corporativo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lider.tech@clearit.com.br"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-900/90 transition-all font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">Senha de Segurança</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-900/90 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-slate-100 text-sm font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 glow-btn"
              >
                {loading ? 'Validando Acesso...' : 'Autenticar no Sistema'}
              </button>
            </form>

            {/* Test Accounts Segment */}
            <div className="pt-4 border-t border-slate-900 space-y-2">
              <div className="flex items-center gap-1.5 text-xs tracking-wide text-slate-400 uppercase font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulação de Contas de Teste (Clique para preencher)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-left">
                {MOCK_USERS.map((user) => {
                  const isPending = user.email.includes('novo');
                  const isRH = user.role === 'RH';
                  
                  return (
                    <button
                      key={user.email}
                      onClick={() => handleSelectMock(user)}
                      type="button"
                      className="p-2 text-xs rounded-lg bg-slate-900/40 border border-slate-900 hover:bg-slate-900/80 hover:border-slate-800/80 text-slate-300 transition-all truncate"
                    >
                      <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 flex justify-between items-center mt-0.5">
                        <span>{user.email.split('@')[0]}</span>
                        {isPending && (
                          <span className="text-[11px] bg-amber-950/50 text-amber-400 border border-amber-900/40 px-1 rounded">Novo</span>
                        )}
                        {isRH && (
                          <span className="text-[11px] bg-cyan-950/50 text-cyan-400 border border-cyan-900/40 px-1 rounded">RH</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
