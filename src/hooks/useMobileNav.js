import { useEffect, useState } from "react";

export function useMobileNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState("");

  useEffect(() => {
    const closeMenu = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
        setOpenMobileDropdown("");
      }
    };

    window.addEventListener("resize", closeMenu);
    return () => window.removeEventListener("resize", closeMenu);
  }, []);

  return {
    mobileMenuOpen,
    openMobileDropdown,
    setMobileMenuOpen,
    setOpenMobileDropdown,
  };
}
