import { Reveal } from "../Reveal";
import { Stat } from "../Stat";

export function StatsSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14" aria-label="Minute AI at a glance">
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat prefix="~" to={3} suffix=" min" label="hang-up → notes in your inbox" />
          <Stat to={100} suffix="%" label="of every call searchable" />
          <Stat to={4} word="sections" label="decisions · highlights · blockers · next steps" />
          <Stat to={0} word="bots" label="ever join your meetings" />
        </div>
      </Reveal>
    </section>
  );
}
