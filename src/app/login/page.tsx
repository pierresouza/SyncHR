'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_USERS, storage } from '@/lib/storage';
import { KeyRound, Mail, AlertTriangle, ShieldAlert, Check, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration States
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'LEADER' | 'RH'>('LEADER');

  useEffect(() => {
    storage.initialize();
    const user = storage.getCurrentUser();
    if (user) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Tentar logar via Supabase Auth
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2. Se falhar por usuário inexistente, mas for uma conta Mock, realizar auto-cadastro
      const mockUser = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (authError && mockUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: mockUser.name,
              role: mockUser.role,
              profile: mockUser.profile,
            }
          }
        });

        if (!signUpError && signUpData.user) {
          // Criar registro na tabela public.profiles
          await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            profile_type: mockUser.profile,
            level_from: 'Coordenador',
            level_to: 'Gerente'
          });

          // Tentar login novamente
          const reSignIn = await supabase.auth.signInWithPassword({ email, password });
          authData = reSignIn.data;
          authError = reSignIn.error;
        } else if (signUpError) {
          authError = signUpError;
        }
      }

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu e-mail ou desative a confirmação de e-mail nas configurações do Supabase.');
        } else if (authError.message.toLowerCase().includes('invalid grant') || authError.message.toLowerCase().includes('invalid credentials') || authError.message.toLowerCase().includes('invalid login credentials')) {
          setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // Buscar perfil na tabela public.profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError || !profile) {
          // Fallback caso o profile público não tenha sido criado
          console.warn('Perfil público não encontrado, criando...', profileError);
          const meta = authData.user.user_metadata;
          const { data: newProfile } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email: authData.user.email!,
            name: meta?.name || 'Usuário',
            role: meta?.role || 'LEADER',
            profile_type: meta?.profile || 'PENDENTE',
            level_from: 'Coordenador',
            level_to: 'Gerente'
          }).select().single();

          if (newProfile) {
            storage.setCurrentUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              role: newProfile.role as any,
              profile: newProfile.profile_type as any,
            });
            router.push('/');
            return;
          }
          setError('Erro ao carregar ou criar o perfil do usuário.');
          setLoading(false);
          return;
        }

        storage.setCurrentUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          profile: profile.profile_type,
        });
        router.push('/');
      }
    } catch (err: any) {
      setError('Erro inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            name: regName,
            role: regRole,
            profile: regRole === 'RH' ? 'ADMINISTRADOR' : 'PENDENTE'
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        // Criar registro público correspondente
        await supabase.from('profiles').insert({
          id: signUpData.user.id,
          email: regEmail,
          name: regName,
          role: regRole,
          profile_type: regRole === 'RH' ? 'ADMINISTRADOR' : 'PENDENTE',
          level_from: 'Coordenador',
          level_to: 'Gerente'
        });

        Swal.fire({
          title: 'Cadastro Realizado!',
          text: 'Usuário cadastrado com sucesso! Caso necessário, confirme seu e-mail antes de logar.',
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'border border-slate-800 rounded-2xl font-sans' }
        });

        setMode('login');
        setEmail(regEmail);
        setPassword(regPassword);
      }
    } catch (err: any) {
      setError('Erro ao cadastrar: ' + err.message);
    } finally {
      setLoading(false);
    }
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

            {mode === 'login' ? (
              <>
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
                    <span>Acesso Rápido de Teste (Administração)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-left">
                    {MOCK_USERS.filter(u => u.role === 'RH').map((user) => {
                      const isRH = user.role === 'RH';

                      return (
                        <button
                          key={user.email}
                          onClick={() => handleSelectMock(user)}
                          type="button"
                          className="p-2 text-xs rounded-lg bg-slate-900/40 border border-slate-900 hover:bg-slate-900/80 hover:border-slate-800/80 text-slate-300 transition-all truncate flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                          {isRH && (
                            <span className="text-[11px] bg-cyan-950/50 text-cyan-400 border border-cyan-900/40 px-1.5 py-0.5 rounded font-mono font-bold">RH</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold font-title text-slate-100">Criar Nova Conta</h2>
                  <p className="text-xs text-slate-400">Cadastre-se na plataforma corporativa SyncHR</p>
                </div>

                {error && (
                  <div className="flex gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 items-start">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">Nome Completo</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ana Souza"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-900/90 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono">Email Corporativo</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ana.souza@clearit.com.br"
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
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-900/90 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-mono block">Tipo de Papel (Função)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegRole('LEADER')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${regRole === 'LEADER'
                            ? 'bg-indigo-900/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/80'
                          }`}
                      >
                        Líder / Gestor
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('RH')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${regRole === 'RH'
                            ? 'bg-indigo-900/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/80'
                          }`}
                      >
                        Administrador RH
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-slate-100 text-sm font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 glow-btn"
                  >
                    {loading ? 'Cadastrando...' : 'Criar Nova Conta'}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-all hover:underline font-mono uppercase tracking-wider"
                  >
                    Já tem uma conta? Entrar
                  </button>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}
