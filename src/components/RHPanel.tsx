'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  PlusCircle,
  UserCheck,
  ShieldAlert,
  User
} from 'lucide-react';
import Swal from 'sweetalert2';
import { UserSession, Collaborator, OneOnOne, ConflictEscalation as Conflict, LeaderProfile } from '@/types';
import { sendCollaboratorWelcomeEmail } from '@/lib/emailService';

interface RHPanelProps {
  currentUser: UserSession;
  collaborators: Collaborator[];
  oneOnOnes: OneOnOne[];
  conflicts: Conflict[];
  profiles: LeaderProfile[];
  fetchDatabaseData: (user: UserSession) => void;
}

export default function RHPanel({
  currentUser,
  collaborators,
  oneOnOnes,
  conflicts,
  profiles,
  fetchDatabaseData
}: RHPanelProps) {
  // Leaders registration states
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [newLeaderPassword, setNewLeaderPassword] = useState('SyncHR@2025');

  // Collaborators registration states
  const [newColabName, setNewColabName] = useState('');
  const [newColabEmail, setNewColabEmail] = useState('');
  const [newColabRole, setNewColabRole] = useState('');
  const [newColabLevel, setNewColabLevel] = useState('L2');
  const [newColabLeaderId, setNewColabLeaderId] = useState('');

  // Collaborators editing states
  const [editingColab, setEditingColab] = useState<Collaborator | null>(null);
  const [editColabName, setEditColabName] = useState('');
  const [editColabRole, setEditColabRole] = useState('');
  const [editColabLevel, setEditColabLevel] = useState('L2');
  const [editColabLeaderId, setEditColabLeaderId] = useState('');

  const handleRHRegisterLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderName.trim() || !newLeaderEmail.trim()) {
      Swal.fire('Atenção', 'Preencha nome e e-mail corporativo.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeaderName,
          email: newLeaderEmail,
          password: newLeaderPassword || 'SyncHR@2025',
          role: 'LEADER'
        })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      Swal.fire({
        title: 'Líder Cadastrado!',
        text: `Gestor(a) ${newLeaderName} foi criado(a) e receberá o acesso por e-mail.`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setNewLeaderName('');
      setNewLeaderEmail('');
      fetchDatabaseData(currentUser);
    } catch (err: any) {
      Swal.fire('Erro no Cadastro', err.message, 'error');
    }
  };

  const handleRHRegisterCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColabName.trim() || !newColabRole.trim() || !newColabEmail.trim()) {
      Swal.fire('Atenção', 'Preencha todos os campos do colaborador.', 'warning');
      return;
    }

    try {
      const { error } = await supabase.from('collaborators').insert({
        name: newColabName,
        email: newColabEmail,
        disc: 'PENDENTE',
        level: newColabLevel,
        role: newColabRole,
        leader_id: newColabLeaderId || null
      });

      if (error) throw error;

      // Enviar e-mail de boas-vindas para o liderado
      try {
        await sendCollaboratorWelcomeEmail({
          colabEmail: newColabEmail,
          colabName: newColabName
        });
      } catch (emailErr) {
        console.error('[Error sending welcome email to collaborator]:', emailErr);
      }

      Swal.fire({
        title: 'Colaborador Cadastrado!',
        text: `${newColabName} foi cadastrado(a) e receberá um e-mail de boas-vindas.`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setNewColabName('');
      setNewColabEmail('');
      setNewColabRole('');
      fetchDatabaseData(currentUser);
    } catch (err: any) {
      Swal.fire('Erro no Cadastro', err.message, 'error');
    }
  };

  const handleStartEditCollaborator = (colab: Collaborator) => {
    setEditingColab(colab);
    setEditColabName(colab.name || '');
    setEditColabRole(colab.role || '');
    setEditColabLevel(colab.level || 'L2');
    setEditColabLeaderId(colab.leaderId || '');
  };

  const handleSaveEditCollaborator = async () => {
    if (!editingColab) return;
    try {
      const { error } = await supabase
        .from('collaborators')
        .update({
          name: editColabName,
          role: editColabRole,
          level: editColabLevel,
          leader_id: editColabLeaderId || null
        })
        .eq('id', editingColab.id);

      if (error) throw error;

      Swal.fire({
        title: 'Liderado Atualizado!',
        text: `Os dados do colaborador ${editColabName} foram atualizados com sucesso.`,
        icon: 'success',
        background: '#0f172a',
        color: '#cbd5e1'
      });

      setEditingColab(null);
      fetchDatabaseData(currentUser);
    } catch (err: any) {
      Swal.fire('Erro ao Salvar', err.message, 'error');
    }
  };

  const handleResolveConflict = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('conflicts')
        .update({ status: 'RESOLVED', notes: notes })
        .eq('id', id);

      if (error) throw error;

      Swal.fire('Sucesso', 'Conflito arquivado como Solucionado!', 'success');
      fetchDatabaseData(currentUser);
    } catch (err: any) {
      Swal.fire('Erro', err.message, 'error');
    }
  };

  const handleDeleteCollaborator = async (id: string, name: string) => {
    const confirm = await Swal.fire({
      title: 'Excluir Liderado?',
      text: `Tem certeza que deseja deletar o colaborador(a) ${name}? Esta ação não pode ser desfeita e removerá seus históricos de reuniões associadas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, Deletar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#cbd5e1',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4f46e5'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch('/api/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, type: 'COLLABORATOR' })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error || 'Erro ao excluir no servidor.');

        Swal.fire({
          title: 'Excluído!',
          text: 'O colaborador foi removido do Supabase com sucesso.',
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });
        fetchDatabaseData(currentUser);
      } catch (err: any) {
        Swal.fire('Erro ao Excluir', err.message, 'error');
      }
    }
  };

  const handleDeleteLeader = async (id: string, name: string) => {
    try {
      // 1. Verificar integridade referencial no Supabase
      const { data: colabs, error: checkErr } = await supabase
        .from('collaborators')
        .select('id')
        .eq('leader_id', id);

      if (checkErr) throw checkErr;

      if (colabs && colabs.length > 0) {
        Swal.fire({
          title: 'Exclusão Bloqueada',
          text: `O gestor(a) ${name} possui ${colabs.length} liderado(s) ativamente vinculado(s). Por favor, transfira a equipe para outro gestor antes de excluí-lo.`,
          icon: 'error',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });
        return;
      }

      const confirm = await Swal.fire({
        title: 'Excluir Líder?',
        text: `Tem certeza que deseja deletar o gestor(a) ${name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, Deletar',
        cancelButtonText: 'Cancelar',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#4f46e5'
      });

      if (confirm.isConfirmed) {
        const res = await fetch('/api/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, type: 'LEADER' })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error || 'Erro ao excluir no servidor.');

        Swal.fire({
          title: 'Excluído!',
          text: 'O gestor foi removido do Supabase com sucesso.',
          icon: 'success',
          background: '#0f172a',
          color: '#cbd5e1',
          confirmButtonColor: '#4f46e5'
        });
        fetchDatabaseData(currentUser);
      }
    } catch (err: any) {
      Swal.fire('Erro ao Excluir', err.message, 'error');
    }
  };

  const activeLeaders = profiles.filter(p => p.profile !== 'ADMINISTRADOR');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100 font-title">Painel de Governança e Clima do RH</h2>
        <p className="text-xs text-slate-400">Visibilidade unificada das reuniões, taxa de conformidade e cadastro corporativo do ecossistema.</p>
      </div>

      {/* Key Metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Adesão Geral</div>
          <div className="text-2xl font-black text-indigo-400 font-mono">100%</div>
          <p className="text-[9px] text-slate-500">Reuniões calendas batidas</p>
        </div>
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Índice eNPS Médio</div>
          <div className="text-2xl font-black text-cyan-400 font-mono">8.4 / 10</div>
          <p className="text-[9px] text-slate-500">Clima organizacional saudável</p>
        </div>
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Alinhamento Médio</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {oneOnOnes.length > 0
              ? `${Math.round(oneOnOnes.reduce((acc, curr) => acc + (curr.consistencyResult?.confidenceScore || 90), 0) / oneOnOnes.length)}%`
              : 'N/A'}
          </div>
          <p className="text-[9px] text-slate-500">Concordância calculada por IA</p>
        </div>
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Mediações Pendentes</div>
          <div className="text-2xl font-black text-amber-500 font-mono">
            {conflicts.filter(c => c.status === 'PENDING').length}
          </div>
          <p className="text-[9px] text-slate-500">Exige intervenção de Priscila</p>
        </div>
      </div>

      {/* Tabs for RH: Cadastros vs Conflicts */}
      <div className="grid md:grid-cols-12 gap-6 pt-4 font-sans">
        {/* Left: Administrative registrations */}
        <div className="md:col-span-6 space-y-6">
          {/* Register Leader */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 font-title">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              Cadastrar Novo Líder
            </h3>
            <form onSubmit={handleRHRegisterLeader} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newLeaderName}
                    onChange={(e) => setNewLeaderName(e.target.value)}
                    placeholder="Ex: Carlos Abreu"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Email Corporativo</label>
                  <input
                    type="email"
                    required
                    value={newLeaderEmail}
                    onChange={(e) => setNewLeaderEmail(e.target.value)}
                    placeholder="ex: lider.carlos@clearit.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Senha Padrão (Mín. 6 Caracteres)</label>
                <input
                  type="password"
                  required
                  value={newLeaderPassword}
                  onChange={(e) => setNewLeaderPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-bold py-2 rounded-lg transition-all"
              >
                Registrar Líder no Supabase
              </button>
            </form>
          </div>

          {/* Register Collaborator */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 font-title">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              Cadastrar Novo Colaborador (Liderado)
            </h3>
            <form onSubmit={handleRHRegisterCollaborator} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newColabName}
                    onChange={(e) => setNewColabName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Cargo / Função</label>
                  <input
                    type="text"
                    required
                    value={newColabRole}
                    onChange={(e) => setNewColabRole(e.target.value)}
                    placeholder="Ex: Dev Back-end Pleno"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={newColabEmail}
                  onChange={(e) => setNewColabEmail(e.target.value)}
                  placeholder="Ex: joao.silva@clearit.com.br"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Nível</label>
                  <select
                    value={newColabLevel}
                    onChange={(e) => setNewColabLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="L1">L1 (Júnior)</option>
                    <option value="L2">L2 (Pleno)</option>
                    <option value="L3">L3 (Sênior)</option>
                    <option value="L4">L4 (Principal)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Líder Relacionado</label>
                  <select
                    value={newColabLeaderId}
                    onChange={(e) => setNewColabLeaderId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="">Nenhum</option>
                    {activeLeaders.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-650 hover:bg-cyan-550 text-slate-100 text-xs font-bold py-2 rounded-lg transition-all"
              >
                Registrar Colaborador no Supabase
              </button>
            </form>
          </div>

          {/* Active Leaders List */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 border-b border-slate-900 pb-2 font-title">
              <UserCheck className="w-4.5 h-4.5 text-indigo-400" />
              Gestores Cadastrados ({activeLeaders.length})
            </h3>

            {activeLeaders.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum gestor cadastrado.</p>
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs text-slate-300 text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-mono uppercase text-[9px]">
                      <th className="py-2">Nome</th>
                      <th className="py-2">Perfil</th>
                      <th className="py-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLeaders.map(p => (
                      <tr key={p.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                        <td className="py-2 font-medium">
                          <div>{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.email}</div>
                        </td>
                        <td className="py-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            p.profile === 'PENDENTE'
                              ? 'bg-amber-950/50 text-amber-400 border border-amber-900/40'
                              : 'bg-indigo-950/50 text-indigo-300 border border-indigo-900/40'
                          }`}>
                            {p.profile}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          {p.email !== 'rh.priscila@clearit.com.br' ? (
                            <button
                              onClick={() => handleDeleteLeader(p.id as string, p.name)}
                              className="text-[10px] text-red-400 hover:text-red-300 hover:underline font-bold px-2 py-1 transition-all"
                            >
                              Deletar
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">RH Admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Conflict Alerts & Auditing */}
        <div className="md:col-span-6 space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 font-title">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Alertas de Atrito e Mediações de Conflito
            </h3>

            {conflicts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum atrito reportado pela IA ou pelos Líderes.</p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {conflicts.map(conf => (
                  <div key={conf.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <strong className="text-slate-200">{conf.collaboratorName}</strong>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Protocolo: {conf.protocol}</div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        conf.status === 'PENDING'
                          ? 'bg-red-950 text-red-400 border border-red-900/60'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                      }`}>
                        {conf.status === 'PENDING' ? 'Pendente' : 'Solucionado'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{conf.description}</p>

                    {conf.status === 'PENDING' ? (
                      <button
                        onClick={async () => {
                          const { value: notes } = await Swal.fire({
                            title: 'Resolver Conflito',
                            input: 'textarea',
                            inputLabel: 'Ações tomadas pelo RH (Priscila):',
                            inputPlaceholder: 'Descreva a resolução...',
                            inputAttributes: { 'aria-label': 'Resolução' },
                            showCancelButton: true,
                            background: '#0f172a',
                            color: '#cbd5e1',
                            confirmButtonColor: '#4f46e5'
                          });
                          if (notes) {
                            handleResolveConflict(conf.id, notes);
                          }
                        }}
                        className="text-[10px] bg-indigo-900/40 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-bold px-2 py-1 rounded"
                      >
                        Resolver e Arquivar
                      </button>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-sans border-t border-slate-900/60 pt-1">
                        <strong>Resolução:</strong> {conf.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Collaborators List */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 border-b border-slate-900 pb-2 font-title">
              <User className="w-4.5 h-4.5 text-cyan-400" />
              Liderados Cadastrados ({collaborators.length})
            </h3>

            {collaborators.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum colaborador cadastrado.</p>
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs text-slate-300 text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-mono uppercase text-[9px]">
                      <th className="py-2">Nome</th>
                      <th className="py-2">Cargo / DISC / Nível</th>
                      <th className="py-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collaborators.map(colab => {
                      const matchedLeader = profiles.find(p => p.id === colab.leaderId);
                      return (
                        <tr key={colab.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                          <td className="py-2 font-medium">
                            <div>{colab.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Líder: {matchedLeader ? matchedLeader.name : 'Nenhum'}
                            </div>
                          </td>
                          <td className="py-2">
                            <div className="text-slate-400">{colab.role}</div>
                            <div className="flex gap-1.5 mt-0.5">
                              <span className="text-[9px] bg-slate-900 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold">{colab.disc}</span>
                              <span className="text-[9px] bg-slate-900 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">{colab.level}</span>
                            </div>
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStartEditCollaborator(colab)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold px-1.5 py-1 transition-all"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteCollaborator(colab.id as string, colab.name)}
                                className="text-[10px] text-red-400 hover:text-red-300 hover:underline font-bold px-1.5 py-1 transition-all"
                              >
                                Deletar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingColab && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl space-y-4 font-sans text-left">
            <h3 className="font-bold text-slate-100 text-sm border-b border-slate-900 pb-2 flex items-center gap-1.5 font-title">
              <User className="w-4.5 h-4.5 text-indigo-400" />
              Editar Dados do Liderado
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Nome Completo</label>
                <input
                  type="text"
                  value={editColabName}
                  onChange={(e) => setEditColabName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Cargo / Função</label>
                <input
                  type="text"
                  value={editColabRole}
                  onChange={(e) => setEditColabRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Nível</label>
                  <select
                    value={editColabLevel}
                    onChange={(e) => setEditColabLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="L1">L1 (Júnior)</option>
                    <option value="L2">L2 (Pleno)</option>
                    <option value="L3">L3 (Sênior)</option>
                    <option value="L4">L4 (Principal)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Gestor / Líder</label>
                  <select
                    value={editColabLeaderId}
                    onChange={(e) => setEditColabLeaderId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="">Nenhum (Sem Líder)</option>
                    {activeLeaders.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-900">
              <button
                type="button"
                onClick={() => setEditingColab(null)}
                className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-semibold py-2 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditCollaborator}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-slate-100 text-xs font-semibold py-2 rounded-lg transition-all shadow-md shadow-indigo-950/20"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
