import Avatar from './Avatar.jsx';

function StandingsTable({ standings, participantsById, currentIds, qualifyCount = 0, compact }) {
  return (
    <table className={`standings-table ${compact ? 'compact' : ''}`}>
      <thead>
        <tr>
          <th className="col-rank">#</th>
          <th className="col-name">Spieler</th>
          <th className="col-num">Sp</th>
          <th className="col-num">S</th>
          <th className="col-num">N</th>
          <th className="col-num">Diff</th>
          <th className="col-num col-pts">Pkt</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((row, i) => {
          const p = participantsById[row.id];
          const qualified = qualifyCount > 0 && i < qualifyCount;
          const live = currentIds?.includes(row.id);
          return (
            <tr
              key={row.id}
              className={`${qualified ? 'is-qualified' : ''} ${live ? 'is-live' : ''}`}
              style={{ '--accent': p?.color }}
            >
              <td className="col-rank">{i + 1}</td>
              <td className="col-name">
                <Avatar avatar={p?.avatar} color={p?.color} size="clamp(22px, 3vh, 40px)" />
                <span className="standings-name">{p?.name ?? '—'}</span>
              </td>
              <td className="col-num">{row.played}</td>
              <td className="col-num">{row.wins}</td>
              <td className="col-num">{row.losses}</td>
              <td className="col-num">{row.diff > 0 ? `+${row.diff}` : row.diff}</td>
              <td className="col-num col-pts">{row.pts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function StandingsView({
  standings,
  participantsById,
  currentIds,
  title = 'Tabelle',
  subtitle,
}) {
  return (
    <div className="beamer-screen standings-screen">
      <header className="beamer-header compact">
        <h1 className="event-title">{title}</h1>
        {subtitle && <span className="event-meta">{subtitle}</span>}
      </header>
      <div className="standings-wrap">
        <StandingsTable standings={standings} participantsById={participantsById} currentIds={currentIds} />
      </div>
    </div>
  );
}

export { StandingsTable };
