import { Icon } from './Icon';

export function Banner({ message, active }: { message: string; active: boolean }) {
  if (!active || !message.trim()) return null;
  return (
    <div className="banner" role="alert">
      <Icon name="alert" />
      <p>{message}</p>
    </div>
  );
}
