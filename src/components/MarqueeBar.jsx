export function MarqueeBar({ items }) {
  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {[...items, ...items].map((item, index) => (
          <span key={`${item.label}-${index}`} className="marquee-item">
            <a href={item.href} className="marquee-link">{item.label}</a>
            <span className="marquee-sep">&bull;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
