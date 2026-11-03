import { forwardRef } from 'react';
import { overlapRange, type Block, type Blockout } from '../lib/blocks';
import { fmtRange } from '../lib/dates';
import type { Assignment } from '../data/types';
import { Icon, initial } from './Icon';

export interface BlockView {
  block: Block;
  assignment?: Assignment;
  /** every blockout that overlaps this block, any person */
  away: Blockout[];
  /** blockouts belonging to the assigned person */
  conflicts: Blockout[];
  isToday: boolean;
  isPast: boolean;
}

interface Props {
  view: BlockView;
  onSignUp: () => void;
  onRemove: () => void;
}

export const BlockCard = forwardRef<HTMLElement, Props>(function BlockCard({ view, onSignUp, onRemove }, ref) {
  const { block, assignment, away, conflicts, isToday, isPast } = view;
  const assigned = Boolean(assignment);
  const cls = ['block', assigned ? 'assigned' : 'open', isToday && 'is-today', isPast && 'is-past']
    .filter(Boolean)
    .join(' ');
  const clip = (b: Blockout) => {
    const o = overlapRange(block.start, block.end, b.start, b.end)!;
    return fmtRange(o.start, o.end);
  };

  return (
    <article ref={ref} className={cls} data-index={block.index} aria-label={`Block ${block.index + 1}, ${fmtRange(block.start, block.end)}`}>
      <div className="block-head">
        <span>Block {block.index + 1}</span>
        <span className="pills">
          {isToday && <span className="pill blue">Now</span>}
          {isPast && <span className="pill gray">Past</span>}
          {conflicts.length > 0 && (
            <span className="pill amber">
              <Icon name="alert" /> Conflict
            </span>
          )}
          {assigned ? (
            <span className="pill green">
              <Icon name="check" /> Covered
            </span>
          ) : (
            <span className="pill gray">Open</span>
          )}
        </span>
      </div>

      <p className="block-dates">{fmtRange(block.start, block.end)}</p>
      <p className="block-sub">
        {block.days} days{block.isPartial ? ' (short final block)' : ''}
      </p>

      <div className="assignee">
        {assignment ? (
          <>
            <span className="avatar" aria-hidden>
              {initial(assignment.person)}
            </span>
            <div>
              <div className="assignee-label">Caregiver</div>
              <div className="assignee-name">{assignment.person}</div>
            </div>
          </>
        ) : (
          <>
            <span className="avatar empty-avatar" aria-hidden>
              ?
            </span>
            <div>
              <div className="assignee-label">Caregiver</div>
              <div className="assignee-name" style={{ color: 'var(--text-muted)' }}>
                Nobody yet
              </div>
            </div>
          </>
        )}
      </div>

      {assignment && conflicts.length > 0 && (
        <div className="warn-box" role="note">
          <Icon name="alert" />
          <span>
            {assignment.person} marked themselves unavailable {conflicts.map(clip).join(', ')} during this block.
          </span>
        </div>
      )}

      {away.length > 0 && (
        <ul className="away-list" aria-label="Unavailable during this block">
          {away
            .filter((b) => !conflicts.includes(b))
            .map((b) => (
              <li key={b.id} className="away-chip">
                <b>{b.person}</b> away {clip(b)}
              </li>
            ))}
        </ul>
      )}

      <div className="block-actions">
        {assigned ? (
          <>
            <button type="button" className="btn btn-outline" onClick={onSignUp}>
              Change
            </button>
            <button type="button" className="btn btn-danger" onClick={onRemove}>
              Remove
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={onSignUp}>
            <Icon name="plus" /> Sign up
          </button>
        )}
      </div>
    </article>
  );
});
