export default function Avatar({ avatar, color, size = 64, ring = true }) {
  const emoji = avatar?.emoji ?? '❓';
  // Accept both numbers (px) and responsive CSS strings like "clamp(...)".
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      className="avatar"
      style={{
        width: dim,
        height: dim,
        fontSize: `calc(${dim} * 0.58)`,
        borderColor: ring ? color ?? 'transparent' : 'transparent',
        boxShadow: ring && color ? `0 0 calc(${dim} * 0.35) ${color}55` : 'none',
      }}
      role="img"
      aria-label={avatar?.label ?? 'Avatar'}
    >
      {emoji}
    </span>
  );
}
