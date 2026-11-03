import type { Settings } from '../data/types';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  guide: Settings['careGuide'];
}

export function CareGuideModal({ open, onClose, guide }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Care Guide"
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Got it
        </button>
      }
    >
      {guide.intro && <p className="guide-intro">{guide.intro}</p>}
      {guide.sections.map((s, i) => (
        <section key={i} className="guide-section">
          <h3>{s.title}</h3>
          <ul>
            {s.items.filter(Boolean).map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="guide-note">
        This guide is a family summary. The transplant team’s instructions always come first. Ask them if anything here
        is unclear or different.
      </p>
    </Modal>
  );
}
