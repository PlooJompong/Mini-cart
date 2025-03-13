import { store } from '@wordpress/interactivity';

const { state, actions } = store('mini-cart', {
  state: {
    cartItems: 0,
    cartData: null,
    isLoading: false,
    apiNonce: '',
  },
  actions: {
    async fetchCart() {
      state.isLoading = true;
      try {
        const response = await fetch('/wp-json/wc/store/v1/cart');
        const data = await response.json();

        localStorage.setItem('mini-cart', JSON.stringify(data));

        console.log('Fetched Cart:', data);

        // Save none for POST request from response headers
        const nonce = response.headers.get('nonce');

        if (nonce !== state.apiNonce) {
          state.apiNonce = nonce;

          localStorage.setItem(
            'mini-cart-nonce',
            JSON.stringify({ nonce: state.apiNonce })
          ); // Store in localStorage if needed

          console.log('Nonce saved:', nonce);
        }

        // Update state with WooCommerce cart data
        state.cartData = data;
        state.cartItems = data.items_count;

        // Render cart items
        renderCartItems(data.items);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        state.isLoading = false;
      }
    },

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
  },
  callbacks: {
    callbacksLog: () => {
      console.log(`Cart updated: ${state.cartItems}`);
    },
  },
});

// Function to render cart items
function renderCartItems(items) {
  const container = document.querySelector(
    '.mini-cart__product-wrapper-grid-cols-3'
  );
  if (!container) return;

  // Clear existing items
  container.innerHTML = '';

  // Render each item
  items.forEach((item) => {
    const isOnSale = item.prices.sale_price !== item.prices.regular_price;

    // Calculate total savings for the item
    const totalSavings = isOnSale
      ? (item.prices.regular_price - item.prices.sale_price) * item.quantity
      : 0;

    const itemHTML = `
      <div class="product-wrapper__product-img">
        <a href="${item.permalink}" class="product-img-wrapper__image">
          <img src="${item.images[0].src}" alt="${item.images[0].alt}" />
        </a>
      </div>

      <div class="product-wrapper__product-info">
        <div class="product-info__name-wrapper">
          <a href="${item.permalink}" class="name-wrapper__name">
            ${item.name}
          </a>
        </div>

        <div class="product-info__price-wrapper">
          <span class="price-wrapper__price ${isOnSale ? 'is-discount' : ''}">
            ${formatPrice(
              item.prices.regular_price,
              item.prices.currency_symbol
            )}
          </span>
          ${
            isOnSale
              ? `
            <span class="price-wrapper__price-discount">
              ${formatPrice(
                item.prices.sale_price,
                item.prices.currency_symbol
              )}
            </span>
          `
              : ''
          }
        </div>

        ${
          isOnSale
            ? `
          <div class="product-info__sale-badge-wrapper">
            <span class="sale-badge-wrapper__sale">Save ${formatPrice(
              item.prices.regular_price - item.prices.sale_price,
              item.prices.currency_symbol
            )}</span>
          </div>
        `
            : ''
        }

        <div class="product-info__description-wrapper">
          <p class="description-wrapper__description">
            ${item.short_description || item.description}
          </p>
          <ul class="description-wrapper__description-list">
            ${item.variation
              .map(
                (variation) => `
              <li class="description-list__details">${variation.attribute}: ${variation.value}</li>
            `
              )
              .join('')}
          </ul>
        </div>

        <div class="product-info__quantity-wrapper">
          <div class="quantity-wrapper__quantity-selector">
            <button class="quantity-selector__decrease quantity-selector__button" data-key="${
              item.key
            }">
              -
            </button>
            <input
              type="number"
              min="${item.quantity_limits.minimum}"
              step="${item.quantity_limits.multiple_of}"
              max="${item.quantity_limits.maximum}"
              value="${item.quantity}"
              class="quantity-selector__quantity" data-key="${item.key}" />
            <button class="quantity-selector__increase quantity-selector__button" data-key="${
              item.key
            }">
              +
            </button>
          </div>

          <button class="quantity-wrapper__quantity-remove" data-key="${
            item.key
          }">
            Remove item
          </button>
        </div>
      </div>

      <div class="product-wrapper__product-total-price">
        <span class="product-total-price__price">${formatPrice(
          item.totals.line_total,
          item.totals.currency_symbol
        )}</span>
        ${
          isOnSale
            ? `
          <span class="product-total-price__total-sale">Save ${formatPrice(
            totalSavings,
            item.totals.currency_symbol
          )}</span>
        `
            : ''
        }
      </div>
    `;

    // Append the item HTML to the container
    container.insertAdjacentHTML('beforeend', itemHTML);
  });

  // Add event listeners for quantity changes
  addQuantityEventListeners();
}

// Helper function to format prices
function formatPrice(price, currencySymbol) {
  const formattedPrice = (price / 100).toFixed(2).replace('.', ','); // Convert to decimal format
  return `${formattedPrice} ${currencySymbol}`;
}

// Add event listeners for quantity changes
function addQuantityEventListeners() {
  const decreaseButtons = document.querySelectorAll(
    '.quantity-selector__decrease'
  );
  const increaseButtons = document.querySelectorAll(
    '.quantity-selector__increase'
  );
  const quantityInputs = document.querySelectorAll(
    '.quantity-selector__quantity'
  );
  const removeButtons = document.querySelectorAll(
    '.quantity-wrapper__quantity-remove'
  );

  // Decrease quantity
  decreaseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      const quantityInput = document.querySelector(
        `.quantity-selector__quantity[data-key="${key}"]`
      );
      let quantity = parseInt(quantityInput.value, 10);

      if (quantity > 1) {
        quantity--;
        quantityInput.value = quantity;
        actions.updateCartItem(key, quantity);
      } else {
        // Remove item if quantity is 0
        actions.removeCartItem(key);
      }
    });
  });

  // Increase quantity
  increaseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      const quantityInput = document.querySelector(
        `.quantity-selector__quantity[data-key="${key}"]`
      );
      let quantity = parseInt(quantityInput.value, 10);

      quantity++;
      quantityInput.value = quantity;
      actions.updateCartItem(key, quantity);
    });
  });

  // Allow manual input
  quantityInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.getAttribute('data-key');
      let newQuantity = parseInt(input.value, 10);

      // Get min and max limits
      const min = parseInt(input.min, 10) || 1;
      const max = parseInt(input.max, 10) || 999;

      // Validate and update
      if (isNaN(newQuantity) || newQuantity < min) {
        newQuantity = min; // Reset to minimum if invalid
      } else if (newQuantity > max) {
        newQuantity = max; // Reset to maximum if exceeded
      }

      input.value = newQuantity; // Ensure the displayed value is valid
      actions.updateCartItem(key, newQuantity);
    });
  });

  // Remove item
  removeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      actions.removeCartItem(key);
    });
  });
}

// Fetch cart data on page load
actions.fetchCart();
