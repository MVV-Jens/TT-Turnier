import { StandingsTable } from './StandingsView.jsx';

export default function GroupsView({
  groups,
  participantsById,
  qualifyCount = 1,
  currentIds,
  title = 'Gruppen',
  subtitle,
}) {
  return (
    <div className="beamer-screen groups-screen">
      <header className="beamer-header compact">
        <h1 className="event-title">{title}</h1>
        {subtitle && <span className="event-meta">{subtitle}</span>}
      </header>
      <div className={`groups-grid groups-${groups.length}`}>
        {groups.map((g) => (
          <div key={g.id} className="group-card">
            <div className="group-card-title">{g.name}</div>
            <StandingsTable
              standings={g.standings}
              participantsById={participantsById}
              currentIds={currentIds}
              qualifyCount={qualifyCount}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  );
}
