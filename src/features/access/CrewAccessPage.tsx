import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  WifiOff,
} from 'lucide-react';
import { CREW_MEMBERS, CrewMemberProfile } from '../../data/crew';
import { Environment } from '../../data/types';
import { ENVIRONMENTS } from '../../config/environments';
import { useAppStore } from '../../data/store';

const SESSION_KEY = 'badr-health-session';
const DEMO_PIN = '2026';
const ENVIRONMENT_OPTIONS: Array<{
  id: Environment;
  shortLabel: string;
  leadHazard: string;
}> = [
  { id: 'station', shortLabel: 'Space', leadHazard: 'Bone loss' },
  { id: 'spacecraft', shortLabel: 'Deep', leadHazard: 'Radiation' },
  { id: 'moon', shortLabel: 'Lunar', leadHazard: 'Regolith dust' },
];

export interface CrewAccessSession {
  crewId: string;
  environment: Environment;
}

export function readCrewAccessSession(): CrewAccessSession | null {
  try {
    const rawSession = sessionStorage.getItem(SESSION_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession) as CrewAccessSession;
    const validCrew = CREW_MEMBERS.some((member) => member.id === session.crewId);
    const validEnvironment = ENVIRONMENT_OPTIONS.some((env) => env.id === session.environment);
    return validCrew && validEnvironment ? session : null;
  } catch {
    return null;
  }
}

export const CrewAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const astronaut = useAppStore((state) => state.astronaut);
  const switchAstronaut = useAppStore((state) => state.switchAstronaut);
  const setEnvironment = useAppStore((state) => state.setEnvironment);
  const [selectedCrewId, setSelectedCrewId] = useState(astronaut.id);
  const [callsign, setCallsign] = useState(astronaut.callsign);
  const [environment, setEnvironmentChoice] = useState<Environment>('moon');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [sessionState, setSessionState] = useState<'login' | 'syncing' | 'ready'>('login');
  const [syncStep, setSyncStep] = useState(0);

  const selectedCrew = CREW_MEMBERS.find((member) => member.id === selectedCrewId) ?? CREW_MEMBERS[0];
  const activeEnvironment = ENVIRONMENTS[environment];

  const startSession = useCallback((member: CrewMemberProfile) => {
    switchAstronaut(member.id);
    setEnvironment(environment);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ crewId: member.id, environment }));
    setSelectedCrewId(member.id);
    setCallsign(member.callsign);
    setError('');
    setSyncStep(0);
    setSessionState('syncing');
  }, [environment, setEnvironment, switchAstronaut]);

  useEffect(() => {
    if (sessionState !== 'syncing') return;
    const stepOne = window.setTimeout(() => setSyncStep(1), 420);
    const stepTwo = window.setTimeout(() => setSyncStep(2), 840);
    const complete = window.setTimeout(() => setSessionState('ready'), 1350);
    return () => {
      window.clearTimeout(stepOne);
      window.clearTimeout(stepTwo);
      window.clearTimeout(complete);
    };
  }, [sessionState]);

  useEffect(() => {
    if (sessionState !== 'ready') return;
    const redirect = window.setTimeout(() => navigate('/', { replace: true }), 650);
    return () => window.clearTimeout(redirect);
  }, [navigate, sessionState]);

  const submitLogin = useCallback((event?: React.FormEvent) => {
    event?.preventDefault();
    const matchedCrew = CREW_MEMBERS.find(
      (member) => member.callsign === callsign.trim().toUpperCase()
    );
    if (!matchedCrew) {
      setError('Unknown callsign. Select a crew profile or enter a valid callsign.');
      return;
    }
    if (pin !== DEMO_PIN) {
      setError('Invalid security PIN. Use the demo PIN 2026 or quick crew access.');
      setPin('');
      return;
    }
    startSession(matchedCrew);
  }, [callsign, pin, startSession]);

  const pressDigit = useCallback((digit: string) => {
    setError('');
    setPin((current) => current.length < 4 ? current + digit : current);
  }, []);

  useEffect(() => {
    if (sessionState !== 'login') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (/^[0-9]$/.test(event.key)) pressDigit(event.key);
      else if (event.key === 'Backspace') setPin((current) => current.slice(0, -1));
      else if (event.key === 'Enter' && pin.length === 4) submitLogin();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, pressDigit, sessionState, submitLogin]);

  return (
    <div className="min-h-screen bg-[#F4F7F2] text-[#13211B] antialiased">
      <header className="sticky top-0 z-20 border-b border-[#E2EAE3] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4EFE3] text-[#1F7A5A]">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold sm:text-xl">Badr Health</h1>
                <span className="hidden rounded-full bg-[#D4EFE3] px-2.5 py-0.5 text-[11px] font-semibold text-[#0F3D2E] sm:inline-flex">CREW TERMINAL</span>
              </div>
              <p className="text-xs font-medium text-[#5E6F66] sm:text-sm">Autonomous Crew Health Monitoring · Artemis IV</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[#E2EAE3] bg-[#E9F1EA] p-1" role="group" aria-label="Flight environment">
              {ENVIRONMENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setEnvironmentChoice(option.id)}
                  aria-pressed={environment === option.id}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${environment === option.id ? 'bg-[#1F7A5A] text-white' : 'text-[#5E6F66] hover:text-[#1F7A5A]'}`}
                  title={ENVIRONMENTS[option.id].name}
                >
                  {option.shortLabel}
                </button>
              ))}
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-[#E2EAE3] bg-white px-3 py-1.5 text-xs text-[#5E6F66] md:inline-flex">
              <WifiOff className="h-3.5 w-3.5 text-[#1F7A5A]" /> Offline ready
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EFE8DA] bg-[#F8F5EE] px-3 py-1.5 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#2FA36B]" /> SIMULATED
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2EAE3] bg-[#E9F1EA] px-5 py-3.5">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <Compass className="h-4 w-4 shrink-0 text-[#1F7A5A]" />
            <span>Active flight profile: <strong className="text-[#1F7A5A]">{activeEnvironment.name}</strong></span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#5E6F66]">
            <span>Gravity: <strong>{activeEnvironment.gravity_g.toFixed(3)} g</strong></span>
            <span>Comms delay: <strong>{activeEnvironment.comms_delay_s}s</strong></span>
            <span>Lead hazard: <strong>{ENVIRONMENT_OPTIONS.find((option) => option.id === environment)?.leadHazard}</strong></span>
          </div>
        </div>

        {sessionState === 'login' && (
          <div className="grid items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
            <section className="flex flex-col justify-between rounded-2xl border border-[#E2EAE3] bg-white p-5 shadow-sm sm:p-7 lg:col-span-7">
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F7A5A]">
                    <UserRoundCheck className="h-4 w-4" /> Quick crew access
                  </div>
                  <span className="rounded-full bg-[#E9F1EA] px-3 py-1 text-xs font-medium">{CREW_MEMBERS.length} profiles</span>
                </div>
                <h2 className="mb-1.5 text-xl font-extrabold sm:text-2xl">Select astronaut biometric profile</h2>
                <p className="mb-5 text-sm text-[#5E6F66]">Choose a crew member to open their personalized health dashboard.</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {CREW_MEMBERS.map((member, index) => {
                    const selected = member.id === selectedCrewId;
                    const accents = ['bg-[#1F7A5A]', 'bg-[#0F3D2E]', 'bg-[#284136]', 'bg-[#19664B]'];
                    return (
                      <article key={member.id} className={`flex min-w-0 flex-col justify-between rounded-xl border p-4 transition-colors ${selected ? 'border-[#1F7A5A] bg-[#E9F1EA]/70 ring-1 ring-[#1F7A5A]/20' : 'border-[#E2EAE3] hover:border-[#1F7A5A]/60'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCrewId(member.id);
                            setCallsign(member.callsign);
                            setError('');
                          }}
                          className="w-full text-left"
                          aria-pressed={selected}
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2FA36B]">
                              <span className="h-2 w-2 rounded-full bg-[#2FA36B]" /> {member.status.toUpperCase()}
                            </span>
                            <span className="rounded-md border border-[#E2EAE3] bg-[#E9F1EA] px-2 py-0.5 font-mono text-xs font-bold">{member.callsign}</span>
                          </div>
                          <div className="mb-3 flex items-center gap-3">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${accents[index % accents.length]}`}>{member.avatar_initials}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold">{member.display_name}</span>
                              <span className="line-clamp-2 block text-xs leading-snug text-[#5E6F66]">{member.role}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#D4EFE3] px-2.5 py-1 text-[11px] font-semibold text-[#0F3D2E]">{member.specialization.split(' & ')[0]}</span>
                            <span className="rounded-full border border-[#E2EAE3] px-2.5 py-1 text-[11px] font-semibold">Health index: <strong className="text-[#1F7A5A]">{member.health_score}/100</strong></span>
                          </div>
                        </button>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E2EAE3] pt-3">
                          <span className="text-xs text-[#5E6F66]">Baseline fit: <strong>14 days</strong></span>
                          <button type="button" onClick={() => startSession(member)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F7A5A] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#19664B]">
                            Enter <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2EAE3] pt-4 text-xs text-[#5E6F66]">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#2FA36B]" /> Local Median &amp; MAD baseline ready</span>
                <span className="font-semibold text-[#1F7A5A]">Autonomous mode ready</span>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E2EAE3] bg-white p-5 shadow-sm sm:p-7 lg:col-span-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F7A5A]"><LockKeyhole className="h-4 w-4" /> Terminal authentication</div>
                <button type="button" onClick={() => { setPin(DEMO_PIN); setError(''); }} className="inline-flex items-center gap-1.5 rounded-full border border-[#EFE8DA] bg-[#F8F5EE] px-3 py-1 text-xs font-semibold">
                  <Sparkles className="h-3 w-3 text-[#1F7A5A]" /> Demo PIN: 2026
                </button>
              </div>
              <h2 className="mb-1.5 text-xl font-extrabold sm:text-2xl">Callsign &amp; security PIN</h2>
              <p className="mb-5 text-sm text-[#5E6F66]">Authenticate with a mission callsign and the four-digit demo PIN.</p>

              <form onSubmit={submitLogin} className="space-y-5">
                <div>
                  <label htmlFor="crew-callsign" className="mb-2 block text-xs font-bold uppercase tracking-wider">Crew callsign</label>
                  <input id="crew-callsign" value={callsign} onChange={(event) => { setCallsign(event.target.value.toUpperCase()); setError(''); }} placeholder="CYGNUS-1" className="w-full rounded-xl border border-[#E2EAE3] bg-[#F4F7F2] px-4 py-3 font-mono text-sm font-bold uppercase outline-none focus:border-[#1F7A5A]" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">4-digit security PIN</span>
                    <button type="button" onClick={() => setShowPin((visible) => !visible)} className="inline-flex items-center gap-1 text-xs font-medium text-[#5E6F66] hover:text-[#1F7A5A]">
                      {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mb-3 grid grid-cols-4 gap-3" aria-label={`${pin.length} of 4 PIN digits entered`}>
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className={`flex h-12 items-center justify-center rounded-xl border font-mono text-xl font-extrabold ${pin[index] ? 'border-[#1F7A5A] bg-[#D4EFE3]/50 text-[#1F7A5A]' : index === pin.length ? 'border-[#1F7A5A]/70 bg-[#E9F1EA]' : 'border-[#E2EAE3] bg-[#E9F1EA]'}`}>
                        {pin[index] ? (showPin ? pin[index] : '•') : ''}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button key={digit} type="button" onClick={() => pressDigit(digit)} className="rounded-xl border border-[#E2EAE3] bg-[#E9F1EA] py-2.5 text-base font-bold transition-colors hover:border-[#1F7A5A]">{digit}</button>
                    ))}
                    <button type="button" onClick={() => { setPin(''); setError(''); }} className="rounded-xl border border-[#E2EAE3] bg-[#E9F1EA] py-2.5 text-xs font-bold uppercase text-[#5E6F66] hover:border-[#E5484D] hover:text-[#E5484D]">Clear</button>
                    <button type="button" onClick={() => pressDigit('0')} className="rounded-xl border border-[#E2EAE3] bg-[#E9F1EA] py-2.5 text-base font-bold hover:border-[#1F7A5A]">0</button>
                    <button type="button" onClick={() => setPin((current) => current.slice(0, -1))} aria-label="Delete last digit" className="rounded-xl border border-[#E2EAE3] bg-[#E9F1EA] py-2.5 text-sm font-bold hover:border-[#1F7A5A]">⌫</button>
                  </div>
                </div>

                {error && <div role="alert" className="rounded-xl border border-[#E5484D]/30 bg-[#E5484D]/10 p-3 text-xs font-medium text-[#B4232D]">{error}</div>}
                <button type="submit" className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#1F7A5A] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#19664B]">
                  <LockKeyhole className="h-4 w-4" /> Initialize medical session <ArrowRight className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-4 text-center text-[11px] text-[#5E6F66]">Demo access only. This simulated PIN is not production authentication.</p>
            </section>
          </div>
        )}

        {sessionState === 'syncing' && (
          <section className="mx-auto w-full max-w-xl rounded-2xl border border-[#E2EAE3] bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4EFE3] text-[#1F7A5A]"><Radio className="h-8 w-8 animate-pulse" /></div>
            <span className="mb-3 inline-flex rounded-full bg-[#D4EFE3] px-3 py-1 text-xs font-bold text-[#0F3D2E]">{selectedCrew.callsign} · {activeEnvironment.name}</span>
            <h2 className="mb-2 text-xl font-extrabold sm:text-2xl">Syncing personal baseline</h2>
            <p className="mb-6 text-sm text-[#5E6F66]">Preparing the offline health dashboard for {selectedCrew.display_name}.</p>
            <div className="mx-auto max-w-md space-y-2 text-left">
              {['Verifying local crew profile', 'Loading 14-day personal baseline', `Applying ${activeEnvironment.name} hazard weights`].map((label, index) => (
                <div key={label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-medium ${syncStep >= index ? 'border-[#2FA36B]/40 bg-[#D4EFE3]/40 text-[#0F3D2E]' : 'border-[#E2EAE3] bg-[#E9F1EA] text-[#5E6F66] opacity-60'}`}>
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${syncStep >= index ? 'text-[#2FA36B]' : 'opacity-40'}`} /> {label}
                </div>
              ))}
            </div>
          </section>
        )}

        {sessionState === 'ready' && (
          <section className="mx-auto max-w-xl rounded-2xl border border-[#E2EAE3] bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#2FA36B]" />
            <h2 className="text-xl font-extrabold">Session ready</h2>
            <p className="mt-2 text-sm text-[#5E6F66]">Opening the {selectedCrew.callsign} dashboard…</p>
          </section>
        )}
      </main>

      <footer className="border-t border-[#E2EAE3] bg-white px-4 py-4 text-center text-xs text-[#5E6F66] sm:px-6">
        <p>Decision-support tool. It does not replace a flight surgeon and does not provide medical diagnoses.</p>
        <p className="mt-1 font-semibold">NASA Space Apps Challenge Dakar 2026 · NASA HRP &amp; CSA Scientific Data</p>
      </footer>
    </div>
  );
};