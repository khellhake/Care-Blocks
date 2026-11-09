import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssignSheet } from './components/AssignSheet';
import { Banner } from './components/Banner';
import { BlockCard, type BlockView } from './components/BlockCard';
import { BlockoutsPanel } from './components/BlockoutsPanel';
import { CareGuideModal } from './components/CareGuideModal';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { TimelineRail } from './components/TimelineRail';
import { useCareData } from './data/store';
import { blockIndexForDate, blockoutsForBlock, computeBlocks, samePerson } from './lib/blocks';
import { fmtRange, todayISO } from './lib/dates';
import { Icon } from './components/Icon';
import { useConfirm } from './components/Confirm';
import { lockThisDevice } from './components/SiteGate';

export default function App() {
  const { store, state, error } = useCareData();
  const ask = useConfirm();
  const [guideOpen, setGuideOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assignStart, setAssignStart] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const today = todayISO();
  const settings = state?.settings;

  const views: BlockView[] = useMemo(() => {
    if (!state) return [];
    const { settings: s, assignments, blockouts } = state;
    return computeBlocks(s.startDate, s.endDate, s.blockLengthDays).map((block) => {
      const assignment = assignments[block.start];
      const away = blockoutsForBlock(block, blockouts).sort((a, b) => a.start.localeCompare(b.start));
      return {
        block,
        assignment,
        away,
        conflicts: assignment ? away.filter((b) => samePerson(b.person, assignment.person)) : [],
        isToday: block.start <= today && today <= block.end,
        isPast: block.end < today,
      };
    });
  }, [state, today]);

  const todayIndex = blockIndexForDate(
    views.map((v) => v.block),
    today,
  );

  // Keep the rail thumb in sync with whatever block is near the top of the screen.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.3;
        let idx = 0;
        cardRefs.current.forEach((el, i) => {
          if (el && el.getBoundingClientRect().top <= line) idx = i;
        });
        setActiveIndex(idx);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [views.length]);

  const scrollToBlock = useCallback((i: number, smooth: boolean) => {
    setActiveIndex(i);
    cardRefs.current[i]?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }, []);

  if (!state || !settings) {
    return (
      <main className="app">
        {error ? (
          <div className="warn-box" role="alert" style={{ marginTop: 24 }}>
            <Icon name="alert" />
            <span>Couldn’t load the schedule: {error.message}</span>
          </div>
        ) : (
          <p className="loading">Loading schedule…</p>
        )}
      </main>
    );
  }

  const covered = views.filter((v) => v.assignment).length;
  const assignView = views.find((v) => v.block.start === assignStart) ?? null;

  return (
    <main className="app">
      <Banner message={settings.banner.message} active={settings.banner.active} />
      {error && (
        <div className="warn-box" role="alert">
          <Icon name="alert" />
          <span>Connection problem — changes may not be saving. ({error.message})</span>
        </div>
      )}

      <Header
        patientName={settings.patientName}
        startDate={settings.startDate}
        endDate={settings.endDate}
        covered={covered}
        total={views.length}
        onGuide={() => setGuideOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      <div className="legend" aria-label="Color key">
        <span className="legend-item">
          <span className="swatch green" /> Covered
        </span>
        <span className="legend-item">
          <span className="swatch gray" /> Open
        </span>
        <span className="legend-item">
          <span className="swatch amber" /> Conflict
        </span>
        {todayIndex >= 0 && (
          <button
            type="button"
            className="btn btn-small btn-outline"
            style={{ marginLeft: 'auto' }}
            onClick={() => scrollToBlock(todayIndex, true)}
          >
            <Icon name="calendar" /> Today
          </button>
        )}
      </div>

      <div className="timeline-wrap">
        <div className="timeline">
          {views.length === 0 ? (
            <p className="empty">No care dates set yet. Open Settings to choose a start and end date.</p>
          ) : (
            views.map((v, i) => (
              <BlockCard
                key={v.block.start}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                view={v}
                onSignUp={() => setAssignStart(v.block.start)}
                onRemove={async () => {
                  if (
                    v.assignment &&
                    (await ask(`Remove ${v.assignment.person} from ${fmtRange(v.block.start, v.block.end)}? The block will show as open again.`, {
                      confirmLabel: 'Remove',
                    }))
                  ) {
                    store.clearAssignment(v.block.start);
                  }
                }}
              />
            ))
          )}
        </div>
        <TimelineRail views={views} activeIndex={activeIndex} onSelect={scrollToBlock} />
      </div>

      <BlockoutsPanel
        people={settings.people}
        blockouts={state.blockouts}
        minDate={settings.startDate < today ? settings.startDate : today}
        onAdd={(b) => store.addBlockout(b)}
        onDelete={(id) => store.deleteBlockout(id)}
      />

      <footer className={`footer ${store.mode === 'local' ? 'local-mode' : ''}`}>
        {store.mode === 'local'
          ? 'Local mode: changes are saved only in this browser. Connect Firebase to share with family.'
          : 'Changes are shared with everyone instantly.'}
        <br />
        <button type="button" className="link-btn" onClick={lockThisDevice}>
          Lock this device
        </button>
      </footer>

      <AssignSheet
        block={assignView?.block ?? null}
        current={assignView?.assignment?.person}
        people={settings.people}
        blockouts={state.blockouts}
        onClose={() => setAssignStart(null)}
        onConfirm={async (person, isOther) => {
          if (!assignView) return;
          await store.setAssignment(assignView.block.start, person, isOther);
          if (!settings.people.some((p) => samePerson(p, person))) {
            await store.updateSettings({ people: [...settings.people, person] });
          }
          setAssignStart(null);
        }}
      />
      <CareGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} guide={settings.careGuide} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        assignments={state.assignments}
        onSave={(patch) => store.updateSettings(patch)}
        onClearAssignments={async (keys) => {
          await Promise.all(keys.map((k) => store.clearAssignment(k)));
        }}
      />
    </main>
  );
}
