import { fmtRange } from '../lib/dates';
import { Icon } from './Icon';

interface Props {
  patientName: string;
  startDate: string;
  endDate: string;
  covered: number;
  total: number;
  onGuide: () => void;
  onSettings: () => void;
}

export function Header({ patientName, startDate, endDate, covered, total, onGuide, onSettings }: Props) {
  const open = total - covered;
  const pct = total ? Math.round((covered / total) * 100) : 0;
  return (
    <header className="header">
      <div className="header-top">
        <div>
          <h1>Care for {patientName}</h1>
          {total > 0 && <p className="window">{fmtRange(startDate, endDate)}</p>}
        </div>
      </div>
      <div className="header-actions">
        <button type="button" className="btn btn-outline" onClick={onGuide}>
          <Icon name="book" /> Care Guide
        </button>
        <button type="button" className="btn btn-outline" onClick={onSettings}>
          <Icon name="gear" /> Settings
        </button>
      </div>
      {total > 0 && (
        <div className="coverage" aria-live="polite">
          <div className="coverage-line">
            <strong>
              {covered} of {total} blocks covered
            </strong>
            <span className="open-count">{open === 0 ? 'All covered 🎉' : `${open} still open`}</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={covered}
            aria-label="Blocks covered"
          >
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </header>
  );
}
