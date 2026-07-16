import { useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const emailRef = useRef(null);

  const handleCtaSubmit = (event) => {
    event.preventDefault();
    const email = emailRef.current?.value?.trim() || "";

    // Store the discount flag + email for use on register & checkout
    localStorage.setItem("firstOrderDiscount", "true");
    if (email) localStorage.setItem("ctaEmail", email);

    // Navigate to account page — register side — with email pre-filled
    navigate(`/my-account?register=1&email=${encodeURIComponent(email)}`);

    if (onSubmit) onSubmit(event);
  };

  return (
    <section className="cta-banner" id="cta">
      <div className="cta-content">
        <h2>Ready to Build Your Dream Gym?</h2>
        <p>
          Sign up today and get <strong>10% off</strong> your first order + free shipping.
        </p>
        <form className="cta-form" onSubmit={handleCtaSubmit}>
          <input ref={emailRef} type="email" placeholder="Enter your email address" required />
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

          <form className="contact-form" onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const body = `Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\n${formData.get('message')}`;
            window.location.href = `mailto:sales@sportsway.com?subject=${encodeURIComponent(formData.get('subject') || 'Contact Form')}&body=${encodeURIComponent(body)}`;
            if(onSubmit) onSubmit(event);
          }}>
            <div className="form-row">
              <input type="text" name="name" placeholder="Your Name" required />
              <input type="email" name="email" placeholder="Email Address" required />
            </div>
            <input type="text" name="subject" placeholder="Subject" />
            <textarea name="message" rows="5" placeholder="Your message..." required />
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
