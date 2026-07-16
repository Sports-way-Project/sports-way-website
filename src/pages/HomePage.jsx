import { useState } from "react";
import { SEO } from "../components/SEO";
import { CategorySection } from "../components/CategorySection";
import { FeaturedSection } from "../components/FeaturedSection";
import { HeroSection } from "../components/HeroSection";
import { ContactSection, CtaSection, TestimonialsSection, WhyUsSection } from "../components/InfoSections";
import { MarqueeBar } from "../components/MarqueeBar";
import {
  categories,
  contacts,
  features,
  filters,
  heroSlides,
  marqueeItems,
  particles,
  products,
  testimonials,
} from "../data/siteData";
import { useAutoSlide } from "../hooks/useAutoSlide";
import { useCatalog } from "../hooks/useCatalog";
import { useCountUp } from "../hooks/useCountUp";

export function HomePage({ addToCart, toggleWishlist, wishlist }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [ctaSubmitted, setCtaSubmitted] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const productCount = useCountUp(1000);
  const customerCount = useCountUp(5000);
  const experienceCount = useCountUp(6);
  const {
    activeFilter,
    filteredProducts,
    setActiveFilter,
    setVisibleCount,
    visibleCount,
    visibleProducts,
  } = useCatalog(products);

  useAutoSlide(setCurrentSlide, heroSlides.length);

  return (
        <>
      <SEO />
      <HeroSection
        currentSlide={currentSlide}
        customerCount={customerCount}
        experienceCount={experienceCount}
        heroSlides={heroSlides}
        particles={particles}
        productCount={productCount}
        setCurrentSlide={setCurrentSlide}
      />

      <MarqueeBar items={marqueeItems} />
      <CategorySection categories={categories} />

      <FeaturedSection
        activeFilter={activeFilter}
        addToCart={addToCart}
        filteredProducts={filteredProducts}
        filters={filters}
        setActiveFilter={setActiveFilter}
        setVisibleCount={setVisibleCount}
        toggleWishlist={toggleWishlist}
        visibleCount={visibleCount}
        visibleProducts={visibleProducts}
        wishlist={wishlist}
      />

      <WhyUsSection features={features} />
      <TestimonialsSection testimonials={testimonials} />

      <CtaSection
        ctaSubmitted={ctaSubmitted}
        onSubmit={(event) => {
          event.preventDefault();
          setCtaSubmitted(true);
        }}
      />

      <ContactSection
        contactSubmitted={contactSubmitted}
        contacts={contacts}
        onSubmit={(event) => {
          event.preventDefault();
          setContactSubmitted(true);
        }}
      />
    </>
  );
}

