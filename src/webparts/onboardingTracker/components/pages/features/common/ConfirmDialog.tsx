import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';

// Replaces window.confirm, which Teams blocks inside its app iframe (the dialog never appears there).
// confirmDialog() resolves once the user answers; ConfirmDialogHost (mounted once, near the app root)
// renders the actual prompt and is the only thing allowed to call setPending.
interface IPendingConfirm {
  message: string;
  resolve: (confirmed: boolean) => void;
}

let setPending: ((pending: IPendingConfirm | undefined) => void) | undefined;

export function confirmDialog(message: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    if (!setPending) {
      // host not mounted (should not happen); deny so destructive actions do not run unconfirmed
      resolve(false);
      return;
    }
    setPending({ message, resolve });
  });
}

export default function ConfirmDialogHost(): React.ReactElement {
  const [pending, setPendingState] = React.useState<IPendingConfirm | undefined>(undefined);

  React.useEffect(() => {
    setPending = setPendingState;
    return () => { setPending = undefined; };
  }, []);

  if (!pending) {
    return <></>;
  }

  const respond = (confirmed: boolean): void => {
    pending.resolve(confirmed);
    setPendingState(undefined);
  };

  return (
    <div className={styles.dialogBackdrop} role="presentation" onClick={() => respond(false)}>
      <div
        className={styles.dialog}
        style={{ width: 'min(420px, 100%)' }}
        role="alertdialog"
        aria-modal="true"
        onClick={event => event.stopPropagation()}
      >
        <p style={{ whiteSpace: 'pre-wrap' }}>{pending.message}</p>
        <div className={styles.dialogActions}>
          <button type="button" autoFocus onClick={() => respond(true)}>Тийм</button>
          <button type="button" onClick={() => respond(false)}>Болих</button>
        </div>
      </div>
    </div>
  );
}
