import { useEffect, useState, type FormEvent } from 'react';
import { computeBlocks, orphanedAssignmentKeys, samePerson } from '../lib/blocks';
import { fmtRange, fmtShort, isValidISO } from '../lib/dates';
import { defaultSettings } from '../data/defaults';
import { hashPasscode } from '../data/store';
import type { Assignment, Settings } from '../data/types';
import { useConfirm } from './Confirm';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  assignments: Record<string, Assignment>;
  onSave: (patch: Partial<Settings>) => Promise<void>;
  onClearAssignments: (keys: string[]) => Promise<void>;
}

const UNLOCK_KEY = 'care-blocks-unlocked';
const readUnlock = () => {
  try {
    return sessionStorage.getItem(UNLOCK_KEY);
  } catch {
    return null;
  }
};
const writeUnlock = (v: string) => {
  try {
    sessionStorage.setItem(UNLOCK_KEY, v);
  } catch {
    /* ignore */
  }
};

export function SettingsModal(props: Props) {
  const { open, onClose, settings } = props;
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (open) setUnlocked(Boolean(settings.passcodeHash) && readUnlock() === settings.passcodeHash);
  }, [open, settings.passcodeHash]);

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      {unlocked ? (
        <SettingsForm {...props} />
      ) : (
        <PasscodeGate
          passcodeHash={settings.passcodeHash}
          onUnlock={async (hash, isNew) => {
            writeUnlock(hash);
            if (isNew) await props.onSave({ passcodeHash: hash });
            setUnlocked(true);
          }}
        />
      )}
    </Modal>
  );
}

function PasscodeGate({
  passcodeHash,
  onUnlock,
}: {
  passcodeHash: string | null;
  onUnlock: (hash: string, isNew: boolean) => Promise<void>;
}) {
  const creating = !passcodeHash;
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.trim().length < 4) return setError('Use at least 4 characters.');
    if (creating && code !== confirmCode) return setError('The two passcodes don’t match.');
    const hash = await hashPasscode(code);
    if (!creating && hash !== passcodeHash) return setError('That passcode isn’t right.');
    try {
      await onUnlock(hash, creating);
    } catch (err) {
      setError(`Couldn’t save: ${(err as Error).message}`);
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="hint" style={{ marginBottom: 16 }}>
        {creating
          ? 'Create a family passcode. It’s needed to change the care dates, the banner message, and the Care Guide. Share it with the family members who should be able to make those changes.'
          : 'Enter the family passcode to change the care dates, banner, and Care Guide.'}
      </p>
      <div className="field">
        <label htmlFor="pc">{creating ? 'New passcode' : 'Passcode'}</label>
        <input
          id="pc"
          className="input"
          type="password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          value={code}
          autoFocus
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      {creating && (
        <div className="field">
          <label htmlFor="pc2">Type it again</label>
          <input
            id="pc2"
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
          />
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
        {creating ? 'Create passcode' : 'Unlock settings'}
      </button>
    </form>
  );
}

function SettingsForm({ settings, assignments, onSave, onClearAssignments, onClose }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [newPerson, setNewPerson] = useState('');
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const ask = useConfirm();

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const datesOk = isValidISO(draft.startDate) && isValidISO(draft.endDate) && draft.startDate <= draft.endDate;
  const blocks = datesOk ? computeBlocks(draft.startDate, draft.endDate, draft.blockLengthDays) : [];
  const orphans = datesOk ? orphanedAssignmentKeys(blocks, Object.keys(assignments)) : [];

  const sections = draft.careGuide.sections;
  const setSections = (s: Settings['careGuide']['sections']) => set('careGuide', { ...draft.careGuide, sections: s });

  const save = async () => {
    setError('');
    if (!datesOk) return setError('Check the care dates — the end must be on or after the start.');
    if (!draft.patientName.trim()) return setError('Enter a name for the person receiving care.');
    setSaving(true);
    try {
      const patch: Partial<Settings> = {
        patientName: draft.patientName.trim(),
        startDate: draft.startDate,
        endDate: draft.endDate,
        blockLengthDays: draft.blockLengthDays,
        banner: { message: draft.banner.message.trim(), active: draft.banner.active },
        people: draft.people,
        careGuide: {
          intro: draft.careGuide.intro,
          sections: sections
            .map((s) => ({ title: s.title.trim(), items: s.items.map((i) => i.trim()).filter(Boolean) }))
            .filter((s) => s.title || s.items.length),
        },
      };
      if (newCode.trim()) {
        if (newCode.trim().length < 4) {
          setSaving(false);
          return setError('New passcode must be at least 4 characters.');
        }
        patch.passcodeHash = await hashPasscode(newCode);
        writeUnlock(patch.passcodeHash);
      }
      await onSave(patch);
      onClose();
    } catch (err) {
      setError(`Couldn’t save: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* ----- banner ----- */}
      <div className="settings-group">
        <h3>Message banner</h3>
        <p className="hint">Shown in red at the top of the app for everyone. Leave it off when there’s nothing urgent.</p>
        <div className="field">
          <label htmlFor="s-banner">Message</label>
          <textarea
            id="s-banner"
            className="textarea"
            value={draft.banner.message}
            maxLength={240}
            placeholder={`e.g. ${draft.patientName}'s immune system is weak — no visitors please`}
            onChange={(e) => set('banner', { ...draft.banner, message: e.target.value })}
          />
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={draft.banner.active}
            onChange={(e) => set('banner', { ...draft.banner, active: e.target.checked })}
          />
          Show the banner
        </label>
      </div>

      {/* ----- care window ----- */}
      <div className="settings-group">
        <h3>Care window</h3>
        <p className="hint">Set when in-home care starts and roughly when it ends. You can extend it later.</p>
        <div className="field">
          <label htmlFor="s-name">Person receiving care</label>
          <input
            id="s-name"
            className="input"
            value={draft.patientName}
            maxLength={30}
            onChange={(e) => set('patientName', e.target.value)}
          />
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="s-start">Start</label>
            <input
              id="s-start"
              type="date"
              className="input"
              value={draft.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="s-end">End</label>
            <input
              id="s-end"
              type="date"
              className="input"
              value={draft.endDate}
              min={draft.startDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="s-len">Block length</label>
          <select
            id="s-len"
            className="select"
            value={draft.blockLengthDays}
            onChange={(e) => set('blockLengthDays', Number(e.target.value))}
          >
            {[7, 10, 14, 21, 28].map((n) => (
              <option key={n} value={n}>
                {n === 7 ? '1 week' : n % 7 === 0 ? `${n / 7} weeks` : `${n} days`}
              </option>
            ))}
          </select>
        </div>
        {datesOk ? (
          <p className="hint" style={{ marginTop: 10 }}>
            {fmtRange(draft.startDate, draft.endDate)} → <b>{blocks.length} blocks</b>
            {blocks.at(-1)?.isPartial ? ` (last one is ${blocks.at(-1)!.days} days)` : ''}
          </p>
        ) : (
          <p className="form-error">End date must be on or after the start date.</p>
        )}
        {orphans.length > 0 && (
          <div className="warn-box">
            <Icon name="alert" />
            <div>
              <p>
                {orphans.length} existing sign-up{orphans.length > 1 ? 's' : ''} won’t line up with these dates:{' '}
                {orphans.map((k) => `${assignments[k].person} (${fmtShort(k)})`).join(', ')}. They were saved with
                the old start date{settings.blockLengthDays !== draft.blockLengthDays ? ' or block length' : ''}.
              </p>
              {orphans.every((k) => k in assignments) && (
                <button
                  type="button"
                  className="btn btn-small btn-outline"
                  style={{ marginTop: 8 }}
                  onClick={async () => {
                    if (
                      await ask('Remove these old sign-ups? People will need to sign up again for the new blocks.', {
                        confirmLabel: 'Clear sign-ups',
                      })
                    )
                      onClearAssignments(orphans);
                  }}
                >
                  Clear old sign-ups
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ----- people ----- */}
      <div className="settings-group">
        <h3>Caregivers</h3>
        <p className="hint">Quick choices when signing up. Names entered with “Other” are added here automatically.</p>
        <ul className="people-list">
          {draft.people.map((p) => (
            <li key={p}>
              {p}
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${p}`}
                onClick={() => set('people', draft.people.filter((x) => x !== p))}
              >
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
        <div className="inline-add">
          <input
            className="input"
            aria-label="New caregiver name"
            placeholder="Add a name"
            value={newPerson}
            maxLength={40}
            onChange={(e) => setNewPerson(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline"
            disabled={!newPerson.trim()}
            onClick={() => {
              const n = newPerson.trim();
              if (n && !draft.people.some((p) => samePerson(p, n))) set('people', [...draft.people, n]);
              setNewPerson('');
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* ----- care guide ----- */}
      <div className="settings-group">
        <h3>Care Guide</h3>
        <p className="hint">Each line in a section becomes one bullet point.</p>
        <div className="field">
          <label htmlFor="g-intro">Introduction</label>
          <textarea
            id="g-intro"
            className="textarea"
            value={draft.careGuide.intro}
            onChange={(e) => set('careGuide', { ...draft.careGuide, intro: e.target.value })}
          />
        </div>
        {sections.map((s, i) => (
          <div key={i} className="guide-edit">
            <div className="field">
              <label htmlFor={`g-t-${i}`}>Section title</label>
              <input
                id={`g-t-${i}`}
                className="input"
                value={s.title}
                onChange={(e) => setSections(sections.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              />
            </div>
            <div className="field">
              <label htmlFor={`g-i-${i}`}>Points (one per line)</label>
              <textarea
                id={`g-i-${i}`}
                className="textarea"
                rows={5}
                value={s.items.join('\n')}
                onChange={(e) =>
                  setSections(sections.map((x, j) => (j === i ? { ...x, items: e.target.value.split('\n') } : x)))
                }
              />
            </div>
            <div className="guide-edit-actions">
              <button
                type="button"
                className="btn btn-small btn-danger"
                onClick={() => setSections(sections.filter((_, j) => j !== i))}
              >
                <Icon name="trash" /> Remove section
              </button>
            </div>
          </div>
        ))}
        <div className="inline-add">
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={() => setSections([...sections, { title: 'New section', items: [] }])}
          >
            <Icon name="plus" /> Add section
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={async () => {
              if (
                await ask('Replace the Care Guide with the original default text? Your edits will be lost when you save.', {
                  confirmLabel: 'Reset guide',
                })
              )
                set('careGuide', defaultSettings().careGuide);
            }}
          >
            Reset to default
          </button>
        </div>
      </div>

      {/* ----- passcode ----- */}
      <div className="settings-group">
        <h3>Change passcode</h3>
        <div className="field">
          <label htmlFor="s-newcode">
            New passcode <span className="hint">(leave blank to keep the current one)</span>
          </label>
          <input
            id="s-newcode"
            className="input"
            type="password"
            autoComplete="new-password"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="inline-add" style={{ marginTop: 24 }}>
        <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
