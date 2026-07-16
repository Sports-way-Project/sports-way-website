import { Helmet } from "react-helmet-async";

export function SEO({ 
  title = "Sports Way | Premium Sports & Gym Equipment in Qatar", 
  description = "Shop premium sports equipment, gym flooring, supplements and sportswear at Sports Way Qatar. Best prices, fast delivery.", 
  image = "https://www.sports-way.com/logo.png",
  url = "https://www.sports-way.com",
  type = "website",
  product = null 
}) {
  const schemaOrg = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image || product.img,
    "description": product.description || description,
    "brand": {
      "@type": "Brand",
      "name": "Sports Way"
    },
    "offers": {
      "@type": "Offer",
      "url": url,
      "priceCurrency": "QAR",
      "price": product.price,
      "availability": product.in_stock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Sports Way"
      }
    }
  } : {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Sports Way",
    "image": "https://www.sports-way.com/logo.png",
    "url": "https://www.sports-way.com",
    "telephone": "+974 3996 3997",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Zone 53, Street 740 - Al Rayyan - Building 81, 2nd floor office 47",
      "addressLocality": "Doha",
      "addressCountry": "QA"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.sports-way.com"
      },
      ...(product ? [
        {
          "@type": "ListItem",
          "position": 2,
          "name": product.category.replace("-", " "),
          "item": `https://www.sports-way.com/categories/${product.category}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": url
        }
      ] : [])
    ]
  };

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Multilingual SEO */}
      <link rel="alternate" href={url} hrefLang="en" />
      <link rel="alternate" href={url} hrefLang="ar" />
      <link rel="alternate" href={url} hrefLang="x-default" />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Google Search Console Verification Placeholder */}
      <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE_HERE" />

      {/* Schema Markup */}
      <script type="application/ld+json">{JSON.stringify(schemaOrg)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
    </Helmet>
  );
}
