import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'center' | 'sheet';
}

/** Native <dialog> gives us focus trapping, Esc-to-close and an inert background for free. */
export function Modal({ open, onClose, title, children, footer, variant = 'center' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.classList.add('modal-open');
    } else if (!open && d.open) {
      d.close();
    }
    return () => {
      if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open');
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${variant === 'sheet' ? 'sheet' : ''}`}
      aria-labelledby="modal-title"
      onClose={() => {
        document.body.classList.remove('modal-open');
        onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // click on the backdrop (outside the content box) closes
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <div className="modal-head">
            <h2 id="modal-title">{title}</h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}
