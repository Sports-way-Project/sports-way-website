import { useEffect } from "react";
import { SEO } from "../components/SEO";

export function TermsOfServicePage() {
  useEffect(() => {
    document.title = "Terms of Service - Sports Way Trading Qatar";
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEO title="Terms of Service | Sports Way" description="Sports Way Trading Terms of Service" url="https://www.sports-way.com/terms-of-service" />
      <div className="container" style={{ maxWidth: "800px", margin: "60px auto", color: "var(--text)", lineHeight: "1.8" }}>
        <h1 style={{ marginBottom: "20px" }}>Terms of Service</h1>
        <p>Welcome to Sports Way Trading. By accessing our website and using our services, you agree to be bound by the following Terms of Service. Please read them carefully.</p>
        
        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>1. General Conditions</h2>
        <p>We reserve the right to refuse service to anyone for any reason at any time. You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service, use of the Service, or access to the Service without our express written permission.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>2. Products and Pricing</h2>
        <p>Certain products or services may be available exclusively online through our website. These products or services may have limited quantities and are subject to return or exchange only according to our Return Policy. Prices for our products are subject to change without notice.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>3. Order Cancellation and Refusal</h2>
        <p>We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. In the event that we make a change to or cancel an order, we will notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>4. Accuracy of Billing and Account Information</h2>
        <p>You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store. You agree to promptly update your account and other information, including your email address and credit card numbers and expiration dates, so that we can complete your transactions and contact you as needed.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>5. Warranties and Limitation of Liability</h2>
        <p>We do not guarantee, represent, or warrant that your use of our service will be uninterrupted, timely, secure, or error-free. You expressly agree that your use of, or inability to use, the service is at your sole risk. All products and services delivered to you are provided 'as is' and 'as available' for your use.</p>

        <h2 style={{ marginTop: "40px", marginBottom: "15px" }}>6. Governing Law</h2>
        <p>These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of the State of Qatar.</p>

        <p style={{ marginTop: "40px", fontSize: "0.9rem", color: "var(--text-muted)" }}>Last updated: {new Date().getFullYear()}</p>
      </div>
    </>
  );
}
