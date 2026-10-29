import type { Product } from "./catalogue.ts";

const imagePath = (photo: string) => `/products/collection/${photo}.jpg`;

// Keep the existing IDs so saved bags still point to the same product.
export const cataloguePhotoUpdates: Record<string, Partial<Product>> = {
  "built-in-cable-power-bank": { name: "20,000 mAh Built In Cable Power Bank", priceGhs: 200 },
  "carry-loop-power-bank": { name: "10,000 mAh Carry Loop Power Bank", priceGhs: 150 },
  "suction-style-power-bank": { name: "10,000 mAh Suction Style Power Bank", priceGhs: 150 },
  "photo-customized-necklace": {
    image: imagePath("portrait-photo-necklace"), imageIsReference: false,
    imageNote: "Photo shows an example of picture customisation. Price is per necklace. Send your own photo on WhatsApp and confirm the final design with the seller.",
  },
  "bedsheet-sets": {
    name: "Grey Quilted Bedding", image: imagePath("grey-quilted-bedding"), imageIsPlaceholder: false, isSample: false,
    description: "Explore the grey quilted bedding style shown. Share your bed size and ask the seller to confirm the cover type and included pieces.",
    imageNote: "Bedding style example. Confirm dimensions, included pieces and the full price; the bed and room accessories are not included.",
  },
  "fashion-jewelry": {
    name: "Sculptural Cuff Bangle", image: imagePath("sculptural-cuff-bangle"), imageIsPlaceholder: false, isSample: false,
    description: "A sculptural cuff style for your jewellery collection. Confirm sizing, finish and pricing directly with the seller.",
  },
  "fashion-watches": {
    name: "Rose Tone Black Dial Watch", image: imagePath("watch-rose-black"), imageIsPlaceholder: false, isSample: false,
    description: "Enquire about the rose-tone watch with a black dial shown in this photo. Confirm the exact model, strap size and product details with the seller.",
    imageNote: "Photo supplied for this watch style. Confirm the exact model, finish and package contents before ordering.",
  },
  "bracelets-pair": {
    gallery: [imagePath("ivan-naya-bracelets")],
  },
};

const watchSetIds = new Set([
  "black-rectangular-watch-bracelet-set", "personalized-gold-watch-bracelet-set",
  "purple-two-tone-three-piece-set", "white-dial-gold-watch-bracelet-set",
  "black-dial-gold-three-piece-set", "red-dial-black-watch-bracelet-set",
  "blue-silver-three-piece-set", "black-three-piece-gift-set",
  "purple-two-tone-watch-bracelet-set", "my-man-three-piece-gift-set",
]);

export function applyCollectionPricing(product: Product): Product {
  if (product.category === "Jewelry") return { ...product, priceGhs: 60 };
  if (["rectangular-floor-mirror", "arched-floor-mirror"].includes(product.id)) return { ...product, priceGhs: 360 };
  if (product.category === "Watches") return { ...product, priceGhs: 200, priceIsEstimate: true };
  if (watchSetIds.has(product.id)) return {
    ...product,
    priceGhs: 350,
    priceOptions: [
      { id: "plain", label: "Without customisation", priceGhs: 350 },
      { id: "customized", label: "With customisation", priceGhs: 400 },
    ],
  };
  return product;
}

const categoryDetails = {
  Watches: {
    description: "Choose the watch style shown and ask about the exact model, strap sizing, finish and product details before ordering.",
    customizationLabel: "Watch preferences or questions", customizationHint: "Strap size, preferred finish, engraving request or product questions",
    imageNote: "Photo supplied for this watch style. Confirm the exact model, finish, features and package contents with the seller.",
  },
  "Gift Sets": {
    description: "Enquire about the gift arrangement shown. Share your preferred pieces and personalisation, then confirm the full set price with the seller.",
    customizationLabel: "Set contents and personalisation", customizationHint: "Requested pieces, names or engraving, colours and packaging preferences",
    imageNote: "Example gift arrangement. Confirm included pieces, engraving, packaging and the complete set price before ordering.",
  },
  "Home & Living": {
    description: "Ask about the home item shown. Share the size and configuration you need so the seller can confirm the available options and delivery.",
    customizationLabel: "Size, configuration or questions", customizationHint: "Required dimensions, colour, configuration or delivery questions",
    imageNote: "Confirm dimensions, configuration, assembly and package contents. Clothes, toiletries and decorative props in the photo are not included.",
  },
  Curtains: {
    description: "Explore this curtain colour and pattern. Share your window measurements and request a quote for the panels and fittings you need.",
    customizationLabel: "Window size and curtain preferences", customizationHint: "Width, drop, number of panels and any fitting requirements",
    imageNote: "Curtain style example. Confirm fabric details, measurements, panel count and any included fittings. Room accessories are not included.",
  },
  Bedsheets: {
    description: "Explore the quilted bedding style shown. Share your bed size and confirm the cover type, dimensions and included pieces with the seller.",
    customizationLabel: "Bed size and bedding preferences", customizationHint: "Bed dimensions, requested pieces and preferred colours",
    imageNote: "Bedding style example. Confirm dimensions, included pieces and the full price; the bed and room accessories are not included.",
  },
  Bracelets: {
    description: "Choose this bracelet style and share your own name, initials or engraving request. Confirm your preferred finish and size with the seller.",
    customizationLabel: "Name, initials or personalisation", customizationHint: "Your engraving text, wrist size and preferred finish",
    imageNote: "Price is per bracelet. Photos show engraving and colour examples; multiple items pictured do not mean a set is included. Confirm your chosen style with the seller.",
  },
  Necklaces: {
    description: "Choose this necklace style and tell us your own engraving or personalisation request. Confirm the pendant design, finish and chain with the seller.",
    customizationLabel: "Name and necklace preferences", customizationHint: "Engraving text, preferred pendant, finish or chain details",
    imageNote: "Price is per necklace. Names, messages and colours are examples; multiple necklaces pictured are not a bundle. Confirm your selected design with the seller.",
  },
  Rings: {
    description: "Share your own engraving, ring size and preferred design from the photo. Confirm the final details with the seller before ordering.",
    customizationLabel: "Name, ring size and style", customizationHint: "Your engraving text, ring size and preferred finish",
    imageNote: "Price is per ring. The photo shows engraving examples; confirm your chosen ring size and style with the seller.",
  },
  Electronics: {
    description: "Ask about the item shown and share your device model. Product specifications, compatibility, options and package contents are confirmed by the seller.",
    customizationLabel: "Device model or product questions", customizationHint: "Your device model, connection, preferred colour or compatibility questions",
    imageNote: "Confirm specifications, compatibility, available colours and package contents directly with the seller.",
  },
  Jewelry: {
    description: "Choose this jewellery style and ask about sizing, finish and pricing. Confirm the exact piece and available options with the seller.",
    customizationLabel: "Size, finish or questions", customizationHint: "Required size, preferred finish or questions about the piece",
    imageNote: "Photo supplied for this style. Confirm sizing, finish and product details before ordering.",
  },
};

type Addition = { photo: string; name: string; category: keyof typeof categoryDetails; priceGhs?: number; requiresPhoto?: boolean };

// Each row is an individual listing. Later owner-supplied power-bank, watch
// and watch-set prices are applied above; other unpriced items need quotes.
const listings: Addition[] = [
  { photo: "wood-look-gift-set", name: "Wood Look Bottle, Notebook & Pen Gift Set", category: "Gift Sets" },
  { photo: "watch-gold-detail-black-strap", name: "Gold Detail Black Strap Watch", category: "Watches" },
  { photo: "bathroom-rack-style-one", name: "Bathroom Storage Rack Style One", category: "Home & Living" },
  { photo: "watch-tan-minimal", name: "Tan Strap Minimal Watch", category: "Watches" },
  { photo: "watch-gold-octagonal-brown", name: "Gold Tone Octagonal Brown Strap Watch", category: "Watches" },
  { photo: "black-rectangular-watch-bracelet-set", name: "Black Rectangular Watch & Bracelet Gift Set", category: "Gift Sets" },
  { photo: "forever-message-necklace", name: "Forever Message Tag Necklace", category: "Necklaces", priceGhs: 100 },
  { photo: "crown-name-bracelet", name: "Crown Name Bracelet", category: "Bracelets", priceGhs: 130 },
  { photo: "rectangular-floor-mirror", name: "Rectangular Floor Mirror", category: "Home & Living" },
  { photo: "white-pattern-modular-wardrobe", name: "White Pattern Modular Wardrobe", category: "Home & Living" },
  { photo: "blue-compact-modular-wardrobe", name: "Blue Compact Modular Wardrobe", category: "Home & Living" },
  { photo: "personalized-gold-watch-bracelet-set", name: "Personalized Gold Tone Watch & Bracelet Gift Set", category: "Gift Sets" },
  { photo: "watch-rose-mesh-brown-dial", name: "Rose Tone Mesh Brown Dial Watch", category: "Watches" },
  { photo: "joyceline-necklace-bracelet-set", name: "Joyceline Style Necklace & Bracelet Gift Set", category: "Gift Sets" },
  { photo: "built-in-cable-power-bank", name: "Built In Cable Power Bank", category: "Electronics" },
  { photo: "purple-two-tone-three-piece-set", name: "Purple Dial Two Tone Three Piece Gift Set", category: "Gift Sets" },
  { photo: "white-charger-cable-kit", name: "White Phone Charger & Cable", category: "Electronics", priceGhs: 150 },
  { photo: "watch-silver-blue-roman-dial", name: "Silver Tone Blue Roman Dial Watch", category: "Watches" },
  { photo: "white-dial-gold-watch-bracelet-set", name: "White Dial Gold Tone Watch & Bracelet Gift Set", category: "Gift Sets" },
  { photo: "grey-bathroom-mat", name: "Grey Bathroom Mat", category: "Home & Living" },
  { photo: "carry-loop-power-bank", name: "Carry Loop Power Bank", category: "Electronics" },
  { photo: "watch-blue-link-grey-dial", name: "Blue Link Grey Dial Watch", category: "Watches" },
  { photo: "brown-pattern-modular-wardrobe", name: "Brown Pattern Modular Wardrobe", category: "Home & Living" },
  { photo: "open-link-cuff-bangle", name: "Open Link Cuff Bangle", category: "Jewelry" },
  { photo: "silver-nk-name-bracelet", name: "Silver NK Style Name Bracelet", category: "Bracelets", priceGhs: 130 },
  { photo: "engraved-plate-bracelet", name: "Engraved Plate Bracelet", category: "Bracelets", priceGhs: 130 },
  { photo: "watch-black-detail-black-strap", name: "Black Detail Black Strap Watch", category: "Watches" },
  { photo: "arched-floor-mirror", name: "Arched Floor Mirror", category: "Home & Living" },
  { photo: "round-heart-name-necklace", name: "Round & Heart Name Necklace", category: "Necklaces", priceGhs: 100 },
  { photo: "double-rail-clothes-rack", name: "Double Rail Clothes Rack", category: "Home & Living" },
  { photo: "watch-rose-red-dial", name: "Rose Tone Red Dial Watch", category: "Watches" },
  { photo: "watch-black-blue-sports", name: "Black & Blue Sports Style Watch", category: "Watches" },
  { photo: "golden-yellow-curtains", name: "Golden Yellow Textured Curtains", category: "Curtains" },
  { photo: "engraved-chain-bracelet", name: "Engraved Chain Bracelet", category: "Bracelets", priceGhs: 130 },
  { photo: "black-dial-gold-three-piece-set", name: "Black Dial Gold Tone Three Piece Gift Set", category: "Gift Sets" },
  { photo: "earbuds-colour-styles", name: "Wireless Earbuds Colour Styles", category: "Electronics" },
  { photo: "flowing-cuff-bangle", name: "Flowing Cuff Bangle", category: "Jewelry" },
  { photo: "watch-black-octagonal-black-strap", name: "Black Octagonal Black Strap Watch", category: "Watches" },
  { photo: "watch-black-floral-dial", name: "Black Floral Dial Watch", category: "Watches" },
  { photo: "suction-style-power-bank", name: "Suction Style Power Bank", category: "Electronics" },
  { photo: "watch-two-tone-black-dial", name: "Two Tone Black Dial Watch", category: "Watches" },
  { photo: "braided-initial-bracelet", name: "Braided Initial Bracelet", category: "Bracelets", priceGhs: 130 },
  { photo: "heart-charm-name-necklace", name: "Heart Charm Name Necklace", category: "Necklaces", priceGhs: 100 },
  { photo: "red-dial-black-watch-bracelet-set", name: "Red Dial Black Watch & Bracelet Gift Set", category: "Gift Sets" },
  { photo: "brown-textured-curtains", name: "Brown Textured Curtains", category: "Curtains" },
  { photo: "blue-silver-three-piece-set", name: "Blue & Silver Tone Three Piece Gift Set", category: "Gift Sets" },
  { photo: "engraved-bar-necklace", name: "Engraved Bar Necklace", category: "Necklaces", priceGhs: 100 },
  { photo: "black-textured-curtains", name: "Black Textured Curtains", category: "Curtains" },
  { photo: "watch-brown-strap-grey-dial", name: "Brown Strap Grey Dial Watch", category: "Watches" },
  { photo: "leo-gracia-name-rings", name: "Leo & Gracia Style Name Ring", category: "Rings", priceGhs: 50 },
  { photo: "shelf-base-clothes-rack", name: "Shelf Base Clothes Rack", category: "Home & Living" },
  { photo: "watch-blue-strap-white-dial", name: "Blue Strap White Dial Watch", category: "Watches" },
  { photo: "yellow-floral-quilted-bedding", name: "Yellow Floral Quilted Bedding", category: "Bedsheets" },
  { photo: "black-three-piece-gift-set", name: "Black Three Piece Gift Set", category: "Gift Sets" },
  { photo: "watch-silver-square-blue-dial", name: "Silver Tone Square Blue Dial Watch", category: "Watches" },
  { photo: "green-textured-curtains", name: "Green Textured Curtains", category: "Curtains" },
  { photo: "watch-brown-dot-dial", name: "Brown Strap Dot Dial Watch", category: "Watches" },
  { photo: "watch-silver-black-cushion-dial", name: "Silver Tone Black Cushion Dial Watch", category: "Watches" },
  { photo: "watch-silver-white-cushion-dial", name: "Silver Tone White Cushion Dial Watch", category: "Watches" },
  { photo: "classic-chain-bracelet", name: "Classic Chain Bracelet", category: "Bracelets", priceGhs: 130 },
  { photo: "watch-black-dot-dial", name: "Black Strap Dot Dial Watch", category: "Watches" },
  { photo: "blue-wide-modular-wardrobe", name: "Blue Wide Modular Wardrobe", category: "Home & Living" },
  { photo: "space-print-quilted-bedding", name: "Space Print Quilted Bedding", category: "Bedsheets" },
  { photo: "blue-floral-quilted-bedding", name: "Blue Floral Quilted Bedding", category: "Bedsheets" },
  { photo: "watch-gold-analogue-digital", name: "Gold Tone Analogue & Digital Style Watch", category: "Watches" },
  { photo: "purple-two-tone-watch-bracelet-set", name: "Purple Dial Two Tone Watch & Bracelet Gift Set", category: "Gift Sets" },
  { photo: "photo-necklace-bracelet-set", name: "Photo Necklace & Bracelet Gift Set", category: "Gift Sets", requiresPhoto: true },
  { photo: "my-man-three-piece-gift-set", name: "My Man Style Three Piece Gift Set", category: "Gift Sets" },
  { photo: "watch-silver-detail-brown-strap", name: "Silver Detail Brown Strap Watch", category: "Watches" },
  { photo: "side-shelf-clothes-rack", name: "Side Shelf Clothes Rack", category: "Home & Living" },
  { photo: "bathroom-rack-style-two", name: "Bathroom Storage Rack Style Two", category: "Home & Living" },
];

export const additionalProducts: Product[] = listings.map(listing => ({
  id: listing.photo,
  name: listing.name,
  category: listing.category,
  image: imagePath(listing.photo),
  priceGhs: listing.priceGhs ?? null,
  requiresPhoto: listing.requiresPhoto,
  imageIsPlaceholder: false,
  isSample: false,
  availability: "confirm",
  ...categoryDetails[listing.category],
}));
