import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        admin: resolve(process.cwd(), "admin.html"),
        about: resolve(process.cwd(), "about.html"),
        blog: resolve(process.cwd(), "blog.html"),
        cart: resolve(process.cwd(), "cart.html"),
        checkout: resolve(process.cwd(), "checkout.html"),
        contact: resolve(process.cwd(), "contact.html"),
        flooring: resolve(process.cwd(), "flooring.html"),
        footwear: resolve(process.cwd(), "footwear.html"),
        gymEquipment: resolve(process.cwd(), "gym-equipment.html"),
        myAccount: resolve(process.cwd(), "my-account.html"),
        orderSuccess: resolve(process.cwd(), "order-success.html"),
        product: resolve(process.cwd(), "product.html"),
        sportsTools: resolve(process.cwd(), "sports-tools.html"),
        sportswear: resolve(process.cwd(), "sportswear.html"),
        supplements: resolve(process.cwd(), "supplements.html"),
        wholesale: resolve(process.cwd(), "wholesale.html"),
      },
    },
  },
});
