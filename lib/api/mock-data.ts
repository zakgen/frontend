import type {
  BusinessProfile,
  CommerceIntegration,
  ComingSoonIntegration,
  ConversationMessage,
  Product,
  SyncStatus,
  WhatsAppIntegration,
} from "@/lib/types";

const now = new Date();

export const mockBusiness: BusinessProfile = {
  id: 1,
  name: "Boutique Al Warda",
  summary:
    "Boutique marocaine de mode feminine et accessoires premium, avec un service WhatsApp rapide, chaleureux et fiable.",
  niche: "Mode feminine",
  city: "Casablanca",
  default_language: "french",
  tone_of_voice: "friendly",
  opening_hours: [
    "Lun - Ven : 09:00 - 20:00",
    "Sam : 10:00 - 18:00",
    "Dim : support en ligne seulement",
  ],
  delivery_zones: ["Casablanca", "Rabat", "Marrakech"],
  delivery_time: "24 a 48 heures dans les grandes villes",
  shipping_policy:
    "Livraison partout au Maroc. Les commandes confirmees avant 15h partent le jour meme depuis Casablanca.",
  return_policy:
    "Retours acceptes sous 7 jours pour les articles non portes et dans leur emballage d'origine.",
  payment_methods: ["cash_on_delivery", "card_payment", "bank_transfer"],
  faq: [
    {
      id: "faq-1",
      question: "Livrez-vous a Agadir ?",
      answer: "Oui, nous livrons a Agadir en 48 a 72 heures selon le transporteur.",
    },
    {
      id: "faq-2",
      question: "Puis-je changer la taille apres livraison ?",
      answer: "Oui, les echanges de taille sont possibles sous 7 jours selon la disponibilite du stock.",
    },
  ],
  order_rules: [
    "Toujours confirmer la taille et la ville avant de finaliser la commande.",
    "Transmettre au support humain toute commande superieure a 2000 MAD.",
  ],
  escalation_contact: "service@alwarda.ma | +212 661 234 890",
  upsell_rules: [
    "Proposer un accessoire assorti quand le panier depasse 250 MAD.",
    "Suggere un lot lorsque la cliente demande deux articles ou plus.",
  ],
  updated_at: new Date(now.getTime() - 1000 * 60 * 80).toISOString(),
};

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    business_id: 1,
    external_id: "djellaba-safran",
    name: "Djellaba Safran",
    description: "Djellaba fluide en tissu satine, ideale pour les evenements et sorties du soir.",
    category: "Djellabas",
    price: 459,
    currency: "MAD",
    stock_status: "in_stock",
    variants: [
      { id: "var-1", name: "Taille M", additional_price: null, stock_status: "in_stock" },
      { id: "var-2", name: "Taille L", additional_price: null, stock_status: "in_stock" },
    ],
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(now.getTime() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "prod-2",
    business_id: 1,
    external_id: "sac-cuir-sable",
    name: "Sac cuir sable",
    description: "Sac structure a finitions dorees, parfait pour un usage quotidien chic.",
    category: "Sacs",
    price: 329,
    currency: "MAD",
    stock_status: "low_stock",
    variants: [
      { id: "var-3", name: "Unique", additional_price: null, stock_status: "low_stock" },
    ],
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updated_at: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "prod-3",
    business_id: 1,
    external_id: "kimono-rose-poudre",
    name: "Kimono rose poudre",
    description: "Ensemble kimono leger avec ceinture assortie et coupe elegante.",
    category: "Ensembles",
    price: 599,
    currency: "MAD",
    stock_status: "in_stock",
    variants: [
      { id: "var-4", name: "Taille S", additional_price: null, stock_status: "in_stock" },
      { id: "var-5", name: "Taille M", additional_price: 20, stock_status: "in_stock" },
    ],
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(now.getTime() - 1000 * 60 * 16).toISOString(),
  },
  {
    id: "prod-4",
    business_id: 1,
    external_id: "serum-argan-eclat",
    name: "Serum argan eclat",
    description: "Serum nourrissant a l'huile d'argan pour peaux seches et ternes.",
    category: "Beaute",
    price: 189,
    currency: "MAD",
    stock_status: "out_of_stock",
    variants: [
      { id: "var-6", name: "30 ml", additional_price: null, stock_status: "out_of_stock" },
    ],
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * 20).toISOString(),
    updated_at: new Date(now.getTime() - 1000 * 60 * 9).toISOString(),
  },
];

export const mockMessages: ConversationMessage[] = [
  {
    id: "msg-1",
    phone: "+212600111111",
    text: "Salam, la djellaba safran kayna f taille M ?",
    direction: "inbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 135).toISOString(),
    intent: "disponibilite",
  },
  {
    id: "msg-2",
    phone: "+212600111111",
    text: "Oui madame, la taille M est disponible aujourd'hui.",
    direction: "outbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 133).toISOString(),
    intent: "disponibilite",
  },
  {
    id: "msg-3",
    phone: "+212600111111",
    text: "Et pour Rabat, la livraison prend combien de temps ?",
    direction: "inbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 131).toISOString(),
    intent: "livraison",
  },
  {
    id: "msg-4",
    phone: "+212600111111",
    text: "Comptez 24 a 48 heures avec paiement a la livraison.",
    direction: "outbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 129).toISOString(),
    intent: "livraison",
  },
  {
    id: "msg-5",
    phone: "+212611222333",
    text: "Est-ce que je peux retourner le serum si il ne me convient pas ?",
    direction: "inbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 70).toISOString(),
    intent: "retour",
    needs_human: true,
  },
  {
    id: "msg-6",
    phone: "+212611222333",
    text: "Oui, les retours sont possibles sous 7 jours pour les articles non utilises.",
    direction: "outbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 68).toISOString(),
    intent: "retour",
    needs_human: true,
  },
  {
    id: "msg-7",
    phone: "+212655444777",
    text: "Bonjour, vous livrez aussi a Agadir ?",
    direction: "inbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    intent: "livraison",
  },
  {
    id: "msg-8",
    phone: "+212655444777",
    text: "Oui, la livraison a Agadir est disponible en 48 a 72 heures.",
    direction: "outbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 28).toISOString(),
    intent: "livraison",
  },
  {
    id: "msg-9",
    phone: "+212655444777",
    text: "Parfait, et le paiement a la livraison est possible ?",
    direction: "inbound",
    timestamp: new Date(now.getTime() - 1000 * 60 * 26).toISOString(),
    intent: "paiement",
  },
];

export const mockSyncStatus: SyncStatus = {
  business_id: 1,
  status: "recommended",
  last_synced_at: new Date(now.getTime() - 1000 * 60 * 180).toISOString(),
  last_result: "Vous avez ajoute 3 produits depuis la derniere mise a jour.",
  synced_products: mockProducts.length - 1,
  synced_business_knowledge: 1,
  synced_faqs: mockBusiness.faq.length,
  embedding_model: "text-embedding-3-small",
  ai_ready: false,
  stale_reasons: ["3 nouveaux produits ne sont pas encore connus par l'assistant."],
};

export const mockWhatsAppIntegration: WhatsAppIntegration = {
  phone_number: "+212 6 61 23 48 90",
  business_name: "Rasil App",
  status: "connected",
  health: "healthy",
  received_messages_last_30_days: 1204,
  last_activity_at: new Date(now.getTime() - 1000 * 60 * 4).toISOString(),
};

export const mockPlatforms: CommerceIntegration[] = [
  {
    id: "youcan",
    name: "YouCan",
    description: "Synchronisez vos produits automatiquement depuis votre boutique YouCan.",
    status: "disconnected",
    imported_products: 0,
    last_sync_at: null,
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Connectez votre catalogue Shopify pour garder vos fiches produits a jour.",
    status: "disconnected",
    imported_products: 0,
    last_sync_at: null,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Recuperez vos produits WooCommerce sans ressaisie manuelle.",
    status: "disconnected",
    imported_products: 0,
    last_sync_at: null,
  },
  {
    id: "zid",
    name: "Zid",
    description: "Gardez votre catalogue Zid synchronise avec Rasil.",
    status: "disconnected",
    imported_products: 0,
    last_sync_at: null,
  },
];

export const mockComingSoon: ComingSoonIntegration[] = [
  {
    id: "instagram",
    name: "Instagram DM",
    description: "Repondre aux demandes recues depuis Instagram.",
  },
  {
    id: "messenger",
    name: "Facebook Messenger",
    description: "Centraliser vos messages Facebook au meme endroit.",
  },
  {
    id: "payments",
    name: "Paiement en ligne",
    description: "Relier vos paiements pour suivre commandes et confirmations.",
  },
];
