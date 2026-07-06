export default function Avatar({ avatar, color, size = 64, ring = true }) {
  const emoji = avatar?.emoji ?? '❓';
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.58),
        borderColor: ring ? color ?? 'transparent' : 'transparent',
        boxShadow: ring && color ? `0 0 ${Math.round(size * 0.35)}px ${color}55` : 'none',
      }}
      role="img"
      aria-label={avatar?.label ?? 'Avatar'}
    >
      {emoji}
    </span>
  );
}
