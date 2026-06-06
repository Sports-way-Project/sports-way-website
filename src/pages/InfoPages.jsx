import { useEffect, useState } from "react";
import { PageHero } from "../components/PageHero";
import { SectionHeader } from "../components/SectionHeader";
import { blogPosts, teamMembers, wholesaleBenefits } from "../data/storefrontPages";
import { asset } from "../lib/assets";

export function AboutPage() {
  useEffect(() => {
    document.title = "About Us - Sports Way Trading Qatar";
  }, []);

  return (
    <>
      <PageHero
        title="Our Journey"
        description="We deliver premium sports equipment, gym solutions and fitness innovations trusted by professionals across Qatar."
        image={asset("Image/Sports Way About Us.jpg")}
      />
      <section className="about-section">
        <div className="container about-grid">
          <div className="about-img-wrap">
            <img src={asset("Image/GYM AND SPORTS.jpg")} alt="Sports Way Gym" />
            <div className="about-img-badge">
              <span className="num">6+</span>
              <span className="lbl">Years in Qatar</span>
            </div>
          </div>
          <div className="about-text">
            <span className="section-tag">Who We Are</span>
            <h2>Elevating Fitness Standards Since 2020</h2>
            <p>
              Sports Way Trading has grown into a trusted supplier of premium gym and sports equipment in Qatar. We focus on equipment that holds up in real-world use and service that keeps projects moving.
            </p>
            <p>
              Our work spans commercial gyms, sports clubs, schools, and home fitness spaces. The difference is not only product range. It is practical planning, faster local support, and a cleaner handoff from inquiry to installation.
            </p>
            <div className="about-stats">
              <div className="astat">
                <div className="num">1,000+</div>
                <div className="lbl">Products</div>
              </div>
              <div className="astat">
                <div className="num">10,000+</div>
                <div className="lbl">Happy Clients</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="team-section">
        <div className="container">
          <SectionHeader tag="Our Team" title="The People Behind Sports Way" />
          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.name} className="team-card">
                <img src={member.image} alt={member.name} />
                <div className="team-info">
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function BlogPage() {
  useEffect(() => {
    document.title = "Blog - Sports Way Trading Qatar";
  }, []);

  return (
    <>
      <PageHero
        title="Fitness Insights"
        description="Stay updated with practical fitness trends, product guidance, and training advice relevant to active lifestyles in Qatar."
        image={asset("Image/Sportsway Gym equipment.jpg")}
      />
      <div className="container">
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.title} className="blog-card">
              <div className="blog-card-img">
                <img src={post.image} alt={post.title} />
              </div>
              <div className="blog-card-body">
                <span className="blog-tag">{post.tag}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="blog-meta">
                  <span>{post.date}</span>
                  <span>{post.author}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Contact Us - Sports Way Trading Qatar";
  }, []);

  return (
    <>
      <PageHero
        title="Get in Touch"
        description="Have questions about products, installation, or bulk orders? Our team is here to help."
        image={asset("Image/Sportsway contact us.jpeg")}
      />
      <div className="container contact-page">
        <div className="contact-cards">
          {[
            { title: "Phone", lines: ["+974 3996 3997", "+974 4142 2728"] },
            { title: "Email", lines: ["sales@sports-way.com", "info@sports-way.com"] },
            { title: "Address", lines: ["Zone 53, Street 740 - Al Rayyan", "Building 81, 2nd floor, Doha"] },
            { title: "Working Hours", lines: ["Sat - Thu: 9am - 5pm", "Friday: Closed"] },
          ].map((card) => (
            <div key={card.title} className="contact-card">
              <div className="contact-card-icon">{card.title.slice(0, 1)}</div>
              <h3>{card.title}</h3>
              {card.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
          ))}
        </div>
        <div className="map-wrap">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.411623126487!2d51.42887681501131!3d25.289139983853112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDE3JzIwLjkiTiA1McKwMjUnNTEuOSJF!5e0!3m2!1sen!2sqa!4v1620000000000!5m2!1sen!2sqa"
            loading="lazy"
            title="Sports Way location"
          />
        </div>
        <div className="wholesale-form-wrap">
          <h2 style={{ textAlign: "center" }}>Send us a Message</h2>
          <p style={{ textAlign: "center" }}>
            {submitted ? "Your message has been queued. We will follow up shortly." : "We’ll get back to you as soon as possible."}
          </p>
          <form className="wh-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            <div className="form-row">
              <input type="text" placeholder="Full Name" required />
              <input type="email" placeholder="Email Address" required />
            </div>
            <input type="text" placeholder="Subject" />
            <textarea placeholder="Your Message" required />
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export function WholesalePage() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Wholesale - Sports Way Trading Qatar";
  }, []);

  return (
    <>
      <div className="wholesale-hero">
        <div className="container">
          <h1>Wholesale Partnerships</h1>
          <p>Elevate your training facility with professional-grade equipment at competitive bulk pricing.</p>
        </div>
      </div>
      <div className="container">
        <div className="wholesale-grid">
          {wholesaleBenefits.map((benefit) => (
            <div key={benefit.number} className="wholesale-card">
              <div className="wh-num">{benefit.number}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
        <div className="wholesale-form-wrap">
          <h2>Apply for Wholesale</h2>
          <p>{submitted ? "Application submitted. Our partnerships manager will contact you." : "Fill out the form below and our partnerships manager will contact you within 24 hours."}</p>
          <form className="wh-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            <div className="form-row">
              <input type="text" placeholder="Company Name" required />
              <input type="text" placeholder="Contact Person" required />
            </div>
            <div className="form-row">
              <input type="email" placeholder="Business Email" required />
              <input type="tel" placeholder="Phone Number" required />
            </div>
            <div className="form-row">
              <select required defaultValue="">
                <option value="" disabled>Business Type</option>
                <option value="gym">Commercial Gym</option>
                <option value="hotel">Hotel / Real Estate</option>
                <option value="corp">Corporate Office</option>
                <option value="school">School / University</option>
                <option value="retail">Retailer</option>
              </select>
              <input type="text" placeholder="Estimated Order Value (QAR)" />
            </div>
            <textarea placeholder="Tell us more about your project..." />
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
