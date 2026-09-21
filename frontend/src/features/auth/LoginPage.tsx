import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { authApi } from './api';
import { handleApiError } from '@/lib/api';
export function LoginPage(){
 const navigate=useNavigate(),setAuth=useAuthStore(s=>s.setAuth);
 const [setup,setSetup]=useState(false),[role,setRole]=useState<'ADMIN'|'STAFF'|'CASHIER'|'USER'>('ADMIN'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const submit = async (e: React.FormEvent) => {
   e.preventDefault();
   setBusy(true);
   setError('');
   try {
     const response = setup
       ? await authApi.setup({ name, email, password })
       : await authApi.login({ email, password });
     if (!setup) {
       const validRole = role === 'USER'
         ? response.user.role !== 'ADMIN'
         : response.user.role === (role === 'CASHIER' ? 'STAFF' : role);
       if (!validRole) throw new Error(`This account is not registered as ${role.toLowerCase()}.`);
     }
     setAuth(response.user, response.accessToken, response.refreshToken);
     navigate('/dashboard', { replace: true });
   } catch (error) {
     setError(handleApiError(error));
   } finally {
     setBusy(false);
   }
 };
 const selectRole=(nextRole:'ADMIN'|'STAFF'|'CASHIER'|'USER')=>{setRole(nextRole);setError('');};
 return <div className="p-6 space-y-5"><div><h2 className="text-xl font-bold">{setup?'Set up your administrator':'Sign in to your account'}</h2><p className="text-sm text-slate-500 mt-2">{setup?'Create the first administrator on an empty database. Existing administrators add staff in Settings.':'Enter your email and password to continue.'}</p></div>{!setup&&<div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Account type"><button type="button" role="tab" aria-selected={role==='ADMIN'} className={`rounded-lg border px-2 py-2 text-sm font-medium ${role==='ADMIN'?'border-indigo-600 bg-indigo-50 text-indigo-700':'border-slate-200 text-slate-600'}`} onClick={()=>selectRole('ADMIN')}>Admin</button><button type="button" role="tab" aria-selected={role==='USER'} className={`rounded-lg border px-2 py-2 text-sm font-medium ${role==='USER'?'border-indigo-600 bg-indigo-50 text-indigo-700':'border-slate-200 text-slate-600'}`} onClick={()=>selectRole('USER')}>User</button><button type="button" role="tab" aria-selected={role==='STAFF'} className={`rounded-lg border px-2 py-2 text-sm font-medium ${role==='STAFF'?'border-indigo-600 bg-indigo-50 text-indigo-700':'border-slate-200 text-slate-600'}`} onClick={()=>selectRole('STAFF')}>Staff</button><button type="button" role="tab" aria-selected={role==='CASHIER'} className={`rounded-lg border px-2 py-2 text-sm font-medium ${role==='CASHIER'?'border-indigo-600 bg-indigo-50 text-indigo-700':'border-slate-200 text-slate-600'}`} onClick={()=>selectRole('CASHIER')}>Cashier</button></div>}<form onSubmit={submit} className="space-y-4">{setup&&<Input label="Full name" autoComplete="name" required value={name} onChange={e=>setName(e.target.value)}/>}<Input label="Email address" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/><Input label="Password" type="password" autoComplete={setup?'new-password':'current-password'} minLength={setup?8:undefined} required value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<Button type="submit" className="w-full" isLoading={busy}>{setup?'Create administrator':`Sign in as ${role.charAt(0)+role.slice(1).toLowerCase()}`}</Button></form><div className="flex justify-between gap-3 text-sm"><Link to="/reset-password" className="text-indigo-600">Forgot password?</Link><button type="button" className="text-indigo-600" onClick={()=>{setSetup(!setup);setError('');}}>{setup?'Back to sign in':'First-time setup'}</button></div></div>;
}
