import { useEffect } from "react";
import { SEO } from "../components/SEO";
import { PageHero } from "../components/PageHero";

export function TermsPage() {
  useEffect(() => {
    document.title = "Terms & Conditions - Sports Way Trading Qatar";
  }, []);

  return (
    <>
      <SEO title="Terms & Conditions | Sports Way" description="Sports Way Trading Terms and Conditions" url="https://www.sports-way.com/terms" />
      <PageHero
        title="Terms & Conditions"
        description="Please read these terms and conditions carefully before using our website or purchasing our products."
      />
      <div className="container terms-page" style={{ padding: "40px 0", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6" }}>
        <p>Welcome to <strong>Sports Way Trading</strong>.</p>
        <p>These Terms and Conditions govern your use of our website and the purchase of products and services from Sports Way Trading. By accessing this website or placing an order, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these Terms, please discontinue use of the website immediately.</p>
        <p>Sports Way Trading is a supplier of sports equipment, sports flooring, gym equipment, gym flooring, artificial grass, sportswear, training tools, playground equipment, and related products and services in Qatar.</p>

        <h2>Definitions</h2>
        <p>Throughout these Terms and Conditions:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li><strong>"Customer," "You," and "Your"</strong> refer to any person accessing or using this website.</li>
          <li><strong>"Sports Way Trading," "Company," "We," "Our," and "Us"</strong> refer to Sports Way Trading.</li>
          <li><strong>"Website"</strong> refers to the Sports Way Trading website and all associated online services.</li>
        </ul>

        <h2>Website Use</h2>
        <p>By using this website, you confirm that:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>You are at least 18 years of age or are using the website under the supervision of a parent or legal guardian.</li>
          <li>All information provided by you is accurate, complete, and up to date.</li>
          <li>You will use the website only for lawful purposes.</li>
        </ul>
        <p>We reserve the right to refuse service, terminate accounts, or cancel orders if we believe a user has violated these Terms and Conditions.</p>

        <h2>Cookies</h2>
        <p>Our website uses cookies to improve functionality, enhance user experience, and analyze website performance.</p>
        <p>By continuing to use our website, you consent to the use of cookies in accordance with our Privacy Policy.</p>

        <h2>Intellectual Property Rights</h2>
        <p>Unless otherwise stated, all content on this website, including but not limited to:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Logos</li>
          <li>Trademarks</li>
          <li>Product Images</li>
          <li>Graphics</li>
          <li>Videos</li>
          <li>Documents</li>
          <li>Website Design</li>
          <li>Text Content</li>
        </ul>
        <p>is the exclusive property of Sports Way Trading or its licensors and is protected by applicable intellectual property laws.</p>
        <p>You may not:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Republish website content.</li>
          <li>Copy or reproduce website content.</li>
          <li>Sell, rent, sublicense, or distribute website content.</li>
          <li>Use our trademarks, logos, or branding without written permission.</li>
        </ul>

        <h2>Product Information</h2>
        <p>We strive to ensure that all product descriptions, specifications, images, and pricing are accurate. However, errors may occasionally occur.</p>
        <p>Sports Way Trading reserves the right to:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Correct errors or inaccuracies.</li>
          <li>Update product information.</li>
          <li>Change product specifications without prior notice.</li>
          <li>Discontinue products at any time.</li>
        </ul>
        <p>Product images are for illustration purposes only and may differ slightly from the actual product.</p>

        <h2>Pricing</h2>
        <p>All prices displayed on the website are in <strong>Qatari Riyals (QAR)</strong> unless otherwise stated.</p>
        <p>Prices are subject to change without notice.</p>
        <p>Additional charges may apply for:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Delivery</li>
          <li>Installation</li>
          <li>Customization</li>
          <li>Special orders</li>
        </ul>
        <p>Any applicable charges will be communicated before order confirmation.</p>

        <h2>Orders and Payments</h2>
        <p>By placing an order, you agree that:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>All information provided is accurate.</li>
          <li>Payment details are valid and authorized.</li>
          <li>Orders are subject to stock availability and acceptance.</li>
        </ul>
        <p>Sports Way Trading reserves the right to refuse or cancel orders due to:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Pricing errors</li>
          <li>Product unavailability</li>
          <li>Payment issues</li>
          <li>Suspected fraudulent activity</li>
          <li>Any other legitimate business reason</li>
        </ul>

        <h2>Delivery and Installation</h2>
        <p>Estimated delivery dates are provided for guidance only and are not guaranteed.</p>
        <p>Delivery and installation schedules may be affected by:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Product availability</li>
          <li>Weather conditions</li>
          <li>Customs clearance</li>
          <li>Transportation delays</li>
          <li>Site readiness</li>
        </ul>
        <p>Customers are responsible for providing accurate delivery information and ensuring site accessibility for installation teams.</p>
        <p>Sports Way Trading shall not be liable for delays beyond its reasonable control.</p>

        <h2>Returns and Refunds</h2>
        <h3>Return Eligibility</h3>
        <p>Products may be returned within <strong>7 days</strong> of delivery provided that:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>The product is unused.</li>
          <li>The product remains in its original packaging.</li>
          <li>The product is in resalable condition.</li>
          <li>Proof of purchase is provided.</li>
        </ul>
        <p>Customers must report damaged, defective, or incorrect products within <strong>24 hours</strong> of delivery.</p>

        <h3>Non-Returnable Products</h3>
        <p>The following items are non-refundable and non-returnable:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Installed sports flooring</li>
          <li>Installed gym flooring</li>
          <li>Installed artificial grass</li>
          <li>Customized products</li>
          <li>Printed team uniforms</li>
          <li>Special-order products</li>
          <li>Products damaged through misuse or negligence</li>
          <li>Installation and labor services</li>
        </ul>
        <p>Once flooring systems, artificial grass, playground equipment, gym equipment, or similar products have been installed, they are deemed accepted by the customer and are not eligible for return or refund.</p>

        <h3>Defective Products</h3>
        <p>Products found to have manufacturing defects may be repaired, replaced, or refunded at the sole discretion of Sports Way Trading after inspection.</p>

        <h2>Refund Processing</h2>
        <p>Approved refunds will be processed within <strong>7–14 business days</strong> after inspection and approval of the returned product.</p>
        <p>Refunds will be issued through the original payment method whenever possible.</p>
        <p>Shipping, delivery, installation, and service charges are non-refundable unless otherwise agreed in writing.</p>

        <h2>Warranty</h2>
        <p>Certain products may be covered by manufacturer warranties.</p>
        <p>Warranty coverage does not include:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Normal wear and tear</li>
          <li>Improper installation by third parties</li>
          <li>Misuse or abuse</li>
          <li>Accidental damage</li>
          <li>Unauthorized repairs or modifications</li>
          <li>Failure to follow maintenance guidelines</li>
        </ul>
        <p>Warranty claims are subject to inspection and manufacturer approval where applicable.</p>

        <h2>User Reviews and Comments</h2>
        <p>Users may submit reviews, comments, and feedback through our website or business profiles.</p>
        <p>By submitting content, you confirm that:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>You have the legal right to submit the content.</li>
          <li>The content is accurate and lawful.</li>
          <li>The content does not infringe any third-party rights.</li>
          <li>The content is not abusive, misleading, defamatory, or offensive.</li>
        </ul>
        <p>Sports Way Trading reserves the right to remove any content that violates these Terms.</p>

        <h2>Hyperlinking</h2>
        <p>Organizations may link to our website provided that:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>The link is not misleading.</li>
          <li>The link does not imply endorsement or sponsorship.</li>
          <li>The link is appropriate within the context of the linking website.</li>
        </ul>
        <p>We reserve the right to request the removal of any link to our website at any time.</p>

        <h2>Third-Party Websites</h2>
        <p>Our website may contain links to third-party websites.</p>
        <p>Sports Way Trading is not responsible for the content, accuracy, privacy practices, or policies of third-party websites.</p>

        <h2>Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, Sports Way Trading shall not be liable for:</p>
        <ul style={{ paddingLeft: "20px", marginBottom: "20px" }}>
          <li>Indirect losses</li>
          <li>Consequential damages</li>
          <li>Loss of profits</li>
          <li>Business interruption</li>
          <li>Loss of data</li>
          <li>Delays caused by third parties</li>
        </ul>
        <p>Our total liability for any claim shall not exceed the amount paid by the customer for the relevant product or service.</p>

        <h2>Privacy</h2>
        <p>Personal information collected through our website will be handled in accordance with our Privacy Policy.</p>
        <p>We are committed to protecting customer data and maintaining confidentiality.</p>

        <h2>Governing Law</h2>
        <p>These Terms and Conditions shall be governed by and interpreted in accordance with the laws of the State of Qatar.</p>
        <p>Any disputes arising from these Terms and Conditions shall be subject to the exclusive jurisdiction of the courts of Qatar.</p>

        <h2>Changes to These Terms</h2>
        <p>Sports Way Trading reserves the right to modify or update these Terms and Conditions at any time without prior notice.</p>
        <p>Changes become effective immediately upon publication on the website. Continued use of the website constitutes acceptance of the revised Terms.</p>

        <h2>Contact Information</h2>
        <p>
          <strong>Sports Way Trading</strong><br />
          Doha, Qatar<br />
          <strong>Phone:</strong> +974 3996 3997<br />
          <strong>Email:</strong> <a href="mailto:sales@sports-way.com" style={{ textDecoration: "underline" }}>sales@sports-way.com</a><br />
          <strong>Website:</strong> <a href="http://www.sports-way.com" style={{ textDecoration: "underline" }}>www.sports-way.com</a>
        </p>
      </div>
    </>
  );
}
