require('dotenv').config();
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
(async()=>{let browser;try{
 const user=await prisma.user.findFirst({where:{role:'ADMIN'},select:{id:true,name:true,email:true,role:true}});if(!user)throw Error('No admin available');
 const auth={state:{user,accessToken:jwt.sign({id:user.id,tokenType:'access'},process.env.JWT_SECRET),refreshToken:jwt.sign({id:user.id,tokenType:'refresh'},process.env.JWT_REFRESH_SECRET||process.env.JWT_SECRET),isAuthenticated:true},version:0};
 browser=await chromium.launch({headless:true,channel:'chrome'}); const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('BROWSER:',m.text());});
 await page.addInitScript(value=>localStorage.setItem('auth-storage',JSON.stringify(value)),auth);
 for(const route of ['/dashboard','/products','/inventory','/sales','/customers','/suppliers','/purchases','/reports','/settings','/activity','/profile','/pos']){await page.goto('http://localhost:5000'+route);await page.locator('h1,h2').first().waitFor({timeout:10000});await page.waitForTimeout(650);if(await page.getByText('Unexpected Application Error!').count())throw Error('Route crashed '+route);console.log('Loaded',route);}
 await page.screenshot({path:'../docs/pos-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5000/pos');await page.waitForTimeout(800);await page.screenshot({path:'../docs/pos-mobile.png',fullPage:true});
 console.log('Mobile body width:',await page.evaluate(()=>document.body.scrollWidth));
 await page.goto('http://localhost:5000/dashboard');await page.waitForTimeout(600);await page.screenshot({path:'../docs/dashboard-mobile.png',fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS browser routes: no uncaught page errors.');
}finally{await browser?.close();await prisma.$disconnect();}})().catch(e=>{console.error(e);process.exitCode=1;});
