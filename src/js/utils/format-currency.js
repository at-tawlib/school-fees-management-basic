export function fCurrency(number) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  });
  return formatter.format(number);
}

// TODO: Try and use this GH₵ symbol in the currency formatter