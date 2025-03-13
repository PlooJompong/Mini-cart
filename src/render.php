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

// Mini cart global state.
wp_interactivity_state(
	'mini-cart',
	array( 'isOpen' => false )
) ?>

<!-- Mini cart -->
<div class="mini-cart"
	data-wp-interactive="mini-cart"
	data-wp-watch="callbacks.callbacksLog"

	<?php
	echo get_block_wrapper_attributes();
	echo wp_interactivity_data_wp_context( array( 'isOpen' => false ) );
	?>
	>

	<h2 class="mini-cart__heading">Your cart (<span data-wp-text="state.cartItems"></span> items)</h2>

	<div class="mini-cart__product-wrapper-grid-cols-3" data-wp-bind--hidden="!state.cartData">
		<!-- Cart items will be dynamically rendered here by JavaScript -->
	</div>
</div>
