// Helper function to format prices using WooCommerce currency settings
const formatPrice = (
  price,
  currencySymbol,
  thousandSeparator = ' ',
  decimalSeparator = ','
) => {
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
};

export { formatPrice };
