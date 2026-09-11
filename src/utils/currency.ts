export function formatCurrency(
  amount: number,
  symbol: string = '₹',
  includeDecimals?: boolean
): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const shouldIncludeDecimals =
    includeDecimals !== undefined ? includeDecimals : absAmount % 1 !== 0;

  let formattedNumber = '';

  if (symbol === '₹') {
    const parts = absAmount.toFixed(shouldIncludeDecimals ? 2 : 0).split('.');
    let intPart = parts[0];
    const decPart = parts[1];

    if (intPart.length > 3) {
      const lastThree = intPart.substring(intPart.length - 3);
      const otherNumbers = intPart.substring(0, intPart.length - 3);
      const replaced = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      intPart = `${replaced},${lastThree}`;
    }

    formattedNumber = decPart !== undefined ? `${intPart}.${decPart}` : intPart;
  } else {
    formattedNumber = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: shouldIncludeDecimals ? 2 : 0,
      maximumFractionDigits: shouldIncludeDecimals ? 2 : 0,
    });
  }

  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}

export function formatCompactCurrency(amount: number, symbol: string = '₹'): string {
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? '-' : '';

  if (symbol === '₹') {
    if (abs >= 10000000) {
      return `${prefix}${symbol}${(abs / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
    }
    if (abs >= 100000) {
      return `${prefix}${symbol}${(abs / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    }
    if (abs >= 1000) {
      return `${prefix}${symbol}${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `${prefix}${symbol}${abs}`;
  }

  if (abs >= 1000000) {
    return `${prefix}${symbol}${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (abs >= 1000) {
    return `${prefix}${symbol}${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${prefix}${symbol}${abs}`;
}
