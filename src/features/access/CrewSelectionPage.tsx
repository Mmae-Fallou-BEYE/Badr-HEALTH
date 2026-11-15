import React from 'react';
import { Activity, ChevronRight } from 'lucide-react';
import { CrewMemberProfile } from '../../data/crew';

interface CrewSelectionPageProps {
  crew: CrewMemberProfile[];
  onSelect: (astronautId: string) => void;
}

export const CrewSelectionPage: React.FC<CrewSelectionPageProps> = ({ crew, onSelect }) => (
  <main className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6">
    <section className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-soft">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-panel text-primary">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">Badr Health</h1>
          <p className="text-xs text-muted">Select your astronaut profile</p>
        </div>
      </div>

      <h2 className="mb-4 text-sm font-bold text-ink">Choose an astronaut to continue</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {crew.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary hover:bg-canvas"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-white">
                {member.avatar_initials}
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{member.display_name}</span>
                <span className="mt-0.5 block text-xs text-muted">{member.role}</span>
                <span className="mt-1 block font-mono text-[10px] font-bold text-primary">{member.callsign}</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
        ))}
      </div>
    </section>
  </main>
);
