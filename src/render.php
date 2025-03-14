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

?>

<!-- Mini cart -->
<div class="mini-cart"
	data-wp-interactive="mini-cart"
	data-wp-watch="callbacks.callbacksLog"
	<?php echo get_block_wrapper_attributes(); ?>>

	<!-- Heading -->
	<h2 class="mini-cart__heading">
		<?php esc_html_e( 'Your cart (', 'mini-cart' ); ?>
		<span data-wp-text="state.cartData.items_count"></span>
		<?php esc_html_e( ' items )', 'mini-cart' ); ?>
	</h2>

	<!-- Loop items -->
	<template data-wp-each="state.cartData.items">
		<div class="mini-cart__product-wrapper-grid-cols-3">

			<!-- First column -->
			<div class="product-wrapper__product-img">
				<a data-wp-bind--href="context.item.permalink" class="product-img-wrapper__image">
					<!-- Loop items image -->
					<template data-wp-each--images="context.item.images">
						<img data-wp-bind--src="context.images.src" data-wp-bind--alt="context.images.alt" />
					</template>
				</a>
			</div>

			<!-- Second column -->
			<div class="product-wrapper__product-info">
				<div class="product-info__name-wrapper">
					<!-- Name -->
					<a data-wp-bind--href="context.item.permalink" class="name-wrapper__name" data-wp-text="context.item.name">
					</a>

					<!-- Sku -->
					<p class="name-wrapper__sku">
						<?php esc_html_e( 'Art.nr', 'mini-cart' ); ?>
						<span data-wp-text="context.item.sku"></span>
					</p>
				</div>

				<!-- Prices -->
				<div class="product-info__price-wrapper">
					<!-- Regular price -->
					<div class="price-wrapper__price"
						data-wp-class--is-discount="context.item.onSale">
						<span data-wp-text="context.item.prices.formatted_regular_price"></span>
					</div>

					<!-- Sale price -->
					<div class="price-wrapper__price-discount"
						data-wp-bind--hidden="!context.item.onSale">
						<span data-wp-text="context.item.prices.formatted_sale_price"></span>
					</div>
				</div>

				<div class="product-info__sale-badge-wrapper" data-wp-bind--hidden="!context.item.onSale">
					<!-- Save amount -->
					<p class="sale-badge-wrapper__sale">
						<?php esc_html_e( 'spara', 'mini-cart' ); ?>
						<span data-wp-text="context.item.prices.formatted_discount_amount"></span>
					</p>
				</div>

				<div class="product-info__description-wrapper">
					<!-- Description -->
					<p class="description-wrapper__description" data-wp-text="context.item.use_description">
					</p>

					<ul class="description-wrapper__description-list" data-wp-bind--hidden="context.item.type === 'variation'">
						<!-- Loop items attributes -->
						<template data-wp-each--variation="context.item.variation">
							<li>
								<span data-wp-text="context.variation.attribute"></span>:
								<span data-wp-text="context.variation.value"></span>
							</li>
						</template>
					</ul>
				</div>

				<div class="product-info__quantity-wrapper">
					<div class="quantity-wrapper__quantity-selector">

						<!-- -1 button -->
						<button class="quantity-selector__decrease quantity-selector__button"
						data-wp-bind--key="context.item.key"
						data-wp-on--click="actions.decreaseQuantity">
							<?php esc_html_e( '-', 'mini-cart' ); ?>
						</button>

						<!-- Quantity input -->
						<input
							class="quantity-selector__quantity" 
							data-wp-bind--key="context.item.key"
							data-wp-bind--value="context.item.quantity"
							type="number"
							data-wp-bind--min="context.item.quantity_limits.minimum"
							data-wp-bind--step="context.item.quantity_limits.multiple_of"
							data-wp-bind--max="context.item.quantity_limits.maximum"
							data-wp-on--change="actions.updateQuantityFromInput"/>

						<!-- +1 button -->
						<button class="quantity-selector__increase quantity-selector__button"
							data-wp-bind--key="context.item.key"
							data-wp-on--click="actions.increaseQuantity"
							>
							<?php esc_html_e( '+', 'mini-cart' ); ?>
						</button>
					</div>

					<!-- Remove item button -->
					<button class="quantity-wrapper__quantity-remove"
						data-wp-bind--key="context.item.key"
						data-wp-on--click="actions.removeItem">
					</button>
				</div>
			</div>

			<!-- Third column -->
			<div class="product-wrapper__product-total-price">
				<div class="product-total-price__price">
					<!-- Total price -->
					<span data-wp-text="context.item.totals.formatted_total_price"></span>
				</div>

				<div class="product-info__sale-badge-wrapper" data-wp-bind--hidden="!context.item.onSale">
					<!-- Total save amount -->
					<p class="sale-badge-wrapper__sale">
						<?php esc_html_e( 'spara', 'mini-cart' ); ?>
						<span data-wp-text="context.item.totals.formatted_total_discount"></span>
					</p>
				</div>
			</div>
		</div>
	</template>
</div>
