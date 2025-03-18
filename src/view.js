import { store } from '@wordpress/interactivity';

const { state, actions } = store('mini-cart', {
  state: {
    isOpen: false,
    cartData: { items: [], items_count: 0 },
    apiNonce: '',
  },
  actions: {
    toggleCart() {
      state.isOpen = !state.isOpen;
      console.log(state.isOpen);
    },

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
          Number(data.totals.total_price),
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
                Number(item.prices.regular_price) !==
                Number(item.prices.sale_price);

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
                Number(item.prices.regular_price),
                item.prices.currency_symbol,
                thousandSep,
                decimalSep
              );

              // Add formatted_sale_price per item to item.prices
              item.prices.formatted_sale_price = formatPrice(
                Number(item.prices.sale_price),
                item.prices.currency_symbol,
                thousandSep,
                decimalSep
              );

              // Add formatted_discount_amount per item to item.prices
              const discountAmount =
                Number(item.prices.regular_price) -
                Number(item.prices.sale_price);
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
      if (item) {
        // If quantity would go below 1, remove the item instead
        if (item.quantity <= 1) {
          actions.removeCartItem(key);
          return;
        }

        // Otherwise decrease quantity
        const newQuantity = Math.max(
          Number(item.quantity_limits.minimum || 1),
          item.quantity - 1
        );
        actions.updateCartItem(key, newQuantity);
      }
    },

    // Increase quantity
    increaseQuantity(event) {
      const key = event.target.getAttribute('key');
      // Find the current item in the cart state
      const item = state.cartData.items.find((item) => item.key === key);

      if (item) {
        const maximum = Number(item.quantity_limits.maximum || Infinity);

        // Check if already at maximum quantity
        if (item.quantity >= maximum) {
          // Already at max, do nothing
          return;
        }

        // Otherwise increase quantity
        const newQuantity = Math.min(maximum, item.quantity + 1);
        actions.updateCartItem(key, newQuantity);
      }
    },

    // Update quantity
    updateQuantityFromInput(event) {
      const key = event.target.getAttribute('key');
      let newQuantity = Number(event.target.value);
      const item = state.cartData.items.find((item) => item.key === key);

      if (item) {
        const minimum = Number(item.quantity_limits.minimum || 1);
        const maximum = Number(item.quantity_limits.maximum || Infinity);

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
      }
    },

    // Remove item
    removeItem(event) {
      const key = event.target.getAttribute('key');
      actions.removeCartItem(key);
    },

    // Listeners for Woocommerce add to cart buttons
    setupListeners() {
      if (typeof jQuery !== 'undefined') {
        const $ = jQuery;

        // Listen for clicks on all add to cart buttons
        $(document).on('click', '.add_to_cart_button', function (e) {
          // Set a small timeout to give WooCommerce time to process the request
          setTimeout(function () {
            console.log('Add to cart button clicked, refreshing mini-cart');
            actions.fetchCart();
          }, 450);
        });

        // Keep the standard events as backup
        $(document.body).on(
          'added_to_cart removed_from_cart updated_cart_totals wc_fragments_refreshed',
          function () {
            console.log('Cart event triggered, refreshing mini-cart');
            actions.fetchCart();
          }
        );

        // For the blocks interface specifically
        document.addEventListener('DOMContentLoaded', function () {
          // Find all add to cart buttons managed by the WC Blocks
          const wcBlockButtons = document.querySelectorAll(
            '.wc-block-components-product-button__button'
          );

          wcBlockButtons.forEach((button) => {
            button.addEventListener('click', function () {
              setTimeout(function () {
                console.log('WC Block button clicked, refreshing mini-cart');
                actions.fetchCart();
              }, 450);
            });
          });
        });

        // ---------
        // Add listeners for the WooCommerce Blocks quantity selector
        $(document).on(
          'change',
          '.wc-block-components-quantity-selector__input',
          function () {
            setTimeout(function () {
              console.log('Quantity changed, refreshing mini-cart');
              actions.fetchCart();
            }, 850); // Slightly longer timeout for quantity changes
          }
        );

        // Add listeners for the plus/minus buttons in quantity selector
        $(document).on(
          'click',
          '.wc-block-components-quantity-selector__button',
          function () {
            setTimeout(function () {
              console.log('Quantity button clicked, refreshing mini-cart');
              actions.fetchCart();
            }, 850);
          }
        );

        // Add listeners for the remove link in WooCommerce Blocks
        $(document).on(
          'click',
          '.wc-block-cart-item__remove-link',
          function () {
            setTimeout(function () {
              console.log('Item removed, refreshing mini-cart');
              actions.fetchCart();
            }, 2000);
          }
        );
        // ---------
      }
    },
  },
  callbacks: {
    initializeStore() {
      actions.fetchCart();
      actions.setupListeners();
    },
  },
});

// Helper function to format prices using WooCommerce currency settings
function formatPrice(
  price,
  currencySymbol,
  thousandSeparator = ' ',
  decimalSeparator = ','
) {
  // Convert to decimal format
  const decimalPrice = (price / 100).toFixed(2);

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = decimalPrice.split('.');

  // Add thousand separator
  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandSeparator
  );

  // Combine with decimal part using the specified decimal separator
  const formattedPrice = `${formattedInteger}${decimalSeparator}${decimalPart}`;

  // Return with currency symbol
  return `${formattedPrice} ${currencySymbol}`;
}
