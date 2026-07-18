'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { storage, MOCK_USERS } from '@/lib/storage';
import {
  Collaborator,
  OneOnOne,
  ConflictEscalation as Conflict,
  UserSession,
  LeaderProfile,
  LeaderProfileType
} from '@/types';
import Swal from 'sweetalert2';

// Subcomponents
import Sidebar from '@/components/Sidebar';
import AboutSection from '@/components/AboutSection';
import LeaderOnboarding from '@/components/LeaderOnboarding';
import InteractiveSimulator from '@/components/InteractiveSimulator';
import CopilotoSection from '@/components/CopilotoSection';
import HistorySection from '@/components/HistorySection';
import ConflictSection from '@/components/ConflictSection';
import RHPanel from '@/components/RHPanel';

type SectionId = 'onboarding' | 'copiloto' | 'escalation' | 'rh' | 'historico' | 'simulador' | 'about';

export default function Home() {
  const router = useRouter();

  // Navigation states
  const [activeSection, setActiveSection] = useState<SectionId>('about');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication & Session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [leaderProfile, setLeaderProfile] = useState<LeaderProfile | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Shared Database states
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [profiles, setProfiles] = useState<LeaderProfile[]>([]);
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOne[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // General App & Database Initialization
  useEffect(() => {
    storage.initialize();

    // Listen to Supabase auth state changes (crucial for Google OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth State Change]:', event);
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase().trim();
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single();

        // Auto provision leader profile if not exists in database
        if (!profile && userEmail) {
          const { data: insertedProfile } = await supabase
            .from('profiles')
            .insert({
              email: userEmail,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Gestor Google',
              role: 'LEADER',
              profile_type: 'PENDENTE',
              level_from: 'Coordenador',
              level_to: 'Gerente'
            })
            .select()
            .single();
          profile = insertedProfile;
        }

        if (profile) {
          const userSession = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as any,
            profile: profile.profile_type as any
          };
          storage.setCurrentUser(userSession);
          setCurrentUser(userSession);
          fetchDatabaseData(userSession);
        }
      } else {
        // No active Supabase session
        storage.setCurrentUser(null);
        setCurrentUser(null);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const fetchDatabaseData = async (user: UserSession) => {
    setLoadingDb(true);
    try {
      // 1. Seed base data if profiles are empty (Auto-seeding)
      const { data: dbProfiles } = await supabase.from('profiles').select('*');

      if (!dbProfiles || dbProfiles.length === 0) {
        console.log('Seeding profiles table...');
        await supabase.from('profiles').insert(
          MOCK_USERS.map(u => ({
            email: u.email,
            name: u.name,
            role: u.role,
            profile_type: u.profile,
            level_from: 'Coordenador',
            level_to: 'Gerente'
          }))
        );
      }

      // Check collaborators
      const { data: dbColabs } = await supabase.from('collaborators').select('*');
      const seededColabs = (dbColabs || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email || '',
        disc: c.disc,
        level: c.level,
        role: c.role,
        leaderId: c.leader_id || undefined
      })) as Collaborator[];
      setCollaborators(seededColabs);

      // Fetch Profiles list
      const { data: refreshedProfiles } = await supabase.from('profiles').select('*');
      if (refreshedProfiles) {
        const mappedProfiles = refreshedProfiles.map(p => ({
          id: p.id,
          email: p.email,
          name: p.name,
          profile: p.profile_type as LeaderProfileType,
          levelFrom: p.level_from || 'Coordenador',
          levelTo: p.level_to || 'Gerente'
        }));
        setProfiles(mappedProfiles);

        // Set leader profile for current user
        const matchedProfile = refreshedProfiles.find(p => p.email.toLowerCase() === user.email.toLowerCase());
        if (matchedProfile) {
          const lProfile: LeaderProfile = {
            id: matchedProfile.id,
            email: matchedProfile.email,
            name: matchedProfile.name,
            profile: matchedProfile.profile_type as LeaderProfileType,
            levelFrom: matchedProfile.level_from || 'Coordenador',
            levelTo: matchedProfile.level_to || 'Gerente'
          };
          setLeaderProfile(lProfile);
          storage.setLeaderProfile(lProfile);

          if (user.role === 'LEADER' && matchedProfile.profile_type === 'PENDENTE') {
            setActiveSection('onboarding');
          } else if (user.role === 'RH') {
            setActiveSection('rh');
          } else if (user.role === 'COLLABORATOR') {
            const matchedColab = seededColabs.find(c => c.email?.toLowerCase().trim() === user.email?.toLowerCase().trim());
            if (matchedColab && (matchedColab.disc === 'PENDENTE' || !matchedColab.disc)) {
              router.push(`/onboarding-liderado?email=${user.email}`);
            } else {
              setActiveSection('historico');
            }
          } else {
            setActiveSection('copiloto');
          }
        } else {
          if (user.role === 'COLLABORATOR') {
            const matchedColab = seededColabs.find(c => c.email?.toLowerCase().trim() === user.email?.toLowerCase().trim());
            if (matchedColab && (matchedColab.disc === 'PENDENTE' || !matchedColab.disc)) {
              router.push(`/onboarding-liderado?email=${user.email}`);
            } else {
              setActiveSection('historico');
            }
          }
        }
      }

      // Fetch One-on-Ones
      const { data: dbOneOnOnes } = await supabase
        .from('one_on_ones')
        .select('*')
        .order('date', { ascending: false });

      if (dbOneOnOnes) {
        setOneOnOnes(dbOneOnOnes.map(o => ({
          id: o.id,
          collaboratorId: o.collaborator_id,
          collaboratorName: seededColabs.find(c => c.id === o.collaborator_id)?.name || 'Colaborador',
          date: o.date,
          type: o.type,
          context: o.context || '',
          scriptText: o.script_text || '',
          rawLeaderNotes: o.raw_leader_notes || '',
          rawCollaboratorNotes: o.raw_collaborator_notes || '',
          transcription: o.transcription || '',
          finalSummary: o.final_summary || '',
          leaderApproved: o.leader_approved,
          collaboratorApproved: o.collaborator_approved,
          consistencyResult: o.consistency_result,
          ataTemplateId: o.ata_template_id
        })));
      }

      // Fetch Conflicts
      const { data: dbConflicts } = await supabase
        .from('conflicts')
        .select('*')
        .order('date', { ascending: false });

      if (dbConflicts) {
        setConflicts(dbConflicts.map(c => ({
          id: c.id,
          protocol: c.protocol,
          collaboratorId: c.collaborator_id,
          collaboratorName: seededColabs.find(col => col.id === c.collaborator_id)?.name || 'Colaborador',
          description: c.description,
          date: c.date,
          status: c.status as any,
          notes: c.notes || '',
          hasHistory: c.has_history,
          isBypass: c.is_bypass
        })));
      }

    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    storage.setCurrentUser(null);
    storage.setLeaderProfile(null);
    router.push('/login');
  };

  const handleSwitchSection = (sectionId: SectionId) => {
    if (sectionId !== 'onboarding' && sectionId !== 'about' && (!leaderProfile || leaderProfile.profile === 'PENDENTE') && currentUser?.role === 'LEADER') {
      Swal.fire({
        title: 'Complete o Onboarding',
        text: 'Você precisa concluir a autoavaliação de liderança antes de acessar as outras telas.',
        icon: 'warning',
        background: '#0f172a',
        color: '#cbd5e1',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  const handleOnboardingFinished = (profile: LeaderProfile | null) => {
    setLeaderProfile(profile);
  };

  return (
    <div className="min-h-screen text-slate-100 flex relative overflow-hidden bg-[#0b0f19] font-sans">
      {/* Background Orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/5 -top-40 -left-40 orb pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/3 -bottom-60 -right-20 orb pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        activeSection={activeSection}
        handleSwitchSection={handleSwitchSection}
        currentUser={currentUser}
        leaderProfile={leaderProfile}
        handleLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Navbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md px-6 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-slate-200 md:hidden focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-bold text-sm tracking-tight text-slate-200 capitalize font-mono">
              {activeSection === 'about' && 'Sobre'}
              {activeSection === 'onboarding' && 'Onboarding'}
              {activeSection === 'copiloto' && 'Copiloto 1:1'}
              {activeSection === 'simulador' && 'Simulador DISC'}
              {activeSection === 'escalation' && 'Escalação'}
              {activeSection === 'historico' && 'Atas & Histórico'}
              {activeSection === 'rh' && 'Governança RH'}
            </h1>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full relative z-10">
          {loadingDb ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-mono">Consultando banco de dados...</p>
            </div>
          ) : (
            <>
              {activeSection === 'about' && (
                <AboutSection
                  currentUser={currentUser}
                  handleSwitchSection={handleSwitchSection}
                />
              )}

              {activeSection === 'onboarding' && currentUser && (
                <LeaderOnboarding
                  currentUser={currentUser}
                  setLeaderProfile={handleOnboardingFinished}
                  setCurrentUser={setCurrentUser}
                  setActiveSection={setActiveSection}
                  setMeetingStep={() => {}}
                />
              )}

              {activeSection === 'copiloto' && currentUser && (
                <CopilotoSection
                  currentUser={currentUser}
                  leaderProfile={leaderProfile}
                  collaborators={collaborators}
                  profiles={profiles}
                  fetchDatabaseData={fetchDatabaseData}
                />
              )}

              {activeSection === 'simulador' && currentUser && (
                <InteractiveSimulator
                  currentUser={currentUser}
                  collaborators={collaborators}
                  fetchDatabaseData={fetchDatabaseData}
                />
              )}

              {activeSection === 'escalation' && currentUser && (
                <ConflictSection
                  currentUser={currentUser}
                  collaborators={collaborators}
                  oneOnOnes={oneOnOnes}
                  fetchDatabaseData={fetchDatabaseData}
                />
              )}

              {activeSection === 'historico' && currentUser && (
                <HistorySection
                  currentUser={currentUser}
                  oneOnOnes={oneOnOnes}
                  collaborators={collaborators}
                  profiles={profiles}
                  fetchDatabaseData={fetchDatabaseData}
                />
              )}

              {activeSection === 'rh' && currentUser?.role === 'RH' && (
                <RHPanel
                  currentUser={currentUser}
                  collaborators={collaborators}
                  oneOnOnes={oneOnOnes}
                  conflicts={conflicts}
                  profiles={profiles}
                  fetchDatabaseData={fetchDatabaseData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
