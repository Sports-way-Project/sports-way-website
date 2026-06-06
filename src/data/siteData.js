import { catalogProducts } from "./catalogProducts";
import { asset } from "../lib/assets";

export const navItems = [
  { label: "About Us", href: "about.html" },
  {
    label: "Gym Equipment",
    href: "gym-equipment.html",
    items: [
      { title: "Cardio Equipment", subtitle: "Treadmills, Bikes...", href: "gym-equipment.html#cardio", image: asset("Image/Cardio treadmill.jpg") },
      { title: "Strength Machines", subtitle: "Professional Units", href: "gym-equipment.html#strength", image: asset("Image/Strength Machines.jpg") },
      { title: "Racks & Benches", subtitle: "Power Cages & Benches", href: "gym-equipment.html#racks-benches", image: asset("Image/Racks and Benches.jpg") },
      { title: "Bars & Weights", subtitle: "Barbells & Plates", href: "gym-equipment.html#bars-weights", image: asset("Image/Bars & Weights.jpg") },
      { title: "Accessories", subtitle: "Mats, Bands...", href: "gym-equipment.html#accessories", image: asset("Image/Gym Accessories.jpg") },
      { title: "Boxing Gear", subtitle: "Bags & Gloves", href: "gym-equipment.html#boxing", image: asset("Image/Boxing.jpg") },
    ],
  },
  {
    label: "Sports Tools",
    href: "sports-tools.html",
    items: [
      { title: "Football", subtitle: "Balls", href: "sports-tools.html#football", image: asset("Image/Football.jpg") },
      { title: "Basketball", subtitle: "Balls", href: "sports-tools.html#basketball", image: asset("Image/Basketball.jpeg") },
      { title: "Volleyball", subtitle: "Balls", href: "sports-tools.html#volleyball", image: asset("Image/Volleyball.jpeg") },
      { title: "Training Tools", subtitle: "Agility & Speed", href: "sports-tools.html#training", image: asset("Image/Training Tools Sports.jpeg") },
      { title: "Indoor Sports", subtitle: "Table Tennis, Billiards", href: "sports-tools.html#indoor", image: asset("Image/Table Tennis Indoor Sports.jpeg") },
      { title: "Other Sports", subtitle: "Tennis, Badminton", href: "sports-tools.html#other", image: asset("Image/Tennis Other Sports.jpeg") },
      { title: "Sports Accessories", subtitle: "Bags, Bottles...", href: "sports-tools.html#Sports%20Accessories", image: asset("Image/Sports Accessories.jpg") },
    ],
  },
  {
    label: "Sportswear",
    href: "sportswear.html",
    items: [
      { title: "Mens", subtitle: "Polo Shirts, Tracksuits", href: "sportswear.html#mens", image: asset("Image/Gents Sportswear.jpg") },
      { title: "Ladies", subtitle: "Tshirts, Skirts", href: "sportswear.html#ladies", image: asset("Image/ladies sportswear.jpg") },
      { title: "Kids", subtitle: "Sports Set, Pants", href: "sportswear.html#kids", image: asset("Image/kids sportswear.jpg") },
    ],
  },
  {
    label: "Footwear",
    href: "footwear.html",
    items: [
      { title: "Mens", subtitle: "Running, Football...", href: "footwear.html#mens", image: asset("Image/Mens Shoe Qatar.jpg") },
      { title: "Ladies", subtitle: "Running, Training...", href: "footwear.html#ladies", image: asset("Image/Ladies Shoe Qatar.jpg") },
      { title: "Kids", subtitle: "Comfort & Speed", href: "footwear.html#kids", image: asset("Image/Kids Shoe Qatar.jpg") },
    ],
  },
  {
    label: "Supplements",
    href: "supplements.html",
    items: [
      { title: "Protein", subtitle: "Whey & Isolate", href: "supplements.html#protein", image: asset("Image/Protein.jpg") },
      { title: "Creatine", subtitle: "Performance", href: "supplements.html#creatine", image: asset("Image/Creatine.jpg") },
      { title: "Pre-Workout", subtitle: "Energy & Focus", href: "supplements.html#preworkout", image: asset("Image/Preworkout.jpg") },
      { title: "Vitamins", subtitle: "Vitamins & Health", href: "supplements.html#vitamins", image: asset("Image/Vitamins.jpg") },
      { title: "Minerals", subtitle: "Minerals & Health", href: "supplements.html#minerals", image: asset("Image/Minerals.jpg") },
      { title: "Fat Burner", subtitle: "Fatburner & Health", href: "supplements.html#fatburner", image: asset("Image/Fat burner.jpg") },
    ],
  },
  {
    label: "Flooring",
    href: "flooring.html",
    items: [
      { title: "Gym Mats", subtitle: "Rubber, Grass, Vinyl...", href: "flooring.html#gym-mats", image: asset("Image/Gym Flooring.jpg") },
      { title: "Sports Flooring", subtitle: "Indoor & Outdoor", href: "flooring.html#sports-flooring", image: asset("Image/Sports Flooring.jpg") },
    ],
  },
  { label: "Blog", href: "blog.html" },
  { label: "Contact Us", href: "contact.html" },
];

export const heroSlides = [
  {
    badge: "\uD83D\uDD25 New Arrivals 2026",
    title: ["Train Like a", "Champion"],
    description: "Premium gym & sports equipment built for performance. Cardio, strength & more.",
    primary: "Shop Now",
    primaryHref: "gym-equipment.html",
    secondary: "View Categories",
    secondaryHref: "#categories",
    image: asset("Image/Sportsway Gym equipment.jpg"),
  },
  {
    badge: "\uD83D\uDC55 Premium Collection",
    title: ["Wear Your", "Game"],
    description: "Tracksuits, jerseys & performance wear for Men, Ladies & Kids.",
    primary: "Shop Sportswear",
    primaryHref: "sportswear.html",
    secondary: "View All",
    secondaryHref: "sportswear.html",
    image: asset("Image/Sportsway Sportswear.webp"),
  },
  {
    badge: "\u26BD Essential Gear",
    title: ["Tools For", "Victory"],
    description: "Balls, rackets, training tools & sports bags. Everything you need to play.",
    primary: "Shop Training Tools",
    primaryHref: "sports-tools.html",
    secondary: "View All",
    secondaryHref: "sports-tools.html",
    image: asset("Image/Sportsway Training Tools.jpg"),
  },
  {
    badge: "\uD83E\uDDF1 Professional Surface",
    title: ["Build Your", "Foundation"],
    description: "Premium rubber tiles, artificial turf & gym mats for professional setups.",
    primary: "Explore Flooring",
    primaryHref: "flooring.html",
    secondary: "View All",
    secondaryHref: "flooring.html",
    image: asset("Image/Sportsway FLOORING.jpg"),
  },
  {
    badge: "\uD83D\uDCAA Top Nutrition Brands",
    title: ["Fuel Your", "Potential"],
    description: "Protein, creatine, pre-workout & vitamins. Everything your body needs.",
    primary: "Shop Supplements",
    primaryHref: "supplements.html",
    secondary: "View All",
    secondaryHref: "supplements.html",
    image: asset("Image/SportsWay Supplements.jpg"),
  },
];

export const marqueeItems = [
  { label: "Cardio Equipment", href: "gym-equipment.html#cardio" },
  { label: "Strength Machines", href: "gym-equipment.html#strength" },
  { label: "Racks & Benches", href: "gym-equipment.html#racks" },
  { label: "Bars & Weights", href: "gym-equipment.html#bars" },
  { label: "Gym Accessories", href: "gym-equipment.html#tools" },
  { label: "Bags", href: "sports-tools.html#bags" },
  { label: "Balls", href: "sports-tools.html#balls" },
  { label: "Socks", href: "sportswear.html#socks" },
  { label: "Caps", href: "sportswear.html#caps" },
  { label: "Rackets", href: "sports-tools.html#rackets" },
  { label: "Gloves", href: "sports-tools.html#gloves" },
  { label: "Protector", href: "sports-tools.html#protector" },
  { label: "Bottles", href: "sports-tools.html#bottles" },
  { label: "Training Tools", href: "sports-tools.html#training" },
];

export const categories = [
  {
    title: "Cardio Equipment",
    href: "gym-equipment.html#cardio",
    description: "Treadmills, ellipticals, bikes, rowers, stairs",
    count: "128 products",
    image: asset("Image/cat_cardio.webp"),
  },
  {
    title: "Gym Accessories",
    href: "gym-equipment.html#accessories",
    description: "Gloves, bands, mats, balls, bags & more",
    count: "95 products",
    image: asset("Image/cat_accessories.webp"),
  },
  {
    title: "Supplements",
    href: "supplements.html",
    description: "Protein, creatine, pre-workout, vitamins & more",
    count: "64 products",
    image: asset("Image/Supplements Qatar.webp"),
  },
  {
    title: "Gym Flooring",
    href: "flooring.html",
    description: "Rubber mats, grass, vinyl & sports flooring",
    count: "48 products",
    image: asset("Image/Flooring Qatar.jpg"),
  },
  {
    title: "Indoor Games",
    href: "sports-tools.html#indoor",
    description: "Table tennis, billiards, foosball & darts",
    count: "34 products",
    image: asset("Image/indoor games category.webp"),
  },
  {
    title: "Football",
    href: "sports-tools.html#football",
    description: "Footballs, goal posts, shin guards & boots",
    count: "115 products",
    image: asset("Image/cat_football.webp"),
  },
  {
    title: "Mens Sportswear",
    href: "sportswear.html#mens",
    description: "Tracksuits, T-shirts, shorts & performance wear",
    count: "180 products",
    image: asset("Image/Sports Wear Category.webp"),
  },
  {
    title: "Training Tools",
    href: "sports-tools.html#training",
    description: "Agility ladders, cones, resistance bands & jump ropes",
    count: "82 products",
    image: asset("Image/Training Tools Qatar.jpg"),
  },
];

export const filters = ["all", "cardio", "strength", "accessories", "sportswear", "footwear", "supplements", "sports-tools", "flooring"];

export const products = catalogProducts
  .filter((product) => product.featured)
  .slice(0, 18)
  .map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice,
    badge: product.badge,
    image: product.image || product.img,
  }));

export const features = [
  { icon: "\uD83C\uDFC6", title: "Premium Quality", description: "Every product meets rigorous quality standards and comes with a 2-year manufacturer warranty." },
  { icon: "\uD83D\uDE9A", title: "Fast Shipping", description: "Free delivery on orders over $99. Most orders arrive within 2-3 business days." },
  { icon: "\uD83D\uDCAA", title: "Expert Advice", description: "Our team of certified fitness trainers are here to help you choose the right equipment." },
  { icon: "\uD83D\uDD04", title: "Easy Returns", description: "Not happy? Return any product within 30 days, no questions asked. Full refund guaranteed." },
  { icon: "\uD83D\uDCB0", title: "Best Price Match", description: "We match any lower price found elsewhere. Get the best deal every time, guaranteed." },
  { icon: "\uD83C\uDFA7", title: "24/7 Support", description: "Our support team is available around the clock via chat, email, or phone to help you." },
];

export const testimonials = [
  { quote: "The treadmill arrived quickly and the quality is outstanding. My whole home gym is now from Sports Way!", name: "Michael T.", role: "Home Gym Enthusiast", avatar: "M" },
  { quote: "Best sports equipment store online. The prices are unbeatable and customer support is amazing. Highly recommend.", name: "Sarah K.", role: "Personal Trainer", avatar: "S", featured: true },
  { quote: "Been buying from Sports Way for 3 years. Never had a single issue. Top-notch products every single time.", name: "Ahmed R.", role: "CrossFit Athlete", avatar: "A" },
  { quote: "Sports Way is my go-to for quality equipment in Qatar. The installation service was seamless and very professional!", name: "Fatima H.", role: "Yoga Instructor", avatar: "F" },
  { quote: "The commercial rack is a beast. Extremely sturdy and premium finish. Best investment for my garage gym.", name: "Khalid S.", role: "Strength Coach", avatar: "K" },
  { quote: "Impressive supplement range and the fastest delivery I've experienced in Doha. Highly satisfied with the service.", name: "Noora A.", role: "Fitness Enthusiast", avatar: "N" },
];

export const contacts = [
  { icon: "\uD83D\uDCDE", title: "Phone", lines: ["+974 3996 3997", "+974 4142 2728"] },
  { icon: "\u2709\uFE0F", title: "Email", lines: ["sales@sports-way.com"] },
  { icon: "\uD83D\uDCCD", title: "Address", lines: ["Zone 53, Street 740 - Al Rayyan - Building 81,", "2nd floor office 47, Doha, Qatar"] },
  { icon: "\uD83D\uDD50", title: "Working Hours", lines: ["Saturday - Thursday: 9am - 5pm"] },
];

export const footerSocials = [
  { label: "Instagram", short: "IG", href: "https://www.instagram.com/sportsway.qtr/" },
  { label: "Facebook", short: "FB", href: "https://www.facebook.com/sportsway.qtr/" },
  { label: "TikTok", short: "TT", href: "https://www.tiktok.com/@sportsway.qtr" },
  { label: "YouTube", short: "YT", href: "https://www.youtube.com/@sportswayqtr" },
  { label: "X", short: "X", href: "https://x.com/sportswayqtr" },
  { label: "LinkedIn", short: "IN", href: "https://www.linkedin.com/company/sports-way-trading/" },
];

export const pageLinks = [
  { label: "Gym Equipment", href: "gym-equipment.html" },
  { label: "Sports Tools", href: "sports-tools.html" },
  { label: "Sportswear", href: "sportswear.html" },
  { label: "Footwear", href: "footwear.html" },
  { label: "Supplements", href: "supplements.html" },
  { label: "Flooring", href: "flooring.html" },
  { label: "About Us", href: "about.html" },
  { label: "Blog", href: "blog.html" },
  { label: "Contact Us", href: "contact.html" },
  { label: "Wholesale", href: "wholesale.html" },
  { label: "My Account", href: "my-account.html" },
  { label: "Cart", href: "cart.html" },
  { label: "Checkout", href: "checkout.html" },
];

export const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 13) % 100}%`,
  delay: `${(index % 6) * 1.1}s`,
  duration: `${8 + (index % 5) * 2}s`,
}));
