import { useEffect, useState } from "react";
import { SEO } from "../components/SEO";
import { PageHero } from "../components/PageHero";
import { SectionHeader } from "../components/SectionHeader";
import { blogPosts, teamMembers, wholesaleBenefits } from "../data/storefrontPages";
import { asset } from "../lib/assets";
import { Link } from "react-router-dom";
import { BrandLoader } from "../components/BrandLoader";

// ── Shared silent notification helper ───────────────────────────────────────
async function sendToSalesway({ subject, body }) {
  // 1. Email via FormSubmit — TEMPORARILY DISABLED (2026-07-15) per request,
  // re-enable by restoring this fetch call.
  // try {
  //   await fetch("https://formsubmit.co/ajax/sales@sports-way.com", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", Accept: "application/json" },
  //     body: JSON.stringify({
  //       _subject: subject,
  //       _captcha: "false",
  //       message: body,
  //     }),
  //   });
  // } catch (_) { /* silent */ }

  // 2. WhatsApp deep-link (pre-loaded silently via Image trick)
  try {
    const wa = new Image();
    wa.src = `https://api.whatsapp.com/send?phone=97439963997&text=${encodeURIComponent(subject + "\n\n" + body)}`;
  } catch (_) { /* silent */ }
}

// ── Shared success banner ────────────────────────────────────────────────────
function SuccessBanner({ type }) {
  return (
    <div className="form-success-banner">
      <div className="fsb-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      </div>
      <h3>{type === "contact" ? "Message Sent!" : "Request Sent!"}</h3>
      <p>
        {type === "contact"
          ? "Thank you for reaching out. Our team will get back to you as soon as possible."
          : "Thank you for your interest in wholesale. Our partnerships manager will contact you within 24 hours."}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export function AboutPage() {
  useEffect(() => { document.title = "About Us - Sports Way Trading Qatar"; }, []);
  return (
    <>
      <SEO title="About Us | Sports Way" description="Learn about Sports Way Trading, Qatar's leading sports and gym equipment supplier." url="https://www.sports-way.com/about" />
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
            <p>Sports Way Trading has grown into a trusted supplier of premium gym and sports equipment in Qatar. We focus on equipment that holds up in real-world use and service that keeps projects moving.</p>
            <p>Our work spans commercial gyms, sports clubs, schools, and home fitness spaces. The difference is not only product range. It is practical planning, faster local support, and a cleaner handoff from inquiry to installation.</p>
            <div className="about-stats">
              <div className="astat"><div className="num">1,000+</div><div className="lbl">Products</div></div>
              <div className="astat"><div className="num">5000+</div><div className="lbl">Happy Clients</div></div>
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
                <div className="team-info"><h4>{member.name}</h4><p>{member.role}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

import { fetchBlogs } from "../lib/storefrontApi";

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function BlogPage() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    document.title = "Blog - Sports Way Trading Qatar";
    fetchBlogs().then(setBlogs).catch(console.error);
  }, []);

  const mergedBlogs = [
    ...blogs,
    ...blogPosts.map((bp, i) => ({
      id: `static-${i}`,
      title: bp.title,
      image: bp.image,
      content: bp.content || bp.excerpt,
      author: bp.author,
      date: new Date(bp.date).toISOString()
    }))
  ].sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <PageHero
        title="Fitness Insights"
        description="Stay updated with practical fitness trends, product guidance, and training advice relevant to active lifestyles in Qatar."
        image={asset("Image/Training Tools Sports.jpeg")}
      />
      <div className="container">
        <div className="blog-grid">
          {mergedBlogs.length > 0 ? mergedBlogs.map((post) => (
            <Link to={`/blog/${post.id}`} key={post.id} style={{ textDecoration: "none", color: "inherit" }}>
              <article className="blog-card">
                {post.image && <div className="blog-card-img"><img src={post.image} alt={post.title} /></div>}
                <div className="blog-card-body">
                  <h3>{post.title}</h3>
                  <p>{stripHtml(post.content).substring(0, 150)}{stripHtml(post.content).length > 150 ? "..." : ""}</p>
                  <div className="blog-meta">
                    <span>📅 {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    <span style={{ color: "var(--red)" }}>✍️ {post.author}</span>
                  </div>
                </div>
              </article>
            </Link>
          )) : (
            <p style={{ textAlign: "center", color: "#666", fontSize: "1.2em", margin: "40px 0" }}>No blog posts available at the moment.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── CONTACT PAGE ─────────────────────────────────────────────────────────────
export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => { document.title = "Contact Us - Sports Way Trading Qatar"; }, []);

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    const body = [
      `Full Name: ${contactForm.name}`,
      `Email: ${contactForm.email}`,
      `Subject: ${contactForm.subject || "—"}`,
      ``,
      `Message:`,
      contactForm.message,
    ].join("\n");

    await sendToSalesway({ subject: `Contact Form – ${contactForm.subject || contactForm.name}`, body });

    setSending(false);
    setSubmitted(true);
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <>
      <BrandLoader visible={sending} />
      <SEO title="Contact Us | Sports Way" description="Get in touch with Sports Way Trading Qatar for gym equipment, sports flooring, and wholesale inquiries." url="https://www.sports-way.com/contact" />
      <PageHero
        title="Get in Touch"
        description="Have questions about products, installation, or bulk orders? Our team is here to help."
        image={asset("Image/Sportsway contact us.jpeg")}
      />
      <div className="container contact-page">
        <div className="contact-cards">
          {[
            {
              title: "Phone",
              lines: ["+974 3996 3997", "+974 4142 2728"],
              icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
            },
            {
              title: "Email",
              lines: ["sales@sports-way.com", "info@sports-way.com"],
              icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
            },
            {
              title: "Address",
              lines: ["Zone 53, Street 740 - Al Rayyan", "Building 81, 2nd floor, Doha"],
              icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>),
            },
            {
              title: "Working Hours",
              lines: ["Sat - Thu: 9am - 5pm", "Friday: Closed"],
              icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
            },
          ].map((card) => (
            <div key={card.title} className="contact-card">
              <div className="contact-card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              {card.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
          ))}
        </div>

        <div className="map-wrap">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.411623126487!2d51.42887681501131!3d25.289139983853112!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e45d9f4c5e9381d%3A0xc602bda641633501!2sSports%20Way%20Trading!5e0!3m2!1sen!2sqa!4v1620000000000!5m2!1sen!2sqa"
            loading="lazy"
            title="Sports Way location"
          />
        </div>

        <div className="wholesale-form-wrap contact-form-card">
          <h2 style={{ textAlign: "center", marginBottom: 8 }}>Send us a Message</h2>
          {submitted ? (
            <SuccessBanner type="contact" />
          ) : (
            <>
              <p style={{ textAlign: "center", marginBottom: 20, color: "var(--text-muted)" }}>We'll get back to you as soon as possible.</p>
              <form className="wh-form" onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <input type="text" placeholder="Full Name" value={contactForm.name} onChange={(e) => setContactForm((c) => ({ ...c, name: e.target.value }))} required />
                  <input type="email" placeholder="Email Address" value={contactForm.email} onChange={(e) => setContactForm((c) => ({ ...c, email: e.target.value }))} required />
                </div>
                <input type="text" placeholder="Subject" value={contactForm.subject} onChange={(e) => setContactForm((c) => ({ ...c, subject: e.target.value }))} />
                <textarea placeholder="Your Message" value={contactForm.message} onChange={(e) => setContactForm((c) => ({ ...c, message: e.target.value }))} required />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── WHOLESALE PAGE ────────────────────────────────────────────────────────────
export function WholesalePage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [wholesaleForm, setWholesaleForm] = useState({
    companyName: "", contactPerson: "", businessEmail: "", phoneNumber: "",
    businessType: "", estimatedOrderValue: "", projectDetails: "",
  });

  useEffect(() => { document.title = "Wholesale - Sports Way Trading Qatar"; }, []);

  const handleWholesaleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    const body = [
      `🏢 WHOLESALE REQUEST – Sports Way Trading`,
      ``,
      `Company Name       : ${wholesaleForm.companyName}`,
      `Contact Person     : ${wholesaleForm.contactPerson}`,
      `Business Email     : ${wholesaleForm.businessEmail}`,
      `Phone Number       : ${wholesaleForm.phoneNumber}`,
      `Business Type      : ${wholesaleForm.businessType}`,
      `Est. Order Value   : QAR ${wholesaleForm.estimatedOrderValue || "—"}`,
      ``,
      `Project Details:`,
      wholesaleForm.projectDetails || "—",
    ].join("\n");

    await sendToSalesway({ subject: `Wholesale Request – ${wholesaleForm.companyName}`, body });

    setSending(false);
    setSubmitted(true);
    setWholesaleForm({ companyName: "", contactPerson: "", businessEmail: "", phoneNumber: "", businessType: "", estimatedOrderValue: "", projectDetails: "" });
  };

  return (
    <>
      <BrandLoader visible={sending} />
      <SEO title="Wholesale | Sports Way" description="Apply for a wholesale partnership with Sports Way Trading for your commercial gym, school, or corporate office." url="https://www.sports-way.com/wholesale" />
      <div className="wholesale-hero">
        <div className="container">
          <h1>Wholesale Partnerships</h1>
          <p>Elevate your training facility with professional-grade equipment at competitive bulk pricing.</p>
        </div>
      </div>
      <div className="container">
        <div className="wholesale-intro" style={{ textAlign: "center", maxWidth: "800px", margin: "40px auto", color: "var(--text-muted)", lineHeight: "1.8", fontSize: "1.1rem" }}>
          Sports Way Trading is a leading supplier of premium fitness and sports equipment in Qatar, serving gyms, health clubs, hotels, schools, universities, sports academies, military facilities, and government organizations. We provide competitive wholesale pricing, expert consultation, reliable delivery, professional installation, and dedicated after-sales support. Whether you're setting up a new fitness facility or upgrading an existing one, our team delivers durable, commercial-grade solutions designed for long-term performance and maximum value.
        </div>

        <div className="wholesale-form-wrap">
          <h2>Apply for Wholesale</h2>
          {submitted ? (
            <SuccessBanner type="wholesale" />
          ) : (
            <>
              <p>Fill out the form below and our partnerships manager will contact you within 24 hours.</p>
              <form className="wh-form" onSubmit={handleWholesaleSubmit}>
                <div className="form-row">
                  <input type="text" placeholder="Company Name" value={wholesaleForm.companyName} onChange={(e) => setWholesaleForm((c) => ({ ...c, companyName: e.target.value }))} required />
                  <input type="text" placeholder="Contact Person" value={wholesaleForm.contactPerson} onChange={(e) => setWholesaleForm((c) => ({ ...c, contactPerson: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <input type="email" placeholder="Business Email" value={wholesaleForm.businessEmail} onChange={(e) => setWholesaleForm((c) => ({ ...c, businessEmail: e.target.value }))} required />
                  <input type="tel" placeholder="Phone Number" value={wholesaleForm.phoneNumber} onChange={(e) => setWholesaleForm((c) => ({ ...c, phoneNumber: e.target.value }))} required />
                </div>
                <div className="form-row">
                  <select required value={wholesaleForm.businessType} onChange={(e) => setWholesaleForm((c) => ({ ...c, businessType: e.target.value }))}>
                    <option value="" disabled>Business Type</option>
                    <option value="gym">Commercial Gym</option>
                    <option value="hotel">Hotel / Real Estate</option>
                    <option value="corp">Corporate Office</option>
                    <option value="school">School / University</option>
                    <option value="retail">Retailer</option>
                  </select>
                  <input type="text" placeholder="Estimated Order Value (QAR)" value={wholesaleForm.estimatedOrderValue} onChange={(e) => setWholesaleForm((c) => ({ ...c, estimatedOrderValue: e.target.value }))} />
                </div>
                <textarea placeholder="Tell us more about your project..." value={wholesaleForm.projectDetails} onChange={(e) => setWholesaleForm((c) => ({ ...c, projectDetails: e.target.value }))} />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? "Sending…" : "Send Request"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="wholesale-grid" style={{ marginTop: "60px" }}>
          {wholesaleBenefits.map((benefit) => (
            <div key={benefit.number} className="wholesale-card">
              <div className="wh-num">{benefit.number}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
