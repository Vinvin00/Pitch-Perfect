import type { MagicBentoPitchCard } from './magicBentoPitchCoachData'

export function MagicBentoCardBody({ card }: { card: MagicBentoPitchCard }) {
  switch (card.variant) {
    case 'career':
      return (
        <>
          <p className="magic-bento-card__hero" aria-label="76 percent">
            <span className="magic-bento-card__hero-num">{card.hero}</span>
          </p>
          <p className="magic-bento-card__lead">{card.lead}</p>
          <ul className="magic-bento-card__bullets">
            {card.bullets.map((row, i) => (
              <li key={`${row.num}-${i}`} className="magic-bento-card__bullet">
                <span className="magic-bento-card__bullet-num">{row.num}</span>
                <span className="magic-bento-card__bullet-text">{row.text}</span>
              </li>
            ))}
          </ul>
          <p className="magic-bento-card__pill">
            <span className="magic-bento-card__pill-dot" aria-hidden />
            {card.pill}
          </p>
        </>
      )
    case 'memory':
      return (
        <>
          <p className="magic-bento-card__hero" aria-label="95 percent">
            <span className="magic-bento-card__hero-num">{card.hero}</span>
          </p>
          <p className="magic-bento-card__lead">{card.lead}</p>
          <p className="magic-bento-card__sub-hero">
            <span className="magic-bento-card__sub-hero-num">{card.subHero.num}</span>
            <span className="magic-bento-card__sub-hero-text">{card.subHero.rest}</span>
          </p>
          <p className="magic-bento-card__pill">
            <span className="magic-bento-card__pill-dot" aria-hidden />
            {card.pill}
          </p>
        </>
      )
    case 'impression':
      return (
        <>
          <p className="magic-bento-card__hero magic-bento-card__hero--time" aria-label="27 seconds">
            <span className="magic-bento-card__hero-row">
              <span className="magic-bento-card__hero-num">{card.heroNum}</span>
              <span className="magic-bento-card__hero-unit">{card.heroUnit}</span>
            </span>
          </p>
          <p className="magic-bento-card__lead">{card.lead}</p>
          <p className="magic-bento-card__pill">
            <span className="magic-bento-card__pill-dot" aria-hidden />
            {card.pill}
          </p>
        </>
      )
    case 'mehrabian':
      return (
        <>
          <div
            className="magic-bento-card__pie"
            aria-label="Mehrabian rule breakdown: 55 percent body language, 38 percent voice, 7 percent words"
          >
            <div className="magic-bento-card__pie-chart" aria-hidden />
            <ul className="magic-bento-card__pie-legend">
              <li className="magic-bento-card__pie-item">
                <span className="magic-bento-card__pie-swatch magic-bento-card__pie-swatch--dominant" aria-hidden />
                <span className="magic-bento-card__pie-pct">55%</span>
                <span className="magic-bento-card__pie-text">Body language &amp; eye contact</span>
              </li>
              <li className="magic-bento-card__pie-item">
                <span className="magic-bento-card__pie-swatch magic-bento-card__pie-swatch--mid" aria-hidden />
                <span className="magic-bento-card__pie-pct">38%</span>
                <span className="magic-bento-card__pie-text">Tone and pace of voice</span>
              </li>
              <li className="magic-bento-card__pie-item">
                <span className="magic-bento-card__pie-swatch magic-bento-card__pie-swatch--light" aria-hidden />
                <span className="magic-bento-card__pie-pct">7%</span>
                <span className="magic-bento-card__pie-text">The actual words spoken</span>
              </li>
            </ul>
          </div>
          <p className="magic-bento-card__pill">
            <span className="magic-bento-card__pill-dot" aria-hidden />
            {card.pill}
          </p>
        </>
      )
    case 'business':
      return (
        <>
          <p className="magic-bento-card__hero" aria-label="67 percent">
            <span className="magic-bento-card__hero-num">{card.hero}</span>
          </p>
          <p className="magic-bento-card__lead">{card.lead}</p>
          <p className="magic-bento-card__sub-hero">
            <span className="magic-bento-card__sub-hero-num magic-bento-card__sub-hero-num--emphasis">
              {card.subHero.num}
            </span>
            <span className="magic-bento-card__sub-hero-text">{card.subHero.rest}</span>
          </p>
          <p className="magic-bento-card__pill">
            <span className="magic-bento-card__pill-dot" aria-hidden />
            {card.pill}
          </p>
        </>
      )
  }
}
