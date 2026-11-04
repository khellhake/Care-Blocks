import { useEffect, useMemo, useState } from 'react';
import { blockoutsForBlock, overlapRange, samePerson, type Block, type Blockout } from '../lib/blocks';
import { fmtRange } from '../lib/dates';
import { Icon, initial } from './Icon';
import { Modal } from './Modal';

interface Props {
  block: Block | null;
  current?: string;
  people: string[];
  blockouts: Blockout[];
  onClose: () => void;
  onConfirm: (person: string, isOther: boolean) => Promise<void>;
}

const OTHER = '__other__';

export function AssignSheet({ block, current, people, blockouts, onClose, onConfirm }: Props) {
  const [choice, setChoice] = useState<string>('');
  const [otherName, setOtherName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!block) return;
    const match = current ? people.find((p) => samePerson(p, current)) : undefined;
    setChoice(match ?? (current ? OTHER : ''));
    setOtherName(match ? '' : current ?? '');
    setSaving(false);
  }, [block, current, people]);

  const person = choice === OTHER ? otherName.trim() : choice;
  const conflicts = useMemo(
    () => (block && person ? blockoutsForBlock(block, blockouts, person) : []),
    [block, person, blockouts],
  );

  if (!block) return null;

  const awayFor = (name: string) => blockoutsForBlock(block, blockouts, name);
  const clip = (b: Blockout) => {
    const o = overlapRange(block.start, block.end, b.start, b.end)!;
    return fmtRange(o.start, o.end);
  };

  const submit = async () => {
    if (!person) return;
    setSaving(true);
    const known = people.find((p) => samePerson(p, person));
    try {
      await onConfirm(known ?? person, !known);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      variant="sheet"
      onClose={onClose}
      title={`Sign up: ${fmtRange(block.start, block.end)}`}
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${conflicts.length ? 'btn-warn' : 'btn-neutral'}`}
            disabled={!person || saving}
            onClick={submit}
          >
            {saving ? 'Saving…' : conflicts.length ? 'Sign up anyway' : person ? `Sign up ${person}` : 'Choose someone'}
          </button>
        </>
      }
    >
      <p className="hint" style={{ marginBottom: 14 }}>
        Who will be the caregiver for these {block.days} days?
      </p>
      <div className="choices" role="radiogroup" aria-label="Caregiver">
        {people.map((p) => {
          const away = awayFor(p);
          const selected = choice === p;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={selected}
              className="choice"
              onClick={() => setChoice(p)}
            >
              <span className="avatar" aria-hidden>
                {initial(p)}
              </span>
              <span className="choice-main">
                <span className="choice-name">{p}</span>
                <br />
                <span className={`choice-status ${away.length ? 'away' : ''}`}>
                  {away.length ? `Away ${away.map(clip).join(', ')}` : 'Available'}
                </span>
              </span>
              {selected && (
                <span className="check">
                  <Icon name="check" />
                </span>
              )}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={choice === OTHER}
          className="choice"
          onClick={() => setChoice(OTHER)}
        >
          <span className="avatar empty-avatar" aria-hidden>
            +
          </span>
          <span className="choice-main">
            <span className="choice-name">Other</span>
            <br />
            <span className="choice-status" style={{ color: 'var(--text-muted)' }}>
              Another family member or friend
            </span>
          </span>
          {choice === OTHER && (
            <span className="check">
              <Icon name="check" />
            </span>
          )}
        </button>
      </div>

      {choice === OTHER && (
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="other-name">Their name</label>
          <input
            id="other-name"
            className="input"
            value={otherName}
            autoFocus
            autoComplete="name"
            maxLength={40}
            placeholder="e.g. Aunt Carol"
            onChange={(e) => setOtherName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="warn-box" role="alert">
          <Icon name="alert" />
          <span>
            <b>{person}</b> is marked unavailable {conflicts.map(clip).join(', ')}
            {conflicts.some((c) => c.note) && ` (${conflicts.map((c) => c.note).filter(Boolean).join('; ')})`}. You can
            still sign up — just make sure those days are covered.
          </span>
        </div>
      )}
    </Modal>
  );
}
