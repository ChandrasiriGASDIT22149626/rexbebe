import { fetchApi } from './api';
import { NavigationConfig } from '../types/admin';
import { DEFAULT_NAVIGATION_CONFIG } from './defaultData';

const orderNavItems = (items: any[]) => {
  if (!Array.isArray(items)) return items;
  let list = [...items];

  const homeIndex = list.findIndex(
    (i: any) => i.id === 'nav-home' || i.href === '/' || i.name?.toUpperCase() === 'HOME'
  );
  let homeItem = homeIndex !== -1 ? list.splice(homeIndex, 1)[0] : {
    id: 'nav-home',
    name: 'HOME',
    pageTitle: 'HOME',
    slug: 'home',
    href: '/',
    order: 1,
    status: 'published',
    isActive: true,
    destinationType: 'HOMEPAGE',
  };

  const aboutIndex = list.findIndex(
    (i: any) => i.id === 'nav-about' || i.href === '/about' || i.name?.toUpperCase() === 'ABOUT US'
  );
  let aboutItem = aboutIndex !== -1 ? list.splice(aboutIndex, 1)[0] : {
    id: 'nav-about',
    name: 'ABOUT US',
    pageTitle: 'ABOUT US',
    slug: 'about-us',
    href: '/about',
    order: 2,
    status: 'published',
    isActive: true,
    destinationType: 'CUSTOM_PAGE',
  };
  aboutItem.order = 2;

  const contactIndex = list.findIndex(
    (i: any) => i.id === 'nav-contact' || i.href === '/contact' || i.name?.toUpperCase() === 'CONTACT US'
  );
  let contactItem = contactIndex !== -1 ? list.splice(contactIndex, 1)[0] : {
    id: 'nav-contact',
    name: 'CONTACT US',
    pageTitle: 'CONTACT US',
    slug: 'contact-us',
    href: '/contact',
    order: 999,
    status: 'published',
    isActive: true,
    destinationType: 'CUSTOM_PAGE',
  };
  contactItem.order = 999;

  list.sort((a, b) => (a.order || 0) - (b.order || 0));

  return [homeItem, aboutItem, ...list, contactItem];
};

export const navigationService = {
  // Public: Get published active navigation tree
  async getPublicNavigation(): Promise<NavigationConfig> {
    try {
      const data = await fetchApi<NavigationConfig>('/navigation');
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        data.items = orderNavItems(data.items);
        return data;
      }
    } catch (err) {
      console.warn('[navigationService] Could not fetch public navigation from API, using fallback:', err);
    }
    return DEFAULT_NAVIGATION_CONFIG;
  },

  // Admin: Get all items including inactive
  async getAllNavigation(): Promise<NavigationConfig> {
    try {
      const data = await fetchApi<NavigationConfig>(`/navigation/all?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        data.items = orderNavItems(data.items);
        return data;
      }
    } catch (err) {
      // Try /admin/navigation fallback
      try {
        const adminData = await fetchApi<NavigationConfig>(`/admin/navigation?_t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (adminData && Array.isArray(adminData.items) && adminData.items.length > 0) {
          adminData.items = orderNavItems(adminData.items);
          return adminData;
        }
      } catch (adminErr) {
        console.warn('[navigationService] Could not fetch admin navigation from API:', adminErr);
      }
    }
    return DEFAULT_NAVIGATION_CONFIG;
  },

  // Admin: Save updated navigation configuration
  async updateNavigation(config: NavigationConfig): Promise<NavigationConfig> {
    try {
      const updated = await fetchApi<NavigationConfig>('/navigation', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      return updated;
    } catch (err) {
      console.warn('[navigationService] Backend API save failed, continuing with client persistence:', err);
      return config;
    }
  },

  // Admin: Reset to default brand configuration
  async resetNavigation(): Promise<NavigationConfig> {
    try {
      const reset = await fetchApi<NavigationConfig>('/navigation/reset', {
        method: 'POST',
      });
      return reset;
    } catch (err) {
      console.warn('[navigationService] Reset API failed, resetting to brand default:', err);
      return DEFAULT_NAVIGATION_CONFIG;
    }
  },
};
