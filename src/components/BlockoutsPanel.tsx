import { useState, type FormEvent } from 'react';
import { samePerson, type Blockout } from '../lib/blocks';
import { fmtRange, todayISO } from '../lib/dates';
import { useConfirm } from './Confirm';
import { Icon, initial } from './Icon';

interface Props {
  people: string[];
  blockouts: Blockout[];
  minDate: string;
  onAdd: (b: Omit<Blockout, 'id' | 'createdAt'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const OTHER = '__other__';

export function BlockoutsPanel({ people, blockouts, minDate, onAdd, onDelete }: Props) {
  const [person, setPerson] = useState(people[0] ?? '');
  const [otherName, setOtherName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const ask = useConfirm();

  const who = person === OTHER ? otherName.trim() : person;
  const today = todayISO();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!who) return setError('Choose who is unavailable.');
    if (!start) return setError('Choose the first day they are unavailable.');
    const last = end || start;
    if (last < start) return setError('The last day can’t be before the first day.');
    setSaving(true);
    try {
      const known = people.find((p) => samePerson(p, who));
      await onAdd({ person: known ?? who, start, end: last, note: note.trim() || undefined });
      setStart('');
      setEnd('');
      setNote('');
    } catch (err) {
      setError(`Couldn’t save: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  // Group by person, people list order first, then any extra names.
  const names = [...people];
  blockouts.forEach((b) => {
    if (!names.some((n) => samePerson(n, b.person))) names.push(b.person);
  });
  const groups = names
    .map((name) => ({
      name,
      items: blockouts
        .filter((b) => samePerson(b.person, name))
        .sort((a, b) => a.start.localeCompare(b.start)),
    }))
    .filter((g) => g.items.length);

  return (
    <section className="section" aria-labelledby="blockouts-h">
      <h2 id="blockouts-h">Unavailable dates</h2>
      <p className="section-intro">
        Add days when someone can’t help at all. Anyone can add these for anyone. They show up on each block so it’s
        easy to see who’s free.
      </p>

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="bo-person">Who</label>
          <select id="bo-person" className="select" value={person} onChange={(e) => setPerson(e.target.value)}>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value={OTHER}>Other…</option>
          </select>
        </div>
        {person === OTHER && (
          <div className="field">
            <label htmlFor="bo-other">Their name</label>
            <input
              id="bo-other"
              className="input"
              value={otherName}
              maxLength={40}
              onChange={(e) => setOtherName(e.target.value)}
            />
          </div>
        )}
        <div className="row">
          <div className="field">
            <label htmlFor="bo-start">First day</label>
            <input
              id="bo-start"
              type="date"
              className="input"
              value={start}
              min={minDate}
              onChange={(e) => {
                setStart(e.target.value);
                if (end && end < e.target.value) setEnd(e.target.value);
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="bo-end">Last day</label>
            <input
              id="bo-end"
              type="date"
              className="input"
              value={end}
              min={start || minDate}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="bo-note">
            Note <span className="hint">(optional)</span>
          </label>
          <input
            id="bo-note"
            className="input"
            value={note}
            maxLength={120}
            placeholder="e.g. Work trip"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={saving}>
          <Icon name="plus" /> {saving ? 'Saving…' : 'Add unavailable dates'}
        </button>
      </form>

      {groups.length > 0 && (
        <div className="card">
          {groups.map((g) => (
            <div key={g.name} className="person-group">
              <h3>
                <span className="avatar" aria-hidden>
                  {initial(g.name)}
                </span>
                {g.name}
              </h3>
              <ul className="bo-list">
                {g.items.map((b) => (
                  <li key={b.id} className={`bo-item ${b.end < today ? 'past' : ''}`}>
                    <div className="bo-main">
                      <div className="bo-dates">{fmtRange(b.start, b.end)}</div>
                      {b.note && <div className="bo-note">{b.note}</div>}
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Delete ${g.name} unavailable ${fmtRange(b.start, b.end)}`}
                      onClick={async () => {
                        if (
                          await ask(`Remove ${g.name}’s unavailable dates ${fmtRange(b.start, b.end)}?`, {
                            confirmLabel: 'Remove dates',
                          })
                        )
                          onDelete(b.id);
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
