import { catalogProducts } from "./catalogProducts";
import { asset } from "../lib/assets";

export const navItems = [
  { label: "About Us", href: "/about" },
  {
    label: "Gym Equipment",
    href: "/categories/gym-equipment",
    items: [
      { title: "Cardio Equipment", subtitle: "Treadmills, Bikes...", href: "/categories/gym-equipment#cardio", image: asset("Image/Cardio treadmill.jpg") },
      { title: "Strength Machines", subtitle: "Professional Units", href: "/categories/gym-equipment#strength", image: asset("Image/Strength Machines.jpg") },
      { title: "Racks & Benches", subtitle: "Power Cages & Benches", href: "/categories/gym-equipment#racks-benches", image: asset("Image/Racks and Benches.jpg") },
      { title: "Bars & Weights", subtitle: "Barbells & Plates", href: "/categories/gym-equipment#bars-weights", image: asset("Image/Bars & Weights.jpg") },
      { title: "Accessories", subtitle: "Mats, Bands...", href: "/categories/gym-equipment#accessories", image: asset("Image/Gym Accessories.jpg") },
      { title: "Boxing Gear", subtitle: "Bags & Gloves", href: "/categories/gym-equipment#boxing", image: asset("Image/Boxing.jpg") },
    ],
  },
  {
    label: "Sports Tools",
    href: "/categories/sports-tools",
    items: [
      { title: "Football", subtitle: "Balls", href: "/categories/sports-tools#football", image: asset("Image/Football.jpg") },
      { title: "Basketball", subtitle: "Balls", href: "/categories/sports-tools#basketball", image: asset("Image/Basketball.jpeg") },
      { title: "Volleyball", subtitle: "Balls", href: "/categories/sports-tools#volleyball", image: asset("Image/Volleyball.jpeg") },
      { title: "Training Tools", subtitle: "Agility & Speed", href: "/categories/sports-tools#training", image: asset("Image/Training Tools Sports.jpeg") },
      { title: "Indoor Sports", subtitle: "Table Tennis, Billiards", href: "/categories/sports-tools#indoor", image: asset("Image/Table Tennis Indoor Sports.jpeg") },
      { title: "Other Sports", subtitle: "Tennis, Badminton", href: "/categories/sports-tools#other", image: asset("Image/Tennis Other Sports.jpeg") },
      { title: "Sports Accessories", subtitle: "Bags, Bottles...", href: "/categories/sports-tools#Sports%20Accessories", image: asset("Image/Sports Accessories.jpg") },
    ],
  },
  {
    label: "Sportswear",
    href: "/categories/sportswear",
    items: [
      { title: "Mens", subtitle: "Polo Shirts, Tracksuits", href: "/categories/sportswear#mens", image: asset("Image/Gents Sportswear.jpg") },
      { title: "Ladies", subtitle: "Tshirts, Skirts", href: "/categories/sportswear#ladies", image: asset("Image/ladies sportswear.jpg") },
      { title: "Kids", subtitle: "Sports Set, Pants", href: "/categories/sportswear#kids", image: asset("Image/kids sportswear.jpg") },
    ],
  },
  {
    label: "Footwear",
    href: "/categories/footwear",
    items: [
      { title: "Mens", subtitle: "Running, Football...", href: "/categories/footwear#mens", image: asset("Image/Mens Shoe Qatar.jpg") },
      { title: "Ladies", subtitle: "Running, Training...", href: "/categories/footwear#ladies", image: asset("Image/Ladies Shoe Qatar.jpg") },
      { title: "Kids", subtitle: "Comfort & Speed", href: "/categories/footwear#kids", image: asset("Image/Kids Shoe Qatar.jpg") },
    ],
  },
  {
    label: "Flooring",
    href: "/categories/flooring",
    items: [
      { title: "Gym Mats", subtitle: "Rubber, Grass, Vinyl...", href: "/categories/flooring#gym-mats", image: asset("Image/Gym Flooring.jpg") },
      { title: "Sports Flooring", subtitle: "Indoor & Outdoor", href: "/categories/flooring#sports-flooring", image: asset("Image/Sports Flooring.jpg") },
    ],
  },
  {
    label: "Supplements",
    href: "/categories/supplements",
    items: [
      { title: "Protein", subtitle: "Whey & Isolate", href: "/categories/supplements#protein", image: asset("Image/Protein.jpg") },
      { title: "Creatine", subtitle: "Performance", href: "/categories/supplements#creatine", image: asset("Image/Creatine.jpg") },
      { title: "Pre-Workout", subtitle: "Energy & Focus", href: "/categories/supplements#preworkout", image: asset("Image/Preworkout.jpg") },
      { title: "Vitamins", subtitle: "Vitamins & Health", href: "/categories/supplements#vitamins", image: asset("Image/Vitamins.jpg") },
      { title: "Minerals", subtitle: "Minerals & Health", href: "/categories/supplements#minerals", image: asset("Image/Minerals.jpg") },
      { title: "Fat Burner", subtitle: "Fatburner & Health", href: "/categories/supplements#fatburner", image: asset("Image/Fat burner.jpg") },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Clients", href: "/clients" },
  { label: "Partners", href: "/partners" },
  { label: "Contact Us", href: "/contact" },
];

export const heroSlides = [
  {
    badge: "\uD83D\uDD25 New Arrivals 2026",
    title: ["Train Like a", "Champion"],
    description: "Premium gym & sports equipment built for performance. Cardio, strength & more.",
    primary: "Shop Now",
    primaryHref: "/categories/gym-equipment",
    secondary: "View Categories",
    secondaryHref: "#categories",
    image: asset("Image/Sportsway Gym equipment.jpg"),
  },
  {
    badge: "\uD83D\uDC55 Premium Collection",
    title: ["Wear Your", "Game"],
    description: "Tracksuits, jerseys & performance wear for Men, Ladies & Kids.",
    primary: "Shop Sportswear",
    primaryHref: "/categories/sportswear",
    secondary: "View All",
    secondaryHref: "/categories/sportswear",
    image: asset("Image/Sportsway Sportswear.webp"),
  },
  {
    badge: "\u26BD Essential Gear",
    title: ["Tools For", "Victory"],
    description: "Balls, rackets, training tools & sports bags. Everything you need to play.",
    primary: "Shop Training Tools",
    primaryHref: "/categories/sports-tools",
    secondary: "View All",
    secondaryHref: "/categories/sports-tools",
    image: asset("Image/Sportsway Training Tools.jpg"),
  },
  {
    badge: "\uD83E\uDDF1 Professional Surface",
    title: ["Build Your", "Foundation"],
    description: "Premium rubber tiles, artificial turf & gym mats for professional setups.",
    primary: "Explore Flooring",
    primaryHref: "/categories/flooring",
    secondary: "View All",
    secondaryHref: "/categories/flooring",
    image: asset("Image/Sportsway FLOORING.jpg"),
  },
  {
    badge: "\uD83D\uDCAA Top Nutrition Brands",
    title: ["Fuel Your", "Potential"],
    description: "Protein, creatine, pre-workout & vitamins. Everything your body needs.",
    primary: "Shop Supplements",
    primaryHref: "/categories/supplements",
    secondary: "View All",
    secondaryHref: "/categories/supplements",
    image: asset("Image/SportsWay Supplements.jpg"),
  },
];

export const marqueeItems = [
  { label: "Cardio Equipment", href: "/categories/gym-equipment#cardio" },
  { label: "Strength Machines", href: "/categories/gym-equipment#strength" },
  { label: "Racks & Benches", href: "/categories/gym-equipment#racks" },
  { label: "Bars & Weights", href: "/categories/gym-equipment#bars" },
  { label: "Gym Accessories", href: "/categories/gym-equipment#tools" },
  { label: "Bags", href: "/categories/sports-tools#bags" },
  { label: "Balls", href: "/categories/sports-tools#balls" },
  { label: "Socks", href: "/categories/sportswear#socks" },
  { label: "Caps", href: "/categories/sportswear#caps" },
  { label: "Rackets", href: "/categories/sports-tools#rackets" },
  { label: "Gloves", href: "/categories/sports-tools#gloves" },
  { label: "Protector", href: "/categories/sports-tools#protector" },
  { label: "Bottles", href: "/categories/sports-tools#bottles" },
  { label: "Training Tools", href: "/categories/sports-tools#training" },
];

export const categories = [
  {
    title: "Cardio Equipment",
    href: "/categories/gym-equipment#cardio",
    description: "Treadmills, ellipticals, bikes, rowers, stairs",
    count: "128 products",
    image: asset("Image/cat_cardio.webp"),
  },
  {
    title: "Gym Accessories",
    href: "/categories/gym-equipment#accessories",
    description: "Gloves, bands, mats, balls, bags & more",
    count: "95 products",
    image: asset("Image/cat_accessories.webp"),
  },
  {
    title: "Supplements",
    href: "/categories/supplements",
    description: "Protein, creatine, pre-workout, vitamins & more",
    count: "64 products",
    image: asset("Image/Supplements Qatar.webp"),
  },
  {
    title: "Gym Flooring",
    href: "/categories/flooring",
    description: "Rubber mats, grass, vinyl & sports flooring",
    count: "48 products",
    image: asset("Image/Flooring Qatar.jpg"),
  },
  {
    title: "Indoor Games",
    href: "/categories/sports-tools#indoor",
    description: "Table tennis, billiards, foosball & darts",
    count: "34 products",
    image: asset("Image/indoor games category.webp"),
  },
  {
    title: "Football",
    href: "/categories/sports-tools#football",
    description: "Footballs, goal posts, shin guards & boots",
    count: "115 products",
    image: asset("Image/cat_football.webp"),
  },
  {
    title: "Mens Sportswear",
    href: "/categories/sportswear#mens",
    description: "Tracksuits, T-shirts, shorts & performance wear",
    count: "180 products",
    image: asset("Image/Sports Wear Category.webp"),
  },
  {
    title: "Training Tools",
    href: "/categories/sports-tools#training",
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
  { label: "Snapchat", short: "SC", href: "https://www.snapchat.com/add/sportsway.qtr" },
  { label: "YouTube", short: "YT", href: "https://www.youtube.com/@sportswayqtr" },
  { label: "X", short: "X", href: "https://x.com/sportswayqtr" },
  { label: "LinkedIn", short: "IN", href: "https://www.linkedin.com/company/sports-way-trading/" },
];

export const pageLinks = [
  { label: "Gym Equipment", href: "/categories/gym-equipment" },
  { label: "Sports Tools", href: "/categories/sports-tools" },
  { label: "Sportswear", href: "/categories/sportswear" },
  { label: "Footwear", href: "/categories/footwear" },
  { label: "Supplements", href: "/categories/supplements" },
  { label: "Flooring", href: "/categories/flooring" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Clients", href: "/clients" },
  { label: "Partners", href: "/partners" },
  { label: "Contact Us", href: "/contact" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "My Account", href: "/my-account" },
  { label: "Cart", href: "/cart" },
  { label: "Checkout", href: "/checkout" },
];

export const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${(index * 13) % 100}%`,
  delay: `${(index % 6) * 1.1}s`,
  duration: `${8 + (index % 5) * 2}s`,
}));

