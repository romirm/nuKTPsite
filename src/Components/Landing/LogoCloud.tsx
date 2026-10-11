const allLogos: Record<string, string> = (() => {
  const context = (require as any).context("@/Assets/Vectors", false, /\.svg$/);
  const map: Record<string, string> = {};
  context.keys().forEach((key: string) => {
    const fileName = key.replace("./", "").replace(".svg", "");
    const mod = context(key);
    map[fileName] = typeof mod === "string" ? mod : mod.default;
  });
  return map;
})();

const groups = [
  {
    id: "Technology",
    rows: [
      ["meta", "apple", "amazon", "netflix", "google"],
      ["microsoft", "palantir", "roblox", "uber", "stripe"],
    ],
  },
  {
    id: "Trading & finance",
    rows: [
      ["hrt", "janestreet", "citadel", "optiver", "imc"],
      ["ctc", "bam", "virtu", "jpmorganchase", "goldmansachs"],
    ],
  },
  {
    id: "Fintech & consulting",
    rows: [
      ["ramp", "c1", "bloomberg", "robinhood", "paypal"],
      ["mckinsey", "bcg", "bain", "deloitte", "accenture"],
    ],
  },
];

const companies: Record<string, { name: string; website: string }> = {
  meta: { name: "Meta", website: "https://www.meta.com" },
  apple: { name: "Apple", website: "https://www.apple.com" },
  amazon: { name: "Amazon", website: "https://www.amazon.com" },
  netflix: { name: "Netflix", website: "https://www.netflix.com" },
  google: { name: "Google", website: "https://www.google.com" },
  microsoft: { name: "Microsoft", website: "https://www.microsoft.com" },
  palantir: { name: "Palantir", website: "https://www.palantir.com" },
  roblox: { name: "Roblox", website: "https://www.roblox.com" },
  uber: { name: "Uber", website: "https://www.uber.com" },
  stripe: { name: "Stripe", website: "https://stripe.com" },
  hrt: { name: "Hudson River Trading", website: "https://www.hudsonrivertrading.com" },
  janestreet: { name: "Jane Street", website: "https://www.janestreet.com" },
  citadel: { name: "Citadel", website: "https://www.citadel.com" },
  optiver: { name: "Optiver", website: "https://optiver.com" },
  imc: { name: "IMC", website: "https://www.imc.com" },
  ctc: { name: "Chicago Trading Company", website: "https://www.chicagotrading.com" },
  bam: { name: "Balyasny Asset Management", website: "https://www.bamfunds.com" },
  virtu: { name: "Virtu", website: "https://www.virtu.com" },
  jpmorganchase: { name: "JPMorgan Chase", website: "https://www.jpmorganchase.com" },
  goldmansachs: { name: "Goldman Sachs", website: "https://www.goldmansachs.com" },
  ramp: { name: "Ramp", website: "https://ramp.com" },
  c1: { name: "Capital One", website: "https://www.capitalone.com" },
  bloomberg: { name: "Bloomberg", website: "https://www.bloomberg.com" },
  robinhood: { name: "Robinhood", website: "https://robinhood.com" },
  paypal: { name: "PayPal", website: "https://www.paypal.com" },
  mckinsey: { name: "McKinsey", website: "https://www.mckinsey.com" },
  bcg: { name: "Boston Consulting Group", website: "https://www.bcg.com" },
  bain: { name: "Bain & Company", website: "https://www.bain.com" },
  deloitte: { name: "Deloitte", website: "https://www.deloitte.com" },
  accenture: { name: "Accenture", website: "https://www.accenture.com" },
};

export default function LogoCloud() {
  return (
    <section id="logocloud" className="studio-companies studio-section" aria-labelledby="companies-heading">
      <div className="studio-container">
        <div className="studio-section-mark" aria-hidden="true">
          05 / Our network
        </div>
        <div className="studio-companies-heading">
          <div>
            <h2 id="companies-heading">Where We're At</h2>
            <p>Our members work at leading technology, trading, and financial services companies.</p>
          </div>
        </div>
      </div>
      <div className="arcade-logo-marquee" onFocusCapture={(event) => {
        const link = event.target as HTMLElement;
        if (link.matches(":focus-visible")) requestAnimationFrame(() => link.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" }));
      }}>
        {groups.map((group) => (
          <div className="arcade-logo-row" key={group.id}>
            <div className="arcade-logo-belt">
              {[false, true].map((duplicate) => (
                <ul key={String(duplicate)} className={duplicate ? "arcade-logo-list is-duplicate" : "arcade-logo-list"} aria-label={duplicate ? undefined : group.id} aria-hidden={duplicate ? true : undefined}>
                  {group.rows.flat().map((companyKey) => {
                    const src = allLogos[companyKey + "_logo"];
                    const company = companies[companyKey];
                    return (
                      <li key={companyKey}>
                        <a className="studio-company" href={company.website} target="_blank" rel="noopener noreferrer" tabIndex={duplicate ? -1 : 0} aria-label={`${company.name} website (opens in a new tab)`}>
                          {src ? <img src={src} alt={duplicate ? "" : company.name} /> : <span>{company.name}</span>}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
