require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new sqlite3.Database(path.join(DATA_DIR, 'rental-system.db'));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: DATA_DIR }),
  secret: process.env.SESSION_SECRET || 'rentalhub-local-development-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

const run = (sql, params=[]) => new Promise((resolve,reject)=>db.run(sql,params,function(e){e?reject(e):resolve({lastID:this.lastID,changes:this.changes});}));
const get = (sql, params=[]) => new Promise((resolve,reject)=>db.get(sql,params,(e,row)=>e?reject(e):resolve(row)));
const all = (sql, params=[]) => new Promise((resolve,reject)=>db.all(sql,params,(e,rows)=>e?reject(e):resolve(rows)));
const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

// Checks passwords using the Pwned Passwords k-anonymity API.
// Only the first five characters of a SHA-1 hash leave this server; the password itself never does.
const breachCache = new Map();
async function isPasswordCompromised(password) {
  const hash = crypto.createHash('sha1').update(String(password), 'utf8').digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  if (breachCache.has(prefix)) return breachCache.get(prefix).has(suffix);
  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'RentalHub3-password-security-check' },
      signal: AbortSignal.timeout(4500)
    });
    if (!response.ok) return null;
    const body = await response.text();
    const suffixes = new Set(body.split(/\r?\n/).map(line => line.split(':')[0].trim().toUpperCase()).filter(Boolean));
    breachCache.set(prefix, suffixes);
    return suffixes.has(suffix);
  } catch (error) {
    // A network/service failure must not prevent a legitimate login or password change.
    return null;
  }
}

function requireCustomer(req,res,next) {
  if (req.session.user?.role === 'customer') return next();
  return res.status(401).json({ error: 'Please log in as a customer.' });
}
function requireAdmin(req,res,next) {
  if (req.session.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Administrator access required.' });
}
function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && !Number.isNaN(Date.parse(s)); }
function rentalDays(start,end) {
  const a = Date.parse(start + 'T00:00:00Z'), b = Date.parse(end + 'T00:00:00Z');
  return Math.floor((b-a)/86400000)+1;
}
async function checkAvailability(itemId,start,end,excludeId=null) {
  const sql = `SELECT rental_id FROM rentals
    WHERE item_id=? AND rental_id != COALESCE(?, -1)
    AND NOT (end_date < ? OR start_date > ?)`;
  return (await get(sql,[itemId,excludeId,start,end])) == null;
}
async function createRental({customerId,itemId,name,email,phone,start,end,excludeId=null}) {
  if (!validDate(start) || !validDate(end) || end < start) throw Object.assign(new Error('Please select valid rental dates.'),{status:400});
  const item = await get('SELECT * FROM items WHERE item_id=? AND active_status=1',[itemId]);
  if (!item) throw Object.assign(new Error('The selected product is not available.'),{status:400});
  if (!(await checkAvailability(itemId,start,end,excludeId))) throw Object.assign(new Error('This product is already booked for the selected dates.'),{status:409});
  const days = rentalDays(start,end);
  const cost = Number((days * item.daily_price).toFixed(2));
  return { days, cost, item };
}

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE, phone TEXT NOT NULL,
    password_hash TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT, product_name TEXT NOT NULL,
    description TEXT, category TEXT NOT NULL, daily_price REAL NOT NULL CHECK(daily_price >= 0),
    image TEXT, active_status INTEGER NOT NULL DEFAULT 1)`);
  await run(`CREATE TABLE IF NOT EXISTS wishlists (
    wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL, item_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id,item_id),
    FOREIGN KEY(customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY(item_id) REFERENCES items(item_id))`);
  await run(`CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL)`);
  const savedAdmin = await get("SELECT setting_value FROM app_settings WHERE setting_key='admin_password_hash'");
  if (!savedAdmin) {
    const initialHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await run("INSERT INTO app_settings(setting_key,setting_value) VALUES('admin_password_hash',?)",[initialHash]);
  }
  await run(`CREATE TABLE IF NOT EXISTS rentals (
    rental_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER, item_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
    start_date TEXT NOT NULL, end_date TEXT NOT NULL, total_days INTEGER NOT NULL,
    total_cost REAL NOT NULL, booking_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY(item_id) REFERENCES items(item_id))`);
  await run('PRAGMA foreign_keys = ON');
  const count = await get('SELECT COUNT(*) AS n FROM items');
  if (!count.n) {
    const products = [
      ['Hyundai Creta','Comfortable SUV for city and highway travel.','Cars',3500,'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900'],
      ['Honda City','Elegant sedan with a spacious cabin.','Cars',2800,'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900'],
      ['Maruti Swift','Compact and fuel-efficient hatchback.','Cars',1800,'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900'],
      ['Royal Enfield Classic 350','Classic cruiser motorcycle for relaxed rides.','Bikes',900,'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900'],
      ['KTM Duke 200','Agile street bike with sporty performance.','Bikes',1100,'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900'],
      ['Mountain Bicycle','Multi-gear bicycle for outdoor rides.','Bikes',350,'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900'],
      ['Classic Analog Watch','Minimal everyday watch with a leather strap.','Watches',250,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900'],
      ['Premium Chronograph','Statement chronograph watch for occasions.','Watches',550,'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=900'],
      ['DSLR Camera Kit','Camera kit for events and photography.','Electronics',1500,'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900'],
      ['Laptop','Portable laptop for work and study.','Electronics',1200,'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900'],
      ['4K Projector','Projector for presentations and movie nights.','Electronics',1000,'https://images.unsplash.com/photo-1528395874238-34 ebe0b8a7b?w=900'],
      ['Power Drill Kit','Cordless drill kit for home and workshop jobs.','Equipment',450,'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900'],
      ['Portable Generator','Portable power backup for outdoor use.','Equipment',950,'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900'],
      ['Lawn Mower','Equipment for garden and lawn maintenance.','Equipment',700,'https://images.unsplash.com/photo-1599685315640-4ecf9d7f8d7e?w=900']
    ];
    for (const p of products) await run('INSERT INTO items(product_name,description,category,daily_price,image) VALUES(?,?,?,?,?)',p);
  }
}
app.get('/api/auth/me',(req,res)=>res.json({loggedIn:!!req.session.user,user:req.session.user||null}));
app.post('/api/auth/register',asyncRoute(async(req,res)=>{
  const {fullName,email,phone,password,confirmPassword}=req.body;
  if(!fullName?.trim()||!email?.trim()||!phone?.trim()||!password) return res.status(400).json({error:'All fields are required.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:'Enter a valid email address.'});
  if(password.length<6) return res.status(400).json({error:'Password must contain at least 6 characters.'});
  if(password!==confirmPassword) return res.status(400).json({error:'Passwords do not match.'});
  const hash=await bcrypt.hash(password,10);
  try {
    const r=await run('INSERT INTO customers(full_name,email,phone,password_hash) VALUES(?,?,?,?)',[fullName.trim(),email.trim().toLowerCase(),phone.trim(),hash]);
    req.session.user={id:r.lastID,name:fullName.trim(),email:email.trim().toLowerCase(),phone:phone.trim(),role:'customer'};
    res.json({message:'Registration successful.',user:req.session.user});
  } catch(e) { if(e.message.includes('UNIQUE')) return res.status(409).json({error:'This email is already registered.'}); throw e; }
}));
app.post('/api/auth/customer-login',asyncRoute(async(req,res)=>{
  const {email,password}=req.body;
  const user=await get('SELECT * FROM customers WHERE email=?',[String(email||'').trim().toLowerCase()]);
  if(!user||!(await bcrypt.compare(password||'',user.password_hash))) return res.status(401).json({error:'Invalid email or password.'});
  req.session.user={id:user.customer_id,name:user.full_name,email:user.email,phone:user.phone,role:'customer'};
  const passwordCompromised = await isPasswordCompromised(password);
  res.json({message:'Login successful.',user:req.session.user,passwordCompromised});
}));
app.post('/api/auth/admin-login',asyncRoute(async(req,res)=>{
  const username=process.env.ADMIN_USERNAME||'admin';
  const row=await get("SELECT setting_value FROM app_settings WHERE setting_key='admin_password_hash'");
  if(req.body.username!==username||!row||!(await bcrypt.compare(req.body.password||'',row.setting_value))) return res.status(401).json({error:'Invalid administrator credentials.'});
  req.session.user={id:0,name:'Administrator',email:'admin@rentalhub.local',role:'admin'};
  const passwordCompromised = await isPasswordCompromised(req.body.password || '');
  res.json({message:'Admin login successful.',user:req.session.user,passwordCompromised});
}));
app.post('/api/auth/change-password',asyncRoute(async(req,res)=>{
  const {currentPassword,newPassword,confirmPassword}=req.body;
  if(!currentPassword||!newPassword||newPassword.length<6) return res.status(400).json({error:'Enter your current password and a new password of at least 6 characters.'});
  if(newPassword!==confirmPassword) return res.status(400).json({error:'New passwords do not match.'});
  const newPasswordCompromised = await isPasswordCompromised(newPassword);
  if(newPasswordCompromised === true) return res.status(422).json({error:'This new password has appeared in known data breaches. Please choose a different password.'});
  if(req.session.user?.role==='customer'){
    const customer=await get('SELECT * FROM customers WHERE customer_id=?',[req.session.user.id]);
    if(!customer||!(await bcrypt.compare(currentPassword,customer.password_hash))) return res.status(401).json({error:'Current password is incorrect.'});
    await run('UPDATE customers SET password_hash=? WHERE customer_id=?',[await bcrypt.hash(newPassword,10),customer.customer_id]);
  } else if(req.session.user?.role==='admin'){
    const row=await get("SELECT setting_value FROM app_settings WHERE setting_key='admin_password_hash'");
    if(!row||!(await bcrypt.compare(currentPassword,row.setting_value))) return res.status(401).json({error:'Current password is incorrect.'});
    await run("UPDATE app_settings SET setting_value=? WHERE setting_key='admin_password_hash'",[await bcrypt.hash(newPassword,10)]);
  } else return res.status(401).json({error:'Please log in first.'});
  res.json({message:'Password changed successfully.'});
}));
app.get('/api/wishlist',requireCustomer,asyncRoute(async(req,res)=>{
  res.json(await all(`SELECT i.* FROM wishlists w JOIN items i ON i.item_id=w.item_id WHERE w.customer_id=? AND i.active_status=1 ORDER BY w.wishlist_id DESC`,[req.session.user.id]));
}));
app.post('/api/wishlist/:itemId',requireCustomer,asyncRoute(async(req,res)=>{
  const item=await get('SELECT item_id FROM items WHERE item_id=? AND active_status=1',[req.params.itemId]);
  if(!item) return res.status(404).json({error:'Product not found.'});
  await run('INSERT OR IGNORE INTO wishlists(customer_id,item_id) VALUES(?,?)',[req.session.user.id,item.item_id]);
  res.json({message:'Added to your wishlist.'});
}));
app.delete('/api/wishlist/:itemId',requireCustomer,asyncRoute(async(req,res)=>{
  await run('DELETE FROM wishlists WHERE customer_id=? AND item_id=?',[req.session.user.id,req.params.itemId]);
  res.json({message:'Removed from your wishlist.'});
}));
app.post('/api/auth/logout',(req,res)=>req.session.destroy(()=>res.json({message:'Logged out.'})));

app.get('/api/products',asyncRoute(async(req,res)=>{
  const {category,search}=req.query;
  let sql='SELECT * FROM items WHERE active_status=1',p=[];
  if(category&&category!=='All'){sql+=' AND category=?';p.push(category);}
  if(search){sql+=' AND (product_name LIKE ? OR description LIKE ?)';p.push(`%${search}%`,`%${search}%`);}
  res.json(await all(sql+' ORDER BY item_id DESC',p));
}));
app.get('/api/admin/products',requireAdmin,asyncRoute(async(req,res)=>res.json(await all('SELECT * FROM items ORDER BY item_id DESC'))));
app.post('/api/admin/products',requireAdmin,asyncRoute(async(req,res)=>{
  const {product_name,description,category,daily_price,image}=req.body;
  if(!product_name?.trim()||!['Cars','Bikes','Watches','Electronics','Equipment'].includes(category)||!Number.isFinite(Number(daily_price))||Number(daily_price)<0) return res.status(400).json({error:'Enter a name, valid category and non-negative daily price.'});
  const r=await run('INSERT INTO items(product_name,description,category,daily_price,image) VALUES(?,?,?,?,?)',[product_name.trim(),description||'',category,Number(daily_price),image||'']);
  res.status(201).json({message:'Product added.',item_id:r.lastID});
}));
app.put('/api/admin/products/:id',requireAdmin,asyncRoute(async(req,res)=>{
  const {product_name,description,category,daily_price,image,active_status}=req.body;
  if(!product_name?.trim()||!['Cars','Bikes','Watches','Electronics','Equipment'].includes(category)||!Number.isFinite(Number(daily_price))||Number(daily_price)<0) return res.status(400).json({error:'Please enter valid product details.'});
  const r=await run('UPDATE items SET product_name=?,description=?,category=?,daily_price=?,image=?,active_status=? WHERE item_id=?',[product_name.trim(),description||'',category,Number(daily_price),image||'',active_status===0?0:1,req.params.id]);
  if(!r.changes) return res.status(404).json({error:'Product not found.'});
  res.json({message:'Product updated.'});
}));
app.delete('/api/admin/products/:id',requireAdmin,asyncRoute(async(req,res)=>{
  const id=req.params.id,history=await get('SELECT COUNT(*) AS n FROM rentals WHERE item_id=?',[id]);
  if(history.n){await run('UPDATE items SET active_status=0 WHERE item_id=?',[id]);return res.json({message:'Product has booking history and was marked unavailable.'});}
  await run('DELETE FROM items WHERE item_id=?',[id]);res.json({message:'Product deleted.'});
}));

app.get('/api/rentals/my-bookings',requireCustomer,asyncRoute(async(req,res)=>{
  res.json(await all(`SELECT r.*,i.product_name,i.category,i.image FROM rentals r JOIN items i ON i.item_id=r.item_id WHERE r.customer_id=? ORDER BY r.rental_id DESC`,[req.session.user.id]));
}));
app.post('/api/rentals',requireCustomer,asyncRoute(async(req,res)=>{
  const {item_id,start_date,end_date}=req.body,u=req.session.user;
  const {days,cost}=await createRental({customerId:u.id,itemId:Number(item_id),name:u.name,email:u.email,phone:u.phone,start:start_date,end:end_date});
  const r=await run(`INSERT INTO rentals(customer_id,item_id,customer_name,email,phone,start_date,end_date,total_days,total_cost) VALUES(?,?,?,?,?,?,?,?,?)`,[u.id,Number(item_id),u.name,u.email,u.phone,start_date,end_date,days,cost]);
  res.status(201).json({message:'Booking confirmed.',rental_id:r.lastID,total_days:days,total_cost:cost});
}));
app.get('/api/admin/bookings',requireAdmin,asyncRoute(async(req,res)=>{
  res.json(await all(`SELECT r.*,i.product_name,i.category FROM rentals r JOIN items i ON i.item_id=r.item_id ORDER BY r.rental_id DESC`));
}));
app.post('/api/admin/bookings',requireAdmin,asyncRoute(async(req,res)=>{
  const {customer_id,item_id,customer_name,email,phone,start_date,end_date}=req.body;
  if(!customer_name?.trim()||!email?.trim()||!phone?.trim()) return res.status(400).json({error:'Customer name, email and phone are required.'});
  const customerId=customer_id?Number(customer_id):null;
  const {days,cost}=await createRental({customerId,itemId:Number(item_id),name:customer_name,email,phone,start:start_date,end:end_date});
  const r=await run(`INSERT INTO rentals(customer_id,item_id,customer_name,email,phone,start_date,end_date,total_days,total_cost) VALUES(?,?,?,?,?,?,?,?,?)`,[customerId,Number(item_id),customer_name.trim(),email.trim(),phone.trim(),start_date,end_date,days,cost]);
  res.status(201).json({message:'Booking created.',rental_id:r.lastID});
}));
app.put('/api/admin/bookings/:id',requireAdmin,asyncRoute(async(req,res)=>{
  const id=Number(req.params.id),old=await get('SELECT * FROM rentals WHERE rental_id=?',[id]);
  if(!old) return res.status(404).json({error:'Booking not found.'});
  const b=req.body,customerName=(b.customer_name||'').trim(),email=(b.email||'').trim(),phone=(b.phone||'').trim(),itemId=Number(b.item_id);
  if(!customerName||!email||!phone) return res.status(400).json({error:'Customer name, email and phone are required.'});
  const {days,cost}=await createRental({customerId:b.customer_id?Number(b.customer_id):old.customer_id,itemId,name:customerName,email,phone,start:b.start_date,end:b.end_date,excludeId:id});
  await run(`UPDATE rentals SET customer_id=?,item_id=?,customer_name=?,email=?,phone=?,start_date=?,end_date=?,total_days=?,total_cost=? WHERE rental_id=?`,[b.customer_id?Number(b.customer_id):old.customer_id,itemId,customerName,email,phone,b.start_date,b.end_date,days,cost,id]);
  res.json({message:'Booking updated.'});
}));
app.delete('/api/admin/bookings/:id',requireAdmin,asyncRoute(async(req,res)=>{
  const r=await run('DELETE FROM rentals WHERE rental_id=?',[req.params.id]);
  if(!r.changes) return res.status(404).json({error:'Booking not found.'});
  res.json({message:'Booking deleted.'});
}));
app.get('/api/admin/stats',requireAdmin,asyncRoute(async(req,res)=>{
  const products=await get('SELECT COUNT(*) n FROM items WHERE active_status=1');
  const bookings=await get('SELECT COUNT(*) n FROM rentals');
  const customers=await get('SELECT COUNT(*) n FROM customers');
  const revenue=await get('SELECT COALESCE(SUM(total_cost),0) n FROM rentals');
  const grouped=await all(`SELECT strftime('%Y-%m', booking_date) AS month, COALESCE(SUM(total_cost),0) AS amount
    FROM rentals GROUP BY strftime('%Y-%m', booking_date) ORDER BY month DESC LIMIT 6`);
  const byMonth=new Map(grouped.map(row=>[row.month,Number(row.amount)]));
  const revenueTrend=[];
  const now=new Date();
  for(let offset=5;offset>=0;offset--){
    const d=new Date(now.getFullYear(),now.getMonth()-offset,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    revenueTrend.push({month:key,label:d.toLocaleString('en-IN',{month:'short'}),amount:byMonth.get(key)||0});
  }
  res.json({products:products.n,bookings:bookings.n,customers:customers.n,revenue:Number(revenue.n),revenueTrend});
}));
app.get('/api/admin/customers',requireAdmin,asyncRoute(async(req,res)=>{
  res.json(await all('SELECT customer_id,full_name,email,phone,created_at FROM customers ORDER BY customer_id DESC'));
}));

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(err.status||500).json({error:err.status?err.message:'Server error. Please try again.'});
});
init().then(()=>app.listen(PORT,()=>console.log(`RentalHub running at http://localhost:${PORT}`))).catch(e=>{console.error('Database initialization failed:',e);process.exit(1);});
