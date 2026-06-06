const IMPACTS = [
  {
    number: "01",
    title: "Flooding and erosion",
    text: "Higher starting water levels make nuisance flooding more frequent and accelerate the loss of beaches and coastal land.",
  },
  {
    number: "02",
    title: "Water and food",
    text: "Saltwater can enter groundwater, soils, and wetlands, putting drinking water and low-lying crops under pressure.",
  },
  {
    number: "03",
    title: "Homes and services",
    text: "Roads, ports, power, health facilities, and homes face more frequent damage, disruption, and costly adaptation.",
  },
  {
    number: "04",
    title: "Ecosystems",
    text: "Repeated losses can contribute to displacement while reefs, mangroves, and coastal habitats struggle to keep pace.",
  },
];

export function ImpactsSection() {
  return (
    <section className="impacts-section" aria-labelledby="impacts-title">
      <div>
        <p className="eyebrow eyebrow--dark">Each millimeter matters</p>
        <h2 id="impacts-title">Higher water changes the baseline</h2>
      </div>
      <div className="impact-grid">
        {IMPACTS.map((impact) => (
          <article key={impact.number}>
            <p className="impact-number">{impact.number}</p>
            <h3>{impact.title}</h3>
            <p>{impact.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
