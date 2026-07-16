import { useEffect } from "react";
import { SEO } from "../components/SEO";

export function PrivacyPage() {
  useEffect(() => {
    document.title = "Privacy Policy - Sports Way Trading Qatar";
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO title="Privacy Policy | Sports Way" description="Sports Way Trading Privacy Policy" url="https://www.sports-way.com/privacy" />
      <div className="container" style={{ maxWidth: "800px", margin: "60px auto", color: "var(--text)", lineHeight: "1.8" }}>
        <h1 style={{ marginBottom: "20px" }}>Privacy Policy</h1>
        <p>At Sports Way Trading, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you visit our website or make a purchase.</p>
        
        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>1. Information We Collect</h2>
        <p>When you visit our site, register an account, or place an order, we may collect personal information such as your name, email address, phone number, shipping address, and payment details. We also collect non-personal data such as your IP address and browsing behavior to improve our services.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>2. How We Use Your Information</h2>
        <p>We use your information to process transactions, deliver products, communicate with you about your orders, and provide customer support. With your consent, we may also send you promotional emails about new products or special offers.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>3. Data Security</h2>
        <p>We implement strict security measures to protect your personal information. All payment transactions are processed through secure, encrypted payment gateways. We do not store your credit card information on our servers.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>4. Third-Party Services</h2>
        <p>We may share your information with trusted third-party service providers (such as shipping companies and payment processors) solely for the purpose of fulfilling your orders. These providers are obligated to keep your information confidential.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>5. Cookies</h2>
        <p>Our website uses cookies to enhance your browsing experience, remember your cart items, and analyze site traffic. You can choose to disable cookies in your browser settings, though this may affect site functionality.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>6. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information at any time. You can manage your information through your account settings or by contacting our support team.</p>

        <p style={{ marginTop: "40px", fontSize: "0.9rem", color: "var(--text-muted)" }}>Last updated: {new Date().getFullYear()}</p>
      </div>
    </>
  );
}
