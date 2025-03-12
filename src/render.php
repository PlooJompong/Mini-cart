<?php
/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * The following variables are exposed to the file:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @package MiniCartPlugin
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

// Generates a unique id for aria-controls.
// $unique_id = wp_unique_id( 'p-' );.

// Mini cart global state.
wp_interactivity_state(
	'mini-cart',
	array(
		'isOpen' => false,
	)
);

?>

<!-- Mini cart -->
<div class="mini-cart"
	data-wp-interactive="mini-cart"
	data-wp-watch="callbacks.callbacksLog"
	<?php echo wp_interactivity_data_wp_context( array( 'isOpen' => false ) ); ?>
	<?php echo get_block_wrapper_attributes(); ?>>

	<h2 class="mini-cart__heading">Your cart (<span data-wp-text="state.cartItems"></span> items)</h2>

	<div class="mini-cart__product-wrapper-grid-cols-3">
		<div class="product-wrapper__product-img">
			<a href="#" class="product-img-wrapper__image">
				<img src="#" alt="Product Image" />
			</a>
		</div>

		<div class="product-wrapper__product-info">
			<div class="product-info__name-wrapper">
				<a href="#" class="name-wrapper__name">
					Product name
				</a>
			</div>

			<div class="product-info__price-wrapper">
				{/* is-discount */}
				<span class="price-wrapper__price">20,00 kr</span>
				{/* Display if item is-discount */}
				<span class="price-wrapper__price-discount">10,00 kr</span>
			</div>

			<div class="product-info__sale-badge-wrapper">
				<span class="sale-badge-wrapper__sale">save 10,00 kr</span>
			</div>

			<div class="product-info__description-wrapper">
				<p class="description-wrapper__description">
					Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dolorum
					sit ea temporibus dignissimos facilis veritatis.
				</p>
				<ul class="description-wrapper__description-list">
					<li class="description-list__details">Size: M</li>
					<li class="description-list__details">Logo: Yes</li>
				</ul>
			</div>

			<div class="product-info__quantity-wrapper">
				<div class="quantity-wrapper__quantity-selector">
					<button class="quantity-selector__decrease quantity-selector__button">
						-
					</button>
					<input
						type="number"
						min="1"
						step="1"
						max="9999"
						value="1"
						class="quantity-selector__quantity" />
					<button class="quantity-selector__increase quantity-selector__button">
						+
					</button>
				</div>

				<button class="quantity-wrapper__quantity-remove">
					Remove item
				</button>
			</div>
		</div>

		<div class="product-wrapper__product-total-price">
			<span class="product-total-price__price">20,00 kr</span>
		</div>
	</div>
</div>
