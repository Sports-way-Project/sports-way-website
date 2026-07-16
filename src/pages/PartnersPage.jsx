import { useEffect, useState } from "react";
import { fetchPartners } from "../lib/storefrontApi";
import { Link } from "react-router-dom";

import { PageHero } from "../components/PageHero";
import { asset } from "../lib/assets";

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    document.title = "Our Partners - Sports Way Trading";
    fetchPartners().then(setPartners).catch(console.error);
  }, []);

  return (
    <>
      <PageHero
        title="Our Partners"
        description="Collaborating with the world's leading sports and fitness brands to bring you the best equipment available."
        image={asset("Image/Gym Accessories.jpg")}
      />
      <div className="page-container page-transition" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {partners.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", justifyContent: "center" }}>
          {partners.map((p, i) => (
            <div key={i} style={{ padding: "15px", background: "#f5f5f5", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", width: "260px" }}>
              <img src={p.image} alt={p.name || "Partner"} style={{ width: "100%", height: "160px", objectFit: "contain", marginBottom: "15px", mixBlendMode: "multiply" }} />
              {p.name && <h3 style={{ fontSize: "1.1em", fontWeight: "600", textAlign: "center", margin: 0 }}>{p.name}</h3>}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666", fontSize: "1.2em", margin: "40px 0" }}>No partners to display at the moment.</p>
      )}
    </div>
    </>
  );
}
