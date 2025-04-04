import { store } from '@wordpress/interactivity';
import { formatPrice } from './utils/helpers.js';

const { state, actions } = store('mini-cart', {
  state: {
    isOpen: false,
    cartIsEmpty: true,
    cartData: { items: [], items_count: 0 },
    apiNonce: '',
  },
  actions: {
    toggleCart() {
      state.isOpen = !state.isOpen;
    },

    // Fetch cart items
    async fetchCart() {
      try {
        const response = await fetch('/wp-json/wc/store/v1/cart');

        if (!response.ok) {
          throw new Error(`Error fetching cart: ${response.status}`);
        }

        const data = await response.json();

        // Check if data exists and has expected structure
        if (!data) {
          console.error('Cart data is undefined or null');
          return;
        }

        // Check is the cart is empty
        if (parseInt(data.items_count) <= 0) {
          state.cartIsEmpty = true;
        } else {
          state.cartIsEmpty = false;
        }

        // Defensively access items array
        if (!data.items || !Array.isArray(data.items)) {
          console.warn('Cart items is not an array or is undefined');
          data.items = []; // Initialize as empty array if undefined
        }

        // Get currency formatting preferences from Woocommerce
        const thousandSep = data.totals.currency_thousand_separator || ' ';
        const decimalSep = data.totals.currency_decimal_separator || ',';

        // Add formatted_total_price to data.totals
        data.totals.formatted_total_price = formatPrice(
          parseInt(data.totals.total_price),
          data.totals.currency_symbol,
          thousandSep,
          decimalSep
        );

        if (data.items.length) {
          if (!data.totals) {
            console.warn('Cart totals is undefined');
            data.totals = {};
          }

          // Remove <p></p> from item.description and item.short_description
          const cleanDescription = (text) => {
            return text
              ? new DOMParser().parseFromString(text, 'text/html').body
                  .textContent || ''
              : '';
          };

          data.items.forEach((item) => {
            try {
              // Ensure required nested objects exist
              if (!item.prices) item.prices = {};
              if (!item.totals) item.totals = {};

              // Add onSale to the item
              item.onSale =
                parseInt(item.prices.regular_price) !==
                parseInt(item.prices.sale_price);

              if (item.type === 'variation') {
                item.is_type_variation = true;
              } else {
                item.is_type_variation = false;
              }

              // Get first image source
              if (
                item.images &&
                Array.isArray(item.images) &&
                item.images.length > 0
              ) {
                item.firstImageSrc = item.images[0];
              }

              // Add formatted_regular_price per item to item.prices
              item.prices.formatted_regular_price = formatPrice(
                parseInt(item.prices.regular_price),
                item.prices.currency_symbol,
                thousandSep,
                decimalSep
              );

              // Add formatted_sale_price per item to item.prices
              item.prices.formatted_sale_price = formatPrice(
                parseInt(item.prices.sale_price),
                item.prices.currency_symbol,
                thousandSep,
                decimalSep
              );

              // Add formatted_discount_amount per item to item.prices
              const discountAmount =
                parseInt(item.prices.regular_price) -
                parseInt(item.prices.sale_price);
              item.prices.formatted_discount_amount = formatPrice(
                discountAmount,
                item.prices.currency_symbol,
                thousandSep,
                decimalSep
              );

              // Add formatted_total_price per item to item.totals
              item.totals.formatted_total_price = formatPrice(
                item.totals.line_total,
                item.totals.currency_symbol,
                thousandSep,
                decimalSep
              );

              // Add formatted_total_discount per item to item.totals
              const totalDiscountPrice = discountAmount * item.quantity;
              item.totals.formatted_total_discount = formatPrice(
                totalDiscountPrice,
                item.totals.currency_symbol,
                thousandSep,
                decimalSep
              );

              // Check for description to use
              item.use_description =
                cleanDescription(item.short_description) ||
                cleanDescription(item.description);
            } catch (itemError) {
              console.error('Error processing cart item:', itemError, item);
            }
          });
        }

        // Save data to localStorage
        localStorage.setItem('mini-cart', JSON.stringify(data));

        // Save nonce from response headers for POST request
        const nonce = response.headers.get('nonce');

        if (nonce !== state.apiNonce) {
          state.apiNonce = nonce;

          localStorage.setItem(
            'mini-cart-nonce',
            JSON.stringify({ nonce: state.apiNonce })
          );
        }

        console.log('Fetched Cart:', data);
        console.log('Nonce saved:', nonce);

        // Update state with WooCommerce cart data
        state.cartData = data;
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    },

    // Update cart item
    async updateCartItem(key, quantity) {
      try {
        const response = await fetch('/wp-json/wc/store/v1/cart/update-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            nonce: state.apiNonce,
          },
          body: JSON.stringify({
            key: key,
            quantity: quantity,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update cart item');
        }

        // Refresh the cart after updating
        actions.fetchCart();
      } catch (error) {
        console.error('Error updating cart item:', error);
      }
    },

    // Remove cart item
    async removeCartItem(key) {
      try {
        const response = await fetch('/wp-json/wc/store/v1/cart/remove-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            nonce: state.apiNonce,
          },
          body: JSON.stringify({
            key: key,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to remove cart item');
        }

        // Refresh the cart after removing
        actions.fetchCart();
      } catch (error) {
        console.error('Error removing cart item:', error);
      }
    },

    // Decrease quantity
    decreaseQuantity(event) {
      const key = event.target.getAttribute('key');
      // Find the current item in the cart state
      const item = state.cartData.items.find((item) => item.key === key);

      if (!item) {
        return;
      }

      if (item.quantity <= 1) {
        actions.removeCartItem(key);
        return;
      }

      // Otherwise decrease quantity
      const newQuantity = Math.max(
        parseInt(item.quantity_limits.minimum || 1),
        item.quantity - 1
      );
      actions.updateCartItem(key, newQuantity);
    },

    // Increase quantity
    increaseQuantity(event) {
      const key = event.target.getAttribute('key');
      // Find the current item in the cart state
      const item = state.cartData.items.find((item) => item.key === key);

      if (!item) {
        return;
      }

      const maximum = parseInt(item.quantity_limits.maximum || Infinity);

      // Check if already at maximum quantity
      if (item.quantity >= maximum) {
        // Already at max, do nothing
        return;
      }

      // Otherwise increase quantity
      const newQuantity = Math.min(maximum, item.quantity + 1);
      actions.updateCartItem(key, newQuantity);
    },

    // Update quantity
    updateQuantityFromInput(event) {
      const key = event.target.getAttribute('key');
      let newQuantity = parseInt(event.target.value);
      const item = state.cartData.items.find((item) => item.key === key);

      if (!item) {
        return;
      }

      const minimum = parseInt(item.quantity_limits.minimum || 1);
      const maximum = parseInt(item.quantity_limits.maximum || Infinity);

      // If value is less than 1, set to 1 or minimum
      if (newQuantity < 1) {
        newQuantity = minimum;
        // Update the input value visually
        event.target.value = newQuantity;
      }

      // If value exceeds maximum, cap at maximum
      if (newQuantity > maximum) {
        newQuantity = maximum;
        // Update the input value visually
        event.target.value = newQuantity;
      }

      actions.updateCartItem(key, newQuantity);
    },

    // Remove item
    removeItem(event) {
      const key = event.target.getAttribute('key');

      if (!key) {
        return;
      }

      actions.removeCartItem(key);
    },

    // Listeners for Woocommerce add to cart buttons
    setupListeners() {
      document.addEventListener('wc-blocks_added_to_cart', () => {
        console.log('wc blocks added to cart');
        actions.fetchCart();
      });
    },
  },
  callbacks: {
    // Initialize strore on page load
    initializeStore() {
      actions.fetchCart();
      actions.setupListeners();
    },
  },
});
