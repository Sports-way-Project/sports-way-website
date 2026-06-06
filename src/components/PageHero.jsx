export function PageHero({ title, description, image }) {
  return (
    <div className="page-hero">
      <img className="page-hero-img" src={image} alt={title} />
      <div className="page-hero-overlay" />
      <div className="page-hero-content">
        <div className="breadcrumb">
          <a href="index.html">Home</a>
          <span>/</span>
          <span>{title}</span>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
