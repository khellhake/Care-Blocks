import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

interface Options {
  confirmLabel?: string;
  title?: string;
}
type AskFn = (message: string, opts?: Options) => Promise<boolean>;

const ConfirmCtx = createContext<AskFn>(async () => false);

/** In-app replacement for window.confirm (which is blocked in some embedded viewers and looks bad on phones). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<{ message: string; opts: Options } | null>(null);
  const resolver = useRef<(v: boolean) => void>();

  const ask = useCallback<AskFn>(
    (message, opts = {}) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setReq({ message, opts });
      }),
    [],
  );

  const finish = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = undefined;
    setReq(null);
  };

  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      <Modal
        open={Boolean(req)}
        onClose={() => finish(false)}
        title={req?.opts.title ?? 'Are you sure?'}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => finish(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger-solid" autoFocus onClick={() => finish(true)}>
              {req?.opts.confirmLabel ?? 'Yes, remove'}
            </button>
          </>
        }
      >
        <p>{req?.message}</p>
      </Modal>
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);
