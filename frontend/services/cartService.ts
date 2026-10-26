import { fetchApi } from './api';

export const cartService = {
  async getCart(cartId: string) {
    return fetchApi(`/cart?cartId=${cartId}`);
  },

  async addToCart(cartId: string, variantId: string, quantity: number = 1) {
    return fetchApi('/cart', {
      method: 'POST',
      body: JSON.stringify({ cartId, variantId, quantity }),
    });
  },

  async removeFromCart(cartId: string, variantId: string) {
    return fetchApi(`/cart/items/${variantId}?cartId=${cartId}`, {
      method: 'DELETE',
    });
  }
};
