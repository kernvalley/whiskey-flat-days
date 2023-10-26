/* eslint-env node */
const stripeRate = 0.029;
const stripeFlatCharge = 0.3;
const taxRate = 0.0725;
const currency = 'USD';
const collection = 'orders';
const productsFile = './_data/store.yml';
const allowedAvailibility = ['InStock', 'PreOrder','PreSale', 'OnlineOnly', 'LimitedAvailability'];

exports.stripeRate = stripeRate;
exports.stripeFlatCharge = stripeFlatCharge;
exports.taxRate = taxRate;
exports.currency = currency;
exports.collection = collection;
exports.productsFile = productsFile;
exports.allowedAvailibility = allowedAvailibility;
