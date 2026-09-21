const test = require('node:test');
const assert = require('node:assert/strict');
const { lines, totals, number, dateWhere } = require('../utils/domain');
test('checkout calculates discounted tax and rounds currency', () => { assert.deepEqual(totals(100, 10, 5), { totalAmount: 100, discount: 10, taxRate: 5, taxAmount: 4.5, netAmount: 94.5 }); assert.equal(totals(0.3,0,5).netAmount,0.32); });
test('invalid stock and monetary input is rejected', () => { for (const v of [-1,1.5,NaN,Infinity,'',null]) assert.throws(()=>number(v,'Stock',true)); assert.throws(()=>totals(10,11,0)); assert.throws(()=>totals(10,0,101)); });
test('checkout rejects empty, duplicate and negative quantities',()=>{for(const items of [[],[{productId:'a',quantity:-1}],[{productId:'a',quantity:1},{productId:'a',quantity:1}]]) assert.throws(()=>lines(items));});
test('date range covers entire end date and rejects reversal',()=>{assert.equal(dateWhere({endDate:'2026-09-20'}).createdAt.lte.toISOString(),'2026-09-20T23:59:59.999Z');assert.throws(()=>dateWhere({startDate:'2026-09-21',endDate:'2026-09-20'}));});
