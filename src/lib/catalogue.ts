import { additionalProducts, applyCollectionPricing, cataloguePhotoUpdates } from "./collection-additions.ts";

export interface PriceOption { id: string; label: string; priceGhs: number }

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  gallery?: string[];
  imageIsPlaceholder: boolean;
  imageIsReference?: boolean;
  imageNote?: string;
  requiresPhoto?: boolean;
  isSample: boolean;
  priceGhs: number | null;
  priceIsEstimate?: boolean;
  priceOptions?: PriceOption[];
  availability: "confirm";
  customizationLabel: string;
  customizationHint: string;
}

export const store = {
  name: "Big B Royale",
  currency: "GHS",
  whatsappNumber: "233557356892",
  whatsappDisplay: "+233 55 735 6892",
  delivery: "Delivery charges depend on your location and will be confirmed by the seller on WhatsApp.",
};

// Product photos and prices supplied by the owner. Unpriced/illustrative entries
// remain explicit. Stock, final customisation and delivery are seller-confirmed.
const baseProducts: Product[] = [
  {
    id: "customized-bracelets", name: "Customized Bracelets", category: "Bracelets", priceGhs: 130,
    description: "Your name, initials or a meaningful message, made personal. Choose this bracelet style and share your own engraving request.",
    image: "/products/collection/bracelet-big-b.jpg",
    gallery: ["/products/collection/bracelet-and-necklace-set.jpg"],
    imageIsPlaceholder: false, isSample: false, availability: "confirm",
    imageNote: "Price is per bracelet. Names and symbols are engraving examples; other items pictured are not included. Share your own text and confirm the style with the seller.",
    customizationLabel: "Name, initials or personalisation", customizationHint: "For example: Ama · preferred colour or style",
  },
  {
    id: "personalized-name-necklaces", name: "Personalized Name Necklaces", category: "Necklaces", priceGhs: 100,
    description: "A personal touch to keep close. Choose this necklace style and tell us your own name or engraving request.",
    image: "/products/collection/queen-pendant-necklace.jpg",
    imageIsPlaceholder: false, isSample: false, availability: "confirm",
    imageNote: "Price is per necklace. Photos show style and engraving examples; other items pictured are not included. Confirm your chosen finish and engraving with the seller.",
    customizationLabel: "Name and style preferences", customizationHint: "Name to personalise, preferred finish, or other requests",
  },
  {
    id: "photo-customized-necklace", name: "Photo-Customized Necklace", category: "Necklaces", priceGhs: 140,
    description: "Turn a favourite picture into a personal necklace request. Send your chosen photo to the seller on WhatsApp to confirm the final design.",
    image: "/products/collection/pendant-necklace-styles.jpg", imageIsPlaceholder: false, imageIsReference: true,
    imageNote: "Pendant style reference only. The pictured pendants do not show the finished photo customisation; confirm the design on WhatsApp.",
    isSample: false, availability: "confirm", requiresPhoto: true,
    customizationLabel: "Photo and necklace preferences", customizationHint: "Describe your photo request, pendant style and any text to include",
  },
  {
    id: "customized-rings", name: "Customized Rings", category: "Rings", priceGhs: 50,
    description: "A little detail that says something personal. Choose this ring style and share your engraving request and ring size.",
    image: "/products/collection/gold-name-ring.jpg",
    gallery: ["/products/collection/bracelet-and-ring-examples.jpg"],
    imageIsPlaceholder: false, isSample: false, availability: "confirm",
    imageNote: "Price is per ring. Photos show engraving examples; other items pictured are not included. Ring size, finish and availability are confirmed by the seller.",
    customizationLabel: "Name, ring size and style", customizationHint: "Engraving text, ring size and your preferred photo or finish",
  },
  {
    id: "phone-charger", name: "Phone Charger", category: "Electronics", priceGhs: 150,
    description: "The charger shown in the supplied product photo. Share your phone model so the seller can confirm the connection, compatibility and package contents.",
    image: "/products/collection/phone-charger.jpg", imageIsPlaceholder: false, isSample: false, availability: "confirm",
    customizationLabel: "Phone model and connection", customizationHint: "Your phone model, charging connection and any questions",
  },
  {
    id: "wireless-earbuds", name: "Wireless Earbuds", category: "Electronics", priceGhs: null,
    description: "Ask about the earbuds shown in the supplied photo. Pricing, product details and compatibility are confirmed directly by the seller.",
    image: "/products/collection/wireless-earbuds.jpg", imageIsPlaceholder: false, isSample: false, availability: "confirm",
    customizationLabel: "Preferences or questions", customizationHint: "Your device model, preferred options or questions for the seller",
  },
  { id: "customized-water-bottles", name: "Customized Water Bottles", category: "Bottles", description: "Make an everyday essential your own. Send your name, message or design request for a personalised quote.", image: "/products/placeholders/bottle.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Name, message or design request", customizationHint: "Personalisation text, preferred colour or design" },
  { id: "personalized-diaries", name: "Personalized Diaries", category: "Diaries", description: "Space for your thoughts, with a personal touch. Ask about available diary styles and personalisation.", image: "/products/placeholders/diary.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Name, initials or cover request", customizationHint: "Name for the cover, preferred colour, or a message" },
  { id: "customized-pens", name: "Customized Pens", category: "Pens", description: "A thoughtful finishing touch for a gift or your desk. Share the wording and pen style you would like.", image: "/products/placeholders/pen.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Text and pen preferences", customizationHint: "Name, initials or wording; preferred colour or style" },
  { id: "bedsheet-sets", name: "Bedsheet Sets", category: "Bedsheets", description: "Refresh your space, your way. Tell us your bed size and preferred colours or patterns so we can confirm options.", image: "/products/placeholders/bedsheets.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Size, colour or pattern requests", customizationHint: "Bed size, preferred colours, patterns, or other details" },
  { id: "fashion-jewelry", name: "Fashion Jewelry", category: "Jewelry", description: "A finishing touch that feels like you. Ask about available pieces, finishes and styles before ordering.", image: "/products/placeholders/jewelry.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Piece and style preferences", customizationHint: "Type of jewelry, preferred finish, style or other requests" },
  { id: "fashion-watches", name: "Fashion Watches", category: "Watches", description: "Find a timepiece for your everyday. Share the look you prefer and we will confirm the available options.", image: "/products/placeholders/watch.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Watch and style preferences", customizationHint: "Preferred strap, colour, style or other requests" },
];

// Each style has its own card, price and bag identity. Keep only a useful
// close-up or supporting example as a second photo, rather than hiding styles.
type StyleListing = { id: string; name: string; photo: string; secondPhoto?: string };
const styles: Record<string, StyleListing[]> = {
  "customized-bracelets": [
    { id: "bracelet-kobby", name: "Kobby Style Bracelet", photo: "bracelet-kobby" },
    { id: "bracelet-micheal", name: "Micheal Style Bracelet", photo: "bracelet-micheal" },
    { id: "bracelet-naad", name: "NAAD Style Bracelet", photo: "bracelet-naad" },
    { id: "bracelet-wallet", name: "Wallet Style Bracelet", photo: "bracelet-wallet", secondPhoto: "bracelet-wallet-closeup" },
    { id: "bracelet-mash", name: "Mash Style Bracelet", photo: "bracelet-mash" },
    { id: "bracelet-ama", name: "Ama Style Bracelet", photo: "bracelet-ama", secondPhoto: "bracelet-and-ring-examples" },
    { id: "bracelet-viscount", name: "Viscount Style Bracelet", photo: "bracelet-viscount" },
    { id: "bracelet-richie", name: "Richie Style Bracelet", photo: "bracelet-richie" },
    { id: "gold-promise-bracelet", name: "Promise Style Bracelet", photo: "gold-promise-bracelet" },
    { id: "bracelet-nana-kay", name: "Nana Kay Style Bracelet", photo: "bracelet-nana-kay" },
    { id: "bracelets-pair", name: "Name Plate Bracelet", photo: "bracelets-pair" },
  ],
  "personalized-name-necklaces": [
    { id: "pendant-necklace-styles", name: "Personalized Tag Necklace", photo: "pendant-necklace-styles" },
    { id: "bar-necklace", name: "Personalized Bar Necklace", photo: "bar-necklace", secondPhoto: "bracelet-and-necklace-set" },
    { id: "yin-yang-necklaces", name: "Yin Yang Necklace", photo: "yin-yang-necklaces" },
  ],
  "customized-rings": [
    { id: "black-ring", name: "Black Band Ring", photo: "black-ring" },
    { id: "ring-dna", name: "DNA Style Ring", photo: "ring-dna" },
    { id: "ring-javi", name: "Javi Style Ring", photo: "ring-javi" },
    { id: "ring-brokeless", name: "Brokeless Style Ring", photo: "ring-brokeless" },
    { id: "ring-etonam", name: "Etonam Style Ring", photo: "ring-etonam" },
  ],
};

export const products: Product[] = [...baseProducts.flatMap(product => [
  product,
  ...(styles[product.id] ?? []).map(style => ({
    ...product,
    id: style.id,
    name: style.name,
    image: `/products/collection/${style.photo}.jpg`,
    gallery: style.secondPhoto ? [`/products/collection/${style.secondPhoto}.jpg`] : [],
  })),
]), ...additionalProducts].map(product => applyCollectionPricing({ ...product, ...cataloguePhotoUpdates[product.id] }));

export const categories = [...new Set(products.map(product => product.category))];

export function productImages(product: Product): string[] {
  return [...new Set([product.image, ...(product.gallery ?? [])])];
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: store.currency }).format(amount);
}

export function unitPriceGhs(product: Product, optionId?: string): number | null {
  return product.priceOptions ? product.priceOptions.find(option => option.id === optionId)?.priceGhs ?? null : product.priceGhs;
}

export function lineSubtotalGhs(product: Product, quantity: number, optionId?: string): number | null {
  const price = unitPriceGhs(product, optionId);
  return price === null ? null : Math.round(price * 100) * quantity / 100;
}

export function priceLabel(product: Product, optionId?: string): string {
  if (product.priceOptions && !optionId) return `From ${formatPrice(Math.min(...product.priceOptions.map(option => option.priceGhs)))}`;
  const price = unitPriceGhs(product, optionId);
  return price === null ? "Contact for Price" : `${product.priceIsEstimate ? "About " : ""}${formatPrice(price)}`;
}
