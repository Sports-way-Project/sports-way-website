export function Footer({ footerSocials, hiddenCategories = [] }) {
  const show = (category) => !hiddenCategories.includes(category);
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              <img src="/logo.png" alt="Sports Way Trading" className="footer-logo-img" />
            </div>
            <p>Your one-stop shop for premium sports and fitness equipment in Qatar since 2020.</p>
            <div className="social-links">
              {footerSocials.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="social-link">
                  {social.short}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-col">
            <h4>Products</h4>
            <ul>
              {show("gym-equipment") ? <li><a href="gym-equipment.html">Gym Equipment</a></li> : null}
              {show("sportswear") ? <li><a href="sportswear.html">Sportswear</a></li> : null}
              {show("footwear") ? <li><a href="footwear.html">Footwear</a></li> : null}
              {show("supplements") ? <li><a href="supplements.html">Supplements</a></li> : null}
              {show("flooring") ? <li><a href="flooring.html">Flooring</a></li> : null}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="about.html">About Us</a></li>
              <li><a href="blog.html">Blog</a></li>
              <li><a href="wholesale.html">Wholesale</a></li>
              <li><a href="contact.html">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="tel:+97439963997">+974 3996 3997</a></li>
              <li><a href="tel:+97441422728">+974 4142 2728</a></li>
              <li><a href="mailto:info@sports-way.com">info@sports-way.com</a></li>
              <li><a href="contact.html">Zone 53, Al Rayyan, Doha</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom" id="footer">
          <p>Copyright 2026 Sports Way Trading. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#footer">Privacy Policy</a>
            <a href="#footer">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
