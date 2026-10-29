export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  imageIsPlaceholder: boolean;
  isSample: boolean;
  priceGhs: number | null;
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

// Owner-supplied sample catalogue. Replace image paths and verified details here.
// null prices and 'confirm' availability deliberately make no price/stock claims.
export const products: Product[] = [
  { id: "customized-bracelets", name: "Customized Bracelets", category: "Bracelets", description: "A little detail with a personal touch. Share your preferred name, initials and style with us.", image: "/products/placeholders/bracelet.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Name, initials or personalisation", customizationHint: "For example: Ama · preferred colour or style" },
  { id: "personalized-name-necklaces", name: "Personalized Name Necklaces", category: "Necklaces", description: "Keep a meaningful name close. Tell us the name and finish you have in mind; available options will be confirmed.", image: "/products/placeholders/necklace.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Name and style preferences", customizationHint: "Name to personalise, preferred finish, or other requests" },
  { id: "customized-water-bottles", name: "Customized Water Bottles", category: "Bottles", description: "Make an everyday essential your own. Send your name, message or design request for a personalised quote.", image: "/products/placeholders/bottle.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Name, message or design request", customizationHint: "Personalisation text, preferred colour or design" },
  { id: "personalized-diaries", name: "Personalized Diaries", category: "Diaries", description: "Space for your thoughts, with a personal touch. Ask about available diary styles and personalisation.", image: "/products/placeholders/diary.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Name, initials or cover request", customizationHint: "Name for the cover, preferred colour, or a message" },
  { id: "customized-pens", name: "Customized Pens", category: "Pens", description: "A thoughtful finishing touch for a gift or your desk. Share the wording and pen style you would like.", image: "/products/placeholders/pen.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Text and pen preferences", customizationHint: "Name, initials or wording; preferred colour or style" },
  { id: "bedsheet-sets", name: "Bedsheet Sets", category: "Bedsheets", description: "Refresh your space, your way. Tell us your bed size and preferred colours or patterns so we can confirm options.", image: "/products/placeholders/bedsheets.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Size, colour or pattern requests", customizationHint: "Bed size, preferred colours, patterns, or other details" },
  { id: "fashion-jewelry", name: "Fashion Jewelry", category: "Jewelry", description: "A finishing touch that feels like you. Ask about available pieces, finishes and styles before ordering.", image: "/products/placeholders/jewelry.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Piece and style preferences", customizationHint: "Type of jewelry, preferred finish, style or other requests" },
  { id: "fashion-watches", name: "Fashion Watches", category: "Watches", description: "Find a timepiece for your everyday. Share the look you prefer and we will confirm the available options.", image: "/products/placeholders/watch.svg", imageIsPlaceholder: true, isSample: true, priceGhs: null, availability: "confirm", customizationLabel: "Watch and style preferences", customizationHint: "Preferred strap, colour, style or other requests" },
];

export const categories = [...new Set(products.map(product => product.category))];

export function priceLabel(product: Product): string {
  return product.priceGhs === null ? "Contact for Price" : new Intl.NumberFormat("en-GH", { style: "currency", currency: store.currency }).format(product.priceGhs);
}
