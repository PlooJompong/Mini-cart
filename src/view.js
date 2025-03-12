/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

// const { state } = store('create-block', {
//   state: {
//     get themeText() {
//       return state.isDark ? state.darkText : state.lightText;
//     },
//   },
//   actions: {
//     toggleOpen() {
//       const context = getContext();
//       context.isOpen = !context.isOpen;
//     },
//     toggleTheme() {
//       state.isDark = !state.isDark;
//     },
//   },
//   callbacks: {
//     logIsOpen: () => {
//       const { isOpen } = getContext();
//       // Log the value of `isOpen` each time it changes.
//       console.log(`Is open: ${isOpen}`);
//     },
//   },
// });

// Mini-cart global state.
const { state, actions } = store('mini-cart', {
  state: {
    cartItems: 0,
    cartData: null, // Store full cart data
    isLoading: false,
  },
  actions: {
    async fetchCart() {
      state.isLoading = true;
      try {
        const response = await fetch('/wp-json/wc/store/v1/cart');
        const data = await response.json();
        console.log('Fetched Cart:', data);

        // Update state with WooCommerce cart data
        state.cartData = data;
        state.cartItems = data.items_count; // Update cart count
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        state.isLoading = false;
      }
    },
  },
  callbacks: {
    callbacksLog: () => {
      console.log(`Cart updated: ${state.cartItems}`);
    },
  },
});

actions.fetchCart();
