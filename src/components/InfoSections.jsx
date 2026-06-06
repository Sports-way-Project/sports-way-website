import { SectionHeader } from "./SectionHeader";

export function WhyUsSection({ features }) {
  return (
    <section className="why-us" id="about">
      <div className="container">
        <SectionHeader tag="Our Promise" title="Why Choose Sports Way?" />
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({ testimonials }) {
  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <SectionHeader tag="Customer Reviews" title="What Our Customers Say" />
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className={`testimonial-card ${testimonial.featured ? "featured-review" : ""}`}>
              <div className="stars">\u2605\u2605\u2605\u2605\u2605</div>
              <p>"{testimonial.quote}"</p>
              <div className="reviewer">
                <div className="reviewer-avatar">{testimonial.avatar}</div>
                <div>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection({ ctaSubmitted, onSubmit }) {
  return (
    <section className="cta-banner" id="cta">
      <div className="cta-content">
        <h2>Ready to Build Your Dream Gym?</h2>
        <p>
          Sign up today and get <strong>10% off</strong> your first order + free shipping.
        </p>
        <form className="cta-form" onSubmit={onSubmit}>
          <input type="email" placeholder="Enter your email address" required />
          <button type="submit" className="btn btn-primary">
            Get 10% Off
          </button>
        </form>
        {ctaSubmitted ? <div className="cta-note">Thanks. Your discount request has been received.</div> : null}
      </div>
    </section>
  );
}

export function ContactSection({ contactSubmitted, contacts, onSubmit }) {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <SectionHeader tag="Get In Touch" title="Contact Us" />
        <div className="contact-grid">
          <div className="contact-info">
            {contacts.map((contact) => (
              <div key={contact.title} className="contact-item">
                <span className="contact-icon">{contact.icon}</span>
                <div>
                  <strong>{contact.title}</strong>
                  {contact.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form className="contact-form" onSubmit={onSubmit}>
            <div className="form-row">
              <input type="text" placeholder="Your Name" required />
              <input type="email" placeholder="Email Address" required />
            </div>
            <input type="text" placeholder="Subject" />
            <textarea rows="5" placeholder="Your message..." required />
            <button type="submit" className="btn btn-primary">
              Send Message
            </button>
            <div className={`form-success ${contactSubmitted ? "show" : ""}`}>Message sent! We'll get back to you soon.</div>
          </form>
        </div>
      </div>
    </section>
  );
}
