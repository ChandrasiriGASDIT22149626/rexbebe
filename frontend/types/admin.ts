export interface HeroConfig {
  headlineLine1: string;
  headlineLine2: string;
  speechBubbleText: string;
  dinoQuotes: string[];
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaSecondaryText: string;
  ctaSecondaryHref: string;
  badgeText: string;
  bgImageUrl?: string;
  mascotImageUrl?: string;
  companionImageUrl?: string;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  iconName: 'Truck' | 'Sparkles' | 'Heart' | 'Gift' | 'Percent' | 'Award';
  active: boolean;
}

export interface CategoryCardConfig {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  image: string;
  badge: string;
  bg: string;
  ringBorder: string;
  dotBg: string;
}

export interface EditorialConfig {
  essentialsBadge: string;
  essentialsTitle: string;
  essentialsSubtitle: string;
  essentialsDescription: string;
  essentialsButtonText: string;
  essentialsButtonHref: string;
  essentialsMainImage: string;
  
  editBadge: string;
  editTitle: string;
  editSubtitle: string;
  editDescription: string;
  editButtonText: string;
  editButtonHref: string;
  editMainImage: string;
}

export interface BrandStoryConfig {
  tag: string;
  title: string;
  description1: string;
  description2: string;
  quote: string;
  quoteAuthor: string;
  badge1: string;
  badge2: string;
  badge3: string;
}

export interface LookbookSlide {
  id: string | number;
  tag: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  badgeEmoji: string;
  buttonText?: string;
  gradient?: string;
  accentColor?: string;
  buttonBg?: string;
}

export interface WhyRexbebeItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
  active: boolean;
}

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  text: string;
  verified: boolean;
  avatar: string;
  productName: string;
  productImage: string;
  badgeEmoji: string;
}

export interface InstagramPost {
  id: string;
  image: string;
  likes: string;
  handle: string;
}

export interface HomepageConfig {
  hero: HeroConfig;
  announcements: {
    enabled: boolean;
    autoplaySpeed: number;
    items: AnnouncementItem[];
  };
  bestSellers: {
    badge: string;
    title: string;
    subtitle: string;
    maxItems: number;
    showOnlyMarkedBestSellers: boolean;
  };
  categories: CategoryCardConfig[];
  editorial: EditorialConfig;
  brandStory: BrandStoryConfig;
  lookbook: LookbookSlide[];
  whyRexbebe: WhyRexbebeItem[];
  reviews: ReviewItem[];
  instagram: {
    handle: string;
    posts: InstagramPost[];
  };
}

export type DestinationType =
  | 'HOMEPAGE'
  | 'SHOP_PAGE'
  | 'CATEGORY_PAGE'
  | 'COLLECTION_PAGE'
  | 'NEW_ARRIVALS'
  | 'SALE_PAGE'
  | 'CUSTOM_PAGE'
  | 'EXTERNAL_URL';

export type PublishStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export interface CategoryShortcutButton {
  id?: string;
  name: string;
  value: string;
  icon?: string;
  href?: string;
  order?: number;
  isHidden?: boolean;
}

export interface NavSubItem {
  id: string;
  name: string;
  pageTitle?: string;
  slug?: string;
  href: string;
  badge?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: CategoryShortcutButton[];
  status?: PublishStatus;
  destinationType?: DestinationType | string;
  destinationReference?: string;
  order?: number;
  isActive?: boolean;
  openInNewTab?: boolean;
  image?: string;
  icon?: string;
  seoTitle?: string;
  seoDescription?: string;
  parentId?: string;
}

export interface NavSubGroup {
  id: string;
  title: string;
  slug?: string;
  href: string;
  description?: string;
  destinationType?: DestinationType | string;
  order?: number;
  subItems: NavSubItem[];
}

export interface NavItemConfig {
  id: string;
  name: string;
  pageTitle?: string;
  slug?: string;
  href: string;
  badge?: string;
  description?: string;
  shortDescription?: string;
  detailedDescription?: string;
  bannerImage?: string;
  thumbnailImage?: string;
  galleryImages?: string[];
  assignedProductIds?: string[];
  shortcutButtons?: CategoryShortcutButton[];
  status?: PublishStatus;
  order: number;
  isActive: boolean;
  destinationType?: DestinationType | string;
  destinationReference?: string;
  openInNewTab?: boolean;
  dropdownType?: string;
  image?: string;
  icon?: string;
  seoTitle?: string;
  seoDescription?: string;
  subGroups?: NavSubGroup[];
}

export interface NavigationConfig {
  items: NavItemConfig[];
}

export interface VisitorLog {
  id: string;
  ip: string;
  countryCode: string;
  countryName: string;
  city: string;
  region: string;
  flag: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  page: string;
  referrer: string;
  timestamp: string;
  visitsCount: number;
  isOnline?: boolean;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  topCountry: string;
  topCountryVisits: number;
  liveVisitors: number;
}
