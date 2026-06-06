import { SectionHeader } from "./SectionHeader";

export function CategorySection({ categories }) {
  return (
    <section className="categories" id="categories">
      <div className="container">
        <SectionHeader
          tag="Shop By Category"
          title="Find Your Perfect Gear"
          subtitle="Explore our curated range of professional sports and fitness equipment"
        />
        <div className="category-grid category-grid-big">
          {categories.map((category) => (
            <a key={category.title} href={category.href} className="category-card">
              <div className="category-img-wrap">
                <img src={category.image} alt={category.title} loading="lazy" />
              </div>
              <div className="category-info">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <span className="category-count">{category.count}</span>
              </div>
              <div className="category-arrow">-&gt;</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
