const formatPKR = (amount) => {
    if (isNaN(amount) || amount === null) return 'Rs. 0.00';
    return `Rs. ${Number(amount).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

module.exports = { formatPKR };