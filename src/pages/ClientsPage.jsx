import { useEffect, useState } from "react";
import { fetchClients } from "../lib/storefrontApi";
import { Link } from "react-router-dom";

import { PageHero } from "../components/PageHero";
import { asset } from "../lib/assets";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    document.title = "Our Clients - Sports Way Trading";
    fetchClients().then(setClients).catch(console.error);
  }, []);

  return (
    <>
      <PageHero
        title="Our Clients"
        description="We are proud to supply premium fitness equipment to Qatar's top commercial gyms, hotels, and corporate wellness centers."
        image={asset("Image/GYM AND SPORTS.jpg")}
      />
      <div className="page-container page-transition" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {clients.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", justifyContent: "center" }}>
          {clients.map((c, i) => (
            <div key={i} style={{ padding: "15px", background: "#f5f5f5", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", width: "260px" }}>
              <img src={c.image} alt={c.name || "Client"} style={{ width: "100%", height: "160px", objectFit: "contain", marginBottom: "15px", mixBlendMode: "multiply" }} />
              {c.name && <h3 style={{ fontSize: "1.1em", fontWeight: "600", textAlign: "center", margin: 0 }}>{c.name}</h3>}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#666", fontSize: "1.2em", margin: "40px 0" }}>No clients to display at the moment.</p>
      )}
    </div>
    </>
  );
}
