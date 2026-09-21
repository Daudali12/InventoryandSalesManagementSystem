const fail = (message, status = 400) => { throw { status, message }; };
const number = (value, name, integer = false) => {
  const n = Number(value);
  if (value === '' || value == null || !Number.isFinite(n) || n < 0 || (integer && !Number.isSafeInteger(n))) fail(`${name} must be a non-negative ${integer ? 'integer' : 'number'}.`);
  return n;
};
const money = n => Math.round((n + Number.EPSILON) * 100) / 100;
const lines = items => {
  if (!Array.isArray(items) || !items.length) fail('At least one item is required.');
  const seen = new Set();
  for (const item of items) {
    if (!item.productId || seen.has(item.productId)) fail('Select each product only once.');
    seen.add(item.productId);
    if (!number(item.quantity, 'Quantity', true)) fail('Quantity must be greater than zero.');
  }
  return items;
};
const totals = (subtotal, discount, rate) => {
  discount = number(discount, 'Discount'); rate = number(rate, 'Tax rate');
  if (discount > subtotal || rate > 100) fail('Discount or tax rate is out of range.');
  const taxAmount = money((subtotal - discount) * rate / 100);
  return { totalAmount: money(subtotal), discount: money(discount), taxRate: rate, taxAmount, netAmount: money(subtotal - discount + taxAmount) };
};
const dateWhere = ({ startDate, endDate }) => {
  const range = {};
  if (startDate) range.gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) range.lte = new Date(`${endDate}T23:59:59.999Z`);
  if (Object.values(range).some(d => Number.isNaN(d.getTime())) || (range.gte && range.lte && range.gte > range.lte)) fail('Invalid date range.');
  return Object.keys(range).length ? { createdAt: range } : {};
};
module.exports = { fail, number, money, lines, totals, dateWhere };
