import Identicon from "./Identicon";

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ username, avatarUrl, size = 40, className = "" }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return <Identicon seed={username} size={size} className={className} />;
}
