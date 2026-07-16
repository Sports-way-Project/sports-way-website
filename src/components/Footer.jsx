export function Footer({ footerSocials, hiddenCategories = [] }) {
  const show = (category) => !hiddenCategories.includes(category);
  
  const SocialIcon = ({ name }) => {
    switch (name.toLowerCase()) {
      case 'instagram':
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
      case 'facebook':
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
      case 'tiktok':
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a8 8 0 0 1-5-1.5"/></svg>;
      case 'snapchat':
        return <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M11.83 1.25a6.45 6.45 0 0 0-6.19 6.8c0 1.24.47 2.44 1.15 3.39-1.28.26-2.5.87-3.48 1.76-.32.29-.46.72-.37 1.14.09.43.41.76.83.85.95.2 2.01.27 3.08.27.24.87.52 1.73.85 2.58.33.85.73 1.68 1.18 2.47a2.12 2.12 0 0 0 2.95 1.05 2.1 2.1 0 0 0 1.05-1.05c.45-.79.85-1.62 1.18-2.47.33-.85.61-1.71.85-2.58 1.07 0 2.13-.07 3.08-.27.42-.09.74-.42.83-.85s-.05-.85-.37-1.14a8.4 8.4 0 0 0-3.48-1.76c.68-.95 1.15-2.15 1.15-3.39a6.45 6.45 0 0 0-6.19-6.8z"/></svg>;
      case 'youtube':
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M2.5 7.1A19.5 19.5 0 0 1 12 6c3.5 0 6.9.4 9.5 1.1a2.8 2.8 0 0 1 2 2 24.3 24.3 0 0 1 0 5.8 2.8 2.8 0 0 1-2 2 19.5 19.5 0 0 1-9.5 1.1 19.5 19.5 0 0 1-9.5-1.1 2.8 2.8 0 0 1-2-2 24.3 24.3 0 0 1 0-5.8 2.8 2.8 0 0 1 2-2Z"/><path d="m10 15 5-3-5-3v6Z"/></svg>;
      case 'x':
        return <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>;
      case 'linkedin':
        return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>;
      default:
        return <span>{name}</span>;
    }
  };
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
                  <SocialIcon name={social.label} />
                </a>
              ))}
            </div>
          </div>
          <div className="footer-col">
            <h4>Products</h4>
            <ul>
              {show("gym-equipment") ? <li><a href="/categories/gym-equipment">Gym Equipment</a></li> : null}
              {show("sports-tools") ? <li><a href="/categories/sports-tools">Sports Tools</a></li> : null}
              {show("supplements") ? <li><a href="/categories/supplements">Supplements</a></li> : null}
              {show("flooring") ? <li><a href="/categories/flooring">Flooring</a></li> : null}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/wholesale">Wholesale</a></li>
              <li><a href="/terms">Terms & Conditions</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="tel:+97439963997">+974 3996 3997</a></li>
              <li><a href="tel:+97441422728">+974 4142 2728</a></li>
              <li><a href="mailto:info@sports-way.com">info@sports-way.com</a></li>
              <li><a href="/contact">Zone 53, Al Rayyan, Doha</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom" id="footer">
          <p>Copyright 2026 Sports Way Trading. All rights reserved.</p>
          <div className="footer-legal">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms-of-service">Terms of Service</a>
          </div>
        </div>
      </div>
      
      {/* Global Hidden SEO Keywords Block */}
      <div className="seo-hidden-keywords" aria-hidden="true">
        Best gym equipment in Qatar, premium fitness gear, wholesale sports tools, commercial treadmill, health club setup in Doha, fitness accessories supplier, buy dumbbells Qatar, sports flooring installation, strength training machines, home gym equipment Doha, professional gym setup Qatar.
      </div>
    </footer>
  );
}
