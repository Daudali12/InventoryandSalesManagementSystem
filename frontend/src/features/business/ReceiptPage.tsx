import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, handleApiError } from '@/lib/api';
import { saleApi } from '@/features/pos/api';
import type { Sale } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatters';
import { exportPDF } from './exports';
export function ReceiptPage(){
 const {id}=useParams();const [sale,setSale]=useState<Sale|null>(null),[error,setError]=useState(''),[store,setStore]=useState({storeName:'',storeAddress:'',storePhone:''});
 useEffect(()=>{Promise.all([saleApi.getById(id!),api.get('/settings')]).then(([s,c])=>{setSale(s);setStore(c.data);}).catch(e=>setError(handleApiError(e)));},[id]);
 const log=()=>api.post(`/sales/${id}/invoice`).catch(()=>{});
 if(error)return <p role="alert">{error}</p>;if(!sale)return <p>Loading receipt…</p>;
 return <div className="max-w-2xl mx-auto bg-white p-6 space-y-5 receipt"><div className="print:hidden flex gap-3"><Link to="/sales"><Button variant="outline">Sales history</Button></Link><Button onClick={()=>{log();window.print();}}>Print receipt</Button><Button onClick={()=>{log();exportPDF(`${store.storeName} - ${sale.invoiceNumber}`,['Item','Qty','Unit price','Subtotal'],[...sale.items.map(i=>[i.product?.name||'Product',i.quantity,i.unitPrice,i.subtotal]),['Discount','','',-sale.discount],['Tax','','',sale.taxAmount],['Total','','',sale.netAmount]]);}}>PDF</Button></div><h1 className="text-2xl font-bold">{store.storeName}</h1><p>{store.storeAddress}<br/>{store.storePhone}</p><h2 className="font-mono">{sale.invoiceNumber}</h2><p>{new Date(sale.createdAt).toLocaleString()} · {sale.status}<br/>{sale.customerName||'Walk-in customer'} · {sale.paymentMethod}<br/>Served by {sale.user?.name}</p><table className="w-full text-left"><thead><tr><th>Product</th><th>Qty</th><th>Total</th></tr></thead><tbody>{sale.items.map(i=><tr className="border-t" key={i.id}><td className="py-3">{i.product?.name}</td><td>{i.quantity}</td><td>{formatCurrency(i.subtotal)}</td></tr>)}</tbody></table><div className="border-t pt-3 space-y-2"><p>Subtotal: {formatCurrency(sale.totalAmount)}</p><p>Discount: −{formatCurrency(sale.discount)}</p><p>Tax ({sale.taxRate}%): {formatCurrency(sale.taxAmount)}</p><p className="text-xl font-bold">Total: {formatCurrency(sale.netAmount)}</p></div><p>Thank you for your purchase.</p></div>;
}
