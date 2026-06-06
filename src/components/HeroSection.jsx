import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

export function HeroSection({
  currentSlide,
  customerCount,
  experienceCount,
  heroSlides,
  particles,
  productCount,
  setCurrentSlide,
}) {
  return (
    <section className="hero-carousel">
      <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {heroSlides.map((slide) => (
          <div key={slide.title[1]} className="carousel-slide">
            <img src={slide.image} alt={slide.title.join(" ")} className="slide-bg-img" />
            <div className="slide-overlay" />
            <div className="slide-content">
              <div className="hero-badge">{slide.badge}</div>
              <h1 className="hero-title">
                {slide.title[0]}
                <br />
                <span className="gradient-text">{slide.title[1]}</span>
              </h1>
              <p className="hero-sub">{slide.description}</p>
              <div className="hero-btns">
                <a href={slide.primaryHref} className="btn btn-primary">{slide.primary}</a>
                <a href={slide.secondaryHref} className="btn btn-outline">{slide.secondary}</a>
              </div>
              {slide.title[1] === "Champion" ? (
                <div className="hero-stats">
                  <div className="stat">
                    <span className="stat-num">{productCount}</span>
                    <span>+</span>
                    <div className="stat-label">Products</div>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat">
                    <span className="stat-num">{customerCount}</span>
                    <span>+</span>
                    <div className="stat-label">Happy Customers</div>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat">
                    <span className="stat-num">{experienceCount}</span>
                    <span>+</span>
                    <div className="stat-label">Years Experience</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <button className="carousel-btn carousel-prev" aria-label="Previous" onClick={() => setCurrentSlide((currentSlide + heroSlides.length - 1) % heroSlides.length)}>
        <ChevronLeftIcon />
      </button>
      <button className="carousel-btn carousel-next" aria-label="Next" onClick={() => setCurrentSlide((currentSlide + 1) % heroSlides.length)}>
        <ChevronRightIcon />
      </button>

      <div className="carousel-dots">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.title[1]}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="hero-particles">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="particle"
            style={{ left: particle.left, animationDelay: particle.delay, animationDuration: particle.duration }}
          />
        ))}
      </div>
    </section>
  );
}
