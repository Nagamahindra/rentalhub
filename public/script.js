const app=document.getElementById('app'), headerRight=document.getElementById('header-right');
let currentUser=null, products=[], adminTab='overview', categories=['All','Cars','Bikes','Watches','Electronics','Equipment'];
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url,options={}){const r=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Request failed');return d}
function toast(msg,error=false){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show'+(error?' error':'');setTimeout(()=>t.className='toast',3000)}
function setHeader(){headerRight.innerHTML=currentUser?`<div class="right"><span class="user-label">${esc(currentUser.name)} · ${currentUser.role}</span><button class="btn secondary small" onclick="logout()">Log out</button></div>`:''}
async function boot(){
  let finished=false;
  const fallback=setTimeout(()=>{if(!finished)renderHome()},1200);
  try{
    const d=await Promise.race([api('/api/auth/me'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Session check timed out')),1800))]);
    finished=true;clearTimeout(fallback);
    if(d.loggedIn){currentUser=d.user;setHeader();currentUser.role==='admin'?renderAdmin():renderCustomer()}
    else renderHome();
  }catch(error){finished=true;clearTimeout(fallback);renderHome()}
}
function goHome(){renderHome()}
async function renderHome(){
  currentUser=null;
  headerRight.innerHTML=`<nav class="landing-nav" aria-label="Main navigation">
    <a href="#home" onclick="scrollLanding('home');return false">Home</a>
    <a href="#categories" onclick="scrollLanding('categories');return false">Categories</a>
    <a href="#how-it-works" onclick="scrollLanding('how-it-works');return false">How it works</a>
    <a href="#why-rentalhub" onclick="scrollLanding('why-rentalhub');return false">Why RentalHub</a>
    <a href="#faq" onclick="scrollLanding('faq');return false">FAQ</a>
    <button class="nav-login" onclick="showAuth('customer-login')">Log in</button>
    <button class="btn nav-cta" onclick="showAuth('register')">Get started <span>↗</span></button>
  </nav>`;
  app.innerHTML=`<div class="landing-page">
    <section class="landing-hero" id="home">
      <div class="hero-copy">
        <div class="hero-kicker"><span class="kicker-dot"></span> THE SMARTER WAY TO RENT</div>
        <h1>Good things<br>are <em>better shared.</em></h1>
        <p class="hero-description">Discover the things you need, for the time you need them. From your next ride to everyday essentials, make more room for what matters.</p>
        <div class="hero-actions">
          <button class="btn hero-primary" onclick="showAuth('customer-login')">Explore rentals <span>↗</span></button>
          <button class="hero-text-link" onclick="showAuth('admin-login')">Admin login <span>→</span></button>
        </div>
        <div class="hero-proof"><div class="proof-avatars"><i>R</i><i>+</i><i>✦</i></div><span>One place for all your rental needs</span></div>
      </div>
      <div class="hero-visual">
        <div class="hero-image-main"><img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=85" alt="Premium car available for rent"></div>
        <div class="hero-image-small"><img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=700&auto=format&fit=crop&q=85" alt="Motorcycle available for rent"></div>
        <div class="floating-note"><span class="note-icon">✦</span><span><b>Find your next favourite</b><small>Simple. Flexible. Convenient.</small></span></div>
        <div class="visual-index">01 <span>/</span> 05</div>
      </div>
      <div class="hero-bottom-line"><span>RENT SMARTER. LIVE MORE.</span><span>SCROLL TO EXPLORE ↓</span></div>
    </section>

    <section class="landing-categories" id="categories">
      <div class="landing-section-heading"><div><span class="section-eyebrow">EXPLORE THE COLLECTION</span><h2>Whatever you need,<br><em>there's a way to rent it.</em></h2></div><p>Browse across thoughtfully grouped categories and find the right fit for your plans.</p></div>
      <div class="category-showcase">
        <button class="category-tile category-car" onclick="openLandingCategory('Cars')"><img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&auto=format&fit=crop&q=85" alt="Cars"><span class="category-number">01 / CATEGORY</span><span class="category-title">Cars <b>↗</b></span></button>
        <button class="category-tile category-bike" onclick="openLandingCategory('Bikes')"><img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&auto=format&fit=crop&q=85" alt="Bikes"><span class="category-number">02 / CATEGORY</span><span class="category-title">Bikes <b>↗</b></span></button>
        <button class="category-tile category-watch" onclick="openLandingCategory('Watches')"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop&q=85" alt="Watches"><span class="category-number">03 / CATEGORY</span><span class="category-title">Watches <b>↗</b></span></button>
        <button class="category-tile category-tech" onclick="openLandingCategory('Electronics')"><img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&auto=format&fit=crop&q=85" alt="Electronics"><span class="category-number">04 / CATEGORY</span><span class="category-title">Electronics <b>↗</b></span></button>
        <button class="category-tile category-equipment" onclick="openLandingCategory('Equipment')"><img src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=900&auto=format&fit=crop&q=85" alt="Equipment"><span class="category-number">05 / CATEGORY</span><span class="category-title">Equipment <b>↗</b></span></button>
      </div>
    </section>

    <section class="landing-featured" id="featured">
      <div class="landing-section-heading"><div><span class="section-eyebrow">A FEW GOOD FINDS</span><h2>Popular <em>right now.</em></h2></div><button class="outline-link" onclick="showAuth('customer-login')">View all rentals <span>↗</span></button></div>
      <div class="featured-preview" id="landing-featured-products"><div class="featured-placeholder">A curated selection of rentals is waiting for you.</div></div>
    </section>

    <section class="how-section" id="how-it-works">
      <div class="how-intro"><span class="section-eyebrow">A BETTER WAY TO GET WHAT YOU NEED</span><h2>Three steps.<br><em>More possibilities.</em></h2><p>Skip the long-term commitment. Find what you need and book it in just a few simple steps.</p><button class="btn hero-primary" onclick="showAuth('customer-login')">Start exploring <span>↗</span></button></div>
      <div class="steps-list">
        <button class="step-item" onclick="showAuth('customer-login')"><span class="step-no">01</span><span><b>Discover</b><small>Explore categories and find the right product for your needs.</small></span><i>↗</i></button>
        <button class="step-item" onclick="showAuth('customer-login')"><span class="step-no">02</span><span><b>Choose your dates</b><small>Select your rental period and see the total cost upfront.</small></span><i>↗</i></button>
        <button class="step-item" onclick="showAuth('register')"><span class="step-no">03</span><span><b>Book and enjoy</b><small>Confirm your booking and keep track of it in your account.</small></span><i>↗</i></button>
      </div>
    </section>

    <section class="why-section" id="why-rentalhub">
      <div class="why-top"><span class="section-eyebrow">WHY RENTALHUB</span><h2>Less owning.<br><em>More living.</em></h2></div>
      <div class="why-grid">
        <article><span>✳</span><h3>More choice</h3><p>Explore multiple rental categories in one convenient place.</p></article>
        <article><span>⌁</span><h3>Flexible plans</h3><p>Choose dates that work for you and see the rental cost clearly.</p></article>
        <article><span>◇</span><h3>Easy to manage</h3><p>Keep your bookings, wishlist and account details together.</p></article>
      </div>
    </section>

    <section class="faq-section" id="faq">
      <div class="faq-heading"><span class="section-eyebrow">NEED A LITTLE CLARITY?</span><h2>Frequently asked <em>questions.</em></h2><p>Quick answers to help you get started with RentalHub.</p></div>
      <div class="faq-list">
        <details><summary>What can I rent on RentalHub?<span>＋</span></summary><p>You can explore available cars, bikes, watches, electronics and equipment listed in the rental catalogue.</p></details>
        <details><summary>How do I book a rental item?<span>＋</span></summary><p>Sign in as a customer, browse the catalogue, choose an item and select your rental start and end dates. The total price is calculated from the daily price and number of rental days.</p></details>
        <details><summary>How is the rental amount calculated?<span>＋</span></summary><p>The system multiplies the item's daily rental price by the number of selected rental days. The total is shown before you confirm the booking.</p></details>
        <details><summary>Can I see or manage my bookings?<span>＋</span></summary><p>Yes. Sign in to your customer account and open My Bookings to view your rental records.</p></details>
        <details><summary>What is the wishlist used for?<span>＋</span></summary><p>You can save products to your wishlist and revisit them later from your customer dashboard.</p></details>
        <details><summary>How do I access the admin portal?<span>＋</span></summary><p>Choose Log in, select Admin login, and enter your administrator username and password.</p></details>
        <details><summary>What if I forget my password?<span>＋</span></summary><p>Use the password reset process configured by the administrator, or contact your RentalHub administrator for help.</p></details>
      </div>
    </section>

    <section class="landing-cta">
      <div><span class="section-eyebrow">YOUR NEXT FIND IS CLOSER</span><h2>Need it for a while?<br><em>Rent it with RentalHub.</em></h2></div>
      <button class="btn cta-button" onclick="showAuth('register')">Create your account <span>↗</span></button>
    </section>
  </div>`;
  loadLandingFeatured();
}
function scrollLanding(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}
function openLandingCategory(category){showAuth('customer-login');sessionStorage.setItem('rentalhub-category',category)}
async function loadLandingFeatured(){
  try{
    const items=await api('/api/products?category=All&search=');
    const target=document.getElementById('landing-featured-products');if(!target)return;
    const chosen=items.slice(0,3);
    target.innerHTML=chosen.length?chosen.map((p,i)=>`<button class="featured-card" onclick="showAuth('customer-login')"><div class="featured-card-image"><img src="${esc(p.image||'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900')}" alt="${esc(p.product_name)}" onerror="this.style.display='none'"><span>${String(i+1).padStart(2,'0')}</span></div><div class="featured-card-meta"><span>${esc(p.category)}</span><b>${money(p.daily_price)} <small>/ day</small></b></div><h3>${esc(p.product_name)}</h3><p>${esc(p.description||'Discover this rental on RentalHub.')}</p></button>`).join(''):'<div class="featured-placeholder">New rentals will appear here soon.</div>';
  }catch{const target=document.getElementById('landing-featured-products');if(target)target.innerHTML='<div class="featured-placeholder">Sign in to explore the rental collection.</div>'}
}
function showLoginChoice(){
  headerRight.innerHTML=`<nav class="landing-nav"><button class="nav-login" onclick="renderHome()">← Home</button></nav>`;
  app.innerHTML=`<div class="login-choice-page">
    <button class="btn secondary small" onclick="renderHome()">← Back to home</button>
    <div class="login-choice-heading"><span class="section-eyebrow">WELCOME TO RENTALHUB</span><h1>Choose your <em>login type.</em></h1><p>Select how you want to sign in to RentalHub.</p></div>
    <div class="login-choice-grid">
      <article class="login-choice-card customer-choice"><div class="choice-icon">♙</div><span class="section-eyebrow">CUSTOMER PORTAL</span><h2>Customer login</h2><p>Sign in to browse rentals, book products, manage bookings and use your wishlist.</p><button class="btn hero-primary" onclick="showAuth('customer-login')">Customer login <span>↗</span></button></article>
      <article class="login-choice-card admin-choice"><div class="choice-icon">▦</div><span class="section-eyebrow">ADMIN PORTAL</span><h2>Admin login</h2><p>Sign in with your administrator username and password to manage RentalHub.</p><button class="btn hero-primary" onclick="showAuth('admin-login')">Admin login <span>↗</span></button></article>
    </div>
  </div>`;
}
function passwordField(label,name,id,autocomplete='current-password'){return `<div class="field"><label for="${id}">${label}</label><div class="password-wrap"><input id="${id}" type="password" name="${name}" autocomplete="${autocomplete}" required minlength="6"><button class="password-toggle" type="button" aria-label="Show password" aria-pressed="false" onclick="togglePassword('${id}',this)">◉</button></div></div>`}
function togglePassword(id,button){const input=document.getElementById(id);if(!input)return;const visible=input.type==='password';input.type=visible?'text':'password';button.textContent=visible?'◎':'◉';button.setAttribute('aria-label',visible?'Hide password':'Show password');button.setAttribute('aria-pressed',String(visible))}
function showAuth(mode){const admin=mode==='admin-login',register=mode==='register';app.innerHTML=`<div class="auth-wrap"><button class="btn secondary small" onclick="renderHome()">← Back</button><div class="panel" style="margin-top:16px"><div class="eyebrow">${admin?'Administrator access':'Customer account'}</div><h2>${admin?'Welcome back, Admin':register?'Create your account':'Welcome back'}</h2><p class="muted">${admin?'Sign in to manage RentalHub.':register?'Register to explore and book rental products.':'Sign in to continue to your rentals.'}</p><form autocomplete="off" onsubmit="submitAuth(event,'${mode}')">${register?`<div class="field"><label>Full name</label><input name="fullName" autocomplete="name" required></div><div class="form-row"><div class="field"><label>Email address</label><input type="email" name="email" autocomplete="off" required></div><div class="field"><label>Phone number</label><input name="phone" autocomplete="tel" required></div></div>`:admin?`<div class="field"><label for="admin-username">Username</label><input id="admin-username" name="username" autocomplete="off" required></div>`:`<div class="field"><label for="customer-email">Email address</label><input id="customer-email" type="email" name="email" autocomplete="off" required></div>`}${passwordField('Password','password',admin?'admin-password':register?'register-password':'customer-password','new-password')} ${register?passwordField('Confirm password','confirmPassword','confirm-register-password','new-password'):''}<button class="btn" style="width:100%;margin-top:8px">${register?'Create account':'Sign in'}</button></form>${!admin?`<p class="inline-note" style="text-align:center;margin-top:18px">${register?'Already registered?':'New to RentalHub?'} <a href="#" onclick="showAuth('${register?'customer-login':'register'}');return false" style="color:var(--green);font-weight:700">${register?'Sign in':'Create an account'}</a></p>${!register?`<p class="inline-note" style="text-align:center;margin-top:10px">Administrator? <a href="#" onclick="showAuth('admin-login');return false" style="color:var(--green);font-weight:700">Admin Login</a></p>`:''}`:``}</div></div>`}
async function submitAuth(e,mode){e.preventDefault();const body=Object.fromEntries(new FormData(e.target).entries());try{const endpoint=mode==='register'?'/api/auth/register':mode==='admin-login'?'/api/auth/admin-login':'/api/auth/customer-login';const d=await api(endpoint,{method:'POST',body:JSON.stringify(body)});currentUser=d.user;setHeader();toast(d.message);if(currentUser.role==='admin'){renderAdmin()}else{const wanted=sessionStorage.getItem('rentalhub-category');if(wanted){sessionStorage.removeItem('rentalhub-category');await renderBrowse();const select=document.getElementById('category');if(select){select.value=wanted;refreshCatalog()}}else{renderCustomer()}}if(d.passwordCompromised===true)showBreachWarning()}catch(err){toast(err.message,true)}}
async function logout(){try{await api('/api/auth/logout',{method:'POST'})}catch{}currentUser=null;setHeader();renderHome();toast('You have logged out.')}
async function loadProducts(category='All',search=''){products=await api('/api/products?category='+encodeURIComponent(category)+'&search='+encodeURIComponent(search));return products}
function customerLayout(active,title,subtitle,content){
  app.innerHTML=`<div class="dashboard-layout"><aside class="sidebar"><div class="side-label">CUSTOMER MENU</div>
    <button class="side-link ${active==='home'?'active':''}" onclick="renderCustomer()"><span>⌂</span> Dashboard</button>
    <button class="side-link ${active==='browse'?'active':''}" onclick="renderBrowse()"><span>⌕</span> Browse rentals</button>
    <button class="side-link ${active==='bookings'?'active':''}" onclick="renderMyBookings()"><span>▤</span> My bookings</button>
    <button class="side-link ${active==='wishlist'?'active':''}" onclick="renderWishlist()"><span>♡</span> My wishlist</button>
    <div class="side-label side-label-gap">ACCOUNT</div>
    <button class="side-link ${active==='profile'?'active':''}" onclick="renderProfile()"><span>♙</span> My profile</button>
    <button class="side-link side-logout" onclick="logout()"><span>↪</span> Log out</button>
    <div class="side-user"><div class="avatar">${esc((currentUser.name||'C').charAt(0).toUpperCase())}</div><div><b>${esc(currentUser.name)}</b><small>Customer account</small></div></div>
  </aside><section class="dashboard-main"><div class="dash-heading"><div><div class="eyebrow">CUSTOMER SPACE</div><h1>${title}</h1><p class="muted">${subtitle}</p></div></div>${content}</section></div>`;
}
async function renderCustomer(){
  setHeader();
  customerLayout('home','Your dashboard',`Welcome back, ${currentUser.name.split(' ')[0]}. Here's your rental space.`,`
    <div class="welcome-banner"><div><span class="eyebrow" style="color:#d9f36a">MAKE EVERY DAY EASIER</span><h2>Find something<br>worth renting.</h2><p>Explore the collection and book what you need.</p><button class="btn light-btn" onclick="renderBrowse()">Explore rentals ↗</button></div><div class="welcome-symbol">R</div></div>
    <div class="quick-grid"><button class="quick-card" onclick="renderMyBookings()"><span>▤</span><b>My bookings</b><small>Track your rentals</small></button><button class="quick-card" onclick="renderWishlist()"><span>♡</span><b>My wishlist</b><small>Saved items</small></button><button class="quick-card" onclick="renderProfile()"><span>♙</span><b>My profile</b><small>Your account details</small></button></div>
    <div class="section-head" style="margin-top:30px"><div><div class="eyebrow">HANDPICKED FOR YOU</div><h2>Popular rentals</h2></div><button class="btn secondary small" onclick="renderBrowse()">View all</button></div><div id="catalog" class="products"><div class="loading">Loading products…</div></div>`);
  await refreshCatalog('All','',true);
}
async function renderBrowse(){
  customerLayout('browse','Browse rentals','Explore cars, bikes, watches, electronics and equipment.',`
    <div class="toolbar"><input id="search" placeholder="Search rental products…" oninput="refreshCatalog()"><select id="category" onchange="refreshCatalog()">${categories.map(c=>`<option>${c}</option>`).join('')}</select></div>
    <div id="catalog" class="products"><div class="loading">Loading products…</div></div>`);
  await refreshCatalog();
}
async function refreshCatalog(categoryOverride=null,searchOverride=null,home=false){try{const list=await loadProducts(categoryOverride??document.getElementById('category')?.value??'All',searchOverride??document.getElementById('search')?.value??'');document.getElementById('catalog').innerHTML=list.length?list.map(p=>`<article class="product-card"><img src="${esc(p.image||'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900')}" alt="${esc(p.product_name)}" onerror="this.src='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900'"><div class="product-info"><span class="tag">${esc(p.category)}</span><h3>${esc(p.product_name)}</h3><p>${esc(p.description)}</p><div class="product-bottom"><div class="price">${money(p.daily_price)} <small>/ day</small></div><div class="actions"><button class="btn secondary small" title="Add to wishlist" onclick="addWishlist(${p.item_id})">♡</button><button class="btn small" onclick="bookingModal(${p.item_id})">Book now</button></div></div></div></article>`).join(''):'<div class="empty" style="grid-column:1/-1"><b>No products found</b>Try a different search or category.</div>'}catch(e){toast(e.message,true)}}
async function renderMyBookings(){try{const rows=await api('/api/rentals/my-bookings');customerLayout('bookings','My bookings','View your confirmed rental history.',rows.length?`<div class="table-wrap"><table><thead><tr><th>Booking ID</th><th>Product</th><th>Category</th><th>Rental period</th><th>Days</th><th>Total</th><th>Booked on</th></tr></thead><tbody>${rows.map(r=>`<tr><td>#${r.rental_id}</td><td>${esc(r.product_name)}</td><td>${esc(r.category)}</td><td>${r.start_date} → ${r.end_date}</td><td>${r.total_days}</td><td><b>${money(r.total_cost)}</b></td><td>${String(r.booking_date).slice(0,10)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="panel empty"><b>No bookings yet</b>Your confirmed rentals will appear here.<br><br><button class="btn" onclick="renderBrowse()">Explore products</button></div>`)}catch(e){toast(e.message,true)}}
async function renderWishlist(){try{const rows=await api('/api/wishlist');customerLayout('wishlist','My wishlist','Your saved products, ready when you are.',rows.length?`<div class="products">${rows.map(p=>`<article class="product-card"><img src="${esc(p.image||'')}" alt="${esc(p.product_name)}"><div class="product-info"><span class="tag">${esc(p.category)}</span><h3>${esc(p.product_name)}</h3><p>${esc(p.description)}</p><div class="product-bottom"><div class="price">${money(p.daily_price)} <small>/ day</small></div><div class="actions"><button class="btn danger small" onclick="removeWishlist(${p.item_id})">Remove</button><button class="btn small" onclick="bookFromWishlist(${p.item_id})">Book</button></div></div></div></article>`).join('')}</div>`:`<div class="panel empty"><b>Your wishlist is empty</b>Save products using the heart icon while browsing.<br><br><button class="btn" onclick="renderBrowse()">Browse rentals</button></div>`)}catch(e){toast(e.message,true)}}
async function addWishlist(id){try{const d=await api('/api/wishlist/'+id,{method:'POST'});toast(d.message)}catch(e){toast(e.message,true)}}
async function removeWishlist(id){try{const d=await api('/api/wishlist/'+id,{method:'DELETE'});toast(d.message);renderWishlist()}catch(e){toast(e.message,true)}}
async function bookFromWishlist(id){await loadProducts();bookingModal(id)}
function renderProfile(){customerLayout('profile','My profile','Your registered account information.',`<div class="panel profile-panel"><div class="profile-avatar">${esc((currentUser.name||'C').charAt(0).toUpperCase())}</div><h2>${esc(currentUser.name)}</h2><p class="muted">Customer account</p><div class="profile-details"><div><small>EMAIL ADDRESS</small><b>${esc(currentUser.email)}</b></div><div><small>PHONE NUMBER</small><b>${esc(currentUser.phone||'Not provided')}</b></div></div><button class="btn" onclick="showChangePassword()">Change password</button></div>`)}
function showBreachWarning(){showModal(`<div class="security-alert"><div class="security-alert-icon">!</div><div><div class="eyebrow" style="color:#b42318">SECURITY ALERT</div><h3>Your password may be at risk</h3></div></div><p class="security-alert-message">The password you just used was found in a known data breach. We recommend changing it now and avoiding reuse of this password on other websites.</p><div class="security-privacy">Your password was checked using a privacy-preserving method. The actual password was not sent to the breach-checking service.</div><div class="security-actions"><button class="btn secondary" onclick="closeModal()">Not now</button><button class="btn" onclick="closeModal();showChangePassword()">Change password</button></div>`)}
function showChangePassword(){showModal(`<div class="modal-head"><h3>Change password</h3><button class="close" onclick="closeModal()">×</button></div><p class="muted">Choose a strong, unique password that you have not used on another website. Known-compromised passwords cannot be used.</p><form autocomplete="off" onsubmit="changePassword(event)">${passwordField('Current password','currentPassword','change-current-password','current-password')}${passwordField('New password','newPassword','change-new-password','new-password')}${passwordField('Confirm new password','confirmPassword','change-confirm-password','new-password')}<button class="btn" style="width:100%">Update password</button></form>`)}
async function changePassword(e){e.preventDefault();const body=Object.fromEntries(new FormData(e.target).entries());try{const d=await api('/api/auth/change-password',{method:'POST',body:JSON.stringify(body)});closeModal();toast(d.message)}catch(err){toast(err.message,true)}}
function bookingModal(id){const p=products.find(x=>x.item_id===id);if(!p)return;showModal(`<div class="modal-head"><h3>Book ${esc(p.product_name)}</h3><button class="close" onclick="closeModal()">×</button></div><p class="muted">${esc(p.category)} · ${money(p.daily_price)} per day</p><form onsubmit="confirmBooking(event,${id},${p.daily_price})"><div class="form-row"><div class="field"><label>Start date</label><input type="date" name="start" min="${new Date().toISOString().slice(0,10)}" required onchange="updateEstimate(${p.daily_price})"></div><div class="field"><label>End date</label><input type="date" name="end" min="${new Date().toISOString().slice(0,10)}" required onchange="updateEstimate(${p.daily_price})"></div></div><div id="estimate" class="summary"><span>Select dates to calculate</span><b>—</b></div><button class="btn" style="width:100%">Confirm booking</button></form>`)}
function updateEstimate(price){const f=document.querySelector('.modal form');if(!f)return;const a=f.elements.start.value,b=f.elements.end.value;if(a&&b&&b>=a){const days=Math.round((Date.parse(b)-Date.parse(a))/86400000)+1;document.getElementById('estimate').innerHTML=`<span>${days} rental day(s)</span><b>${money(days*price)}</b>`}else document.getElementById('estimate').innerHTML='<span>Choose a valid date range</span><b>—</b>'}
async function confirmBooking(e,id,price){e.preventDefault();const f=e.target,body={item_id:id,start_date:f.elements.start.value,end_date:f.elements.end.value};try{const d=await api('/api/rentals',{method:'POST',body:JSON.stringify(body)});closeModal();toast(`Booking #${d.rental_id} confirmed · ${money(d.total_cost)}`);renderMyBookings()}catch(err){toast(err.message,true)}}
function showModal(html){const wrap=document.createElement('div');wrap.id='modal-root';wrap.className='modal-backdrop';wrap.innerHTML=`<div class="modal">${html}</div>`;wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal()});document.body.appendChild(wrap)}
function closeModal(){document.getElementById('modal-root')?.remove()}
async function renderAdmin(){
  setHeader();
  app.innerHTML=`<div class="dashboard-layout admin-dashboard-layout">
    <aside class="sidebar admin-sidebar">
      <div class="side-label">ADMIN MENU</div>
      <button class="side-link ${adminTab==='overview'?'active':''}" onclick="adminTab='overview';renderAdmin()"><span>▦</span> Overview</button>
      <button class="side-link ${adminTab==='bookings'?'active':''}" onclick="adminTab='bookings';renderAdmin()"><span>▤</span> Bookings</button>
      <button class="side-link ${adminTab==='products'?'active':''}" onclick="adminTab='products';renderAdmin()"><span>◇</span> Products</button>
      <button class="side-link ${adminTab==='customers'?'active':''}" onclick="adminTab='customers';renderAdmin()"><span>♙</span> Customers</button>
      <div class="side-label side-label-gap">ACCOUNT</div>
      <button class="side-link" onclick="showChangePassword()"><span>⌑</span> Change password</button>
      <button class="side-link side-logout" onclick="logout()"><span>↪</span> Log out</button>
      <div class="side-user"><div class="avatar">A</div><div><b>Administrator</b><small>Control centre</small></div></div>
    </aside>
    <section class="dashboard-main">
      <div class="dash-heading"><div><div class="eyebrow">RENTALHUB CONTROL CENTRE</div><h1>Admin dashboard</h1><p class="muted">Manage your rental catalogue, customers and bookings.</p></div></div>
      <div id="stats" class="stats"></div>
      <div id="admin-content"></div>
    </section>
  </div>`;
  try{
    const s=await api('/api/admin/stats');
    document.getElementById('stats').innerHTML=[['Active products',s.products],['Total bookings',s.bookings],['Registered customers',s.customers],['Rental value',money(s.revenue)]].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
    if(adminTab==='overview'){
      const trend=s.revenueTrend||[];
      const max=Math.max(1,...trend.map(x=>Number(x.amount)||0));
      const chart=trend.length?`<div class="revenue-chart">${trend.map(x=>{
        const amount=Number(x.amount)||0, height=Math.max(amount>0?7:2,Math.round((amount/max)*150));
        return `<div class="revenue-column"><div class="revenue-value">${money(amount)}</div><div class="revenue-bar-track"><div class="revenue-bar" style="height:${height}px"></div></div><div class="revenue-month">${esc(x.label)}</div></div>`;
      }).join('')}</div>`:'<div class="empty">No revenue data available yet.</div>';
      document.getElementById('admin-content').innerHTML=`<div class="panel revenue-panel"><div class="section-head"><div><div class="eyebrow">RENTAL PERFORMANCE</div><h2>Revenue overview</h2><p class="muted">Monthly rental amount calculated from confirmed bookings.</p></div><span class="revenue-total">${money(s.revenue)}</span></div>${chart}<p class="inline-note">Revenue is calculated by adding each booking's saved total rental cost. Months are grouped by booking creation date.</p></div>
      <div class="admin-shortcuts"><button class="quick-card" onclick="adminTab='bookings';renderAdmin()"><span>▤</span><b>Manage bookings</b><small>View and update rentals</small></button><button class="quick-card" onclick="adminTab='products';renderAdmin()"><span>◇</span><b>Manage products</b><small>Update rental catalogue</small></button><button class="quick-card" onclick="adminTab='customers';renderAdmin()"><span>♙</span><b>View customers</b><small>Registered accounts</small></button></div>`;
    }
    if(adminTab==='bookings')await adminBookings();
    if(adminTab==='products')await adminProducts();
    if(adminTab==='customers')await adminCustomers();
  }catch(e){toast(e.message,true)}
}
async function adminBookings(){const rows=await api('/api/admin/bookings');document.getElementById('admin-content').innerHTML=`<div class="section-head"><div><h2>Booking management</h2><span class="muted">${rows.length} booking record(s)</span></div><button class="btn" onclick="bookingAdminModal()">＋ Add booking</button></div><div class="toolbar"><input id="booking-search" placeholder="Search customer, email or product…" oninput="filterTable('booking-table',this.value)"></div><div class="table-wrap"><table id="booking-table"><thead><tr><th>ID</th><th>Customer</th><th>Contact</th><th>Product</th><th>Dates</th><th>Days</th><th>Total</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr><td>#${r.rental_id}</td><td>${esc(r.customer_name)}</td><td>${esc(r.email)}<br>${esc(r.phone)}</td><td>${esc(r.product_name)}<br><span class="muted">${esc(r.category)}</span></td><td>${r.start_date}<br>to ${r.end_date}</td><td>${r.total_days}</td><td><b>${money(r.total_cost)}</b></td><td><div class="actions"><button class="btn secondary small" onclick='editBooking(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Edit</button><button class="btn danger small" onclick="deleteBooking(${r.rental_id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`}
async function adminProducts(){const rows=await api('/api/admin/products');document.getElementById('admin-content').innerHTML=`<div class="section-head"><div><h2>Product management</h2><span class="muted">${rows.length} catalogue item(s)</span></div><button class="btn" onclick="productModal()">＋ Add product</button></div><div class="toolbar"><input placeholder="Search products…" oninput="filterTable('product-table',this.value)"></div><div class="table-wrap"><table id="product-table"><thead><tr><th>ID</th><th>Product</th><th>Category</th><th>Daily price</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(p=>`<tr><td>#${p.item_id}</td><td><b>${esc(p.product_name)}</b><br><span class="muted">${esc(p.description)}</span></td><td>${esc(p.category)}</td><td>${money(p.daily_price)}</td><td>${p.active_status?'Active':'Unavailable'}</td><td><div class="actions"><button class="btn secondary small" onclick='productModal(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Edit</button><button class="btn danger small" onclick="deleteProduct(${p.item_id})">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`}
async function adminCustomers(){const rows=await api('/api/admin/customers');document.getElementById('admin-content').innerHTML=`<div class="section-head"><div><h2>Registered customers</h2><span class="muted">${rows.length} customer account(s)</span></div></div><div class="toolbar"><input placeholder="Search customers…" oninput="filterTable('customer-table',this.value)"></div><div class="table-wrap"><table id="customer-table"><thead><tr><th>ID</th><th>Full name</th><th>Email</th><th>Phone</th><th>Registered</th></tr></thead><tbody>${rows.map(c=>`<tr><td>#${c.customer_id}</td><td>${esc(c.full_name)}</td><td>${esc(c.email)}</td><td>${esc(c.phone)}</td><td>${String(c.created_at).slice(0,10)}</td></tr>`).join('')}</tbody></table></div>`}
function filterTable(id,q){const table=document.getElementById(id);if(!table)return;[...table.tBodies[0].rows].forEach(r=>r.hidden=!r.innerText.toLowerCase().includes(q.toLowerCase()))}
function productModal(p=null){const edit=!!p;showModal(`<div class="modal-head"><h3>${edit?'Edit product':'Add product'}</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveProduct(event,${p?.item_id||'null'})"><div class="field"><label>Product name</label><input name="product_name" required value="${esc(p?.product_name||'')}"></div><div class="field"><label>Description</label><textarea name="description" rows="3">${esc(p?.description||'')}</textarea></div><div class="form-row"><div class="field"><label>Category</label><select name="category">${categories.slice(1).map(c=>`<option ${p?.category===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label>Daily rental price (₹)</label><input name="daily_price" type="number" min="0" step="0.01" required value="${p?.daily_price??''}"></div></div><div class="field"><label>Product image URL</label><input name="image" type="url" value="${esc(p?.image||'')}"></div>${edit?`<div class="field"><label>Status</label><select name="active_status"><option value="1" ${p.active_status?'selected':''}>Active</option><option value="0" ${!p.active_status?'selected':''}>Unavailable</option></select></div>`:''}<button class="btn" style="width:100%">${edit?'Save changes':'Add product'}</button></form>`)}
async function saveProduct(e,id){e.preventDefault();const body=Object.fromEntries(new FormData(e.target).entries());body.daily_price=Number(body.daily_price);if(body.active_status!==undefined)body.active_status=Number(body.active_status);try{await api(id?'/api/admin/products/'+id:'/api/admin/products',{method:id?'PUT':'POST',body:JSON.stringify(body)});closeModal();toast(id?'Product updated.':'Product added.');renderAdmin()}catch(err){toast(err.message,true)}}
async function deleteProduct(id){if(!confirm('Are you sure you want to delete this product?'))return;try{const d=await api('/api/admin/products/'+id,{method:'DELETE'});toast(d.message);renderAdmin()}catch(e){toast(e.message,true)}}
async function bookingAdminModal(b=null){const [ps,cs]=await Promise.all([api('/api/admin/products'),api('/api/admin/customers')]);const active=ps.filter(p=>p.active_status);showModal(`<div class="modal-head"><h3>${b?'Edit booking':'Add booking'}</h3><button class="close" onclick="closeModal()">×</button></div><form id="admin-booking-form" onsubmit="saveAdminBooking(event,${b?.rental_id||'null'})"><div class="field"><label>Registered customer (optional)</label><select name="customer_id" onchange="fillCustomer(this)"><option value="">Walk-in / enter details manually</option>${cs.map(c=>`<option value="${c.customer_id}" data-name="${esc(c.full_name)}" data-email="${esc(c.email)}" data-phone="${esc(c.phone)}" ${b?.customer_id===c.customer_id?'selected':''}>${esc(c.full_name)} — ${esc(c.email)}</option>`).join('')}</select></div><div class="form-row"><div class="field"><label>Customer name</label><input name="customer_name" required value="${esc(b?.customer_name||'')}"></div><div class="field"><label>Email</label><input type="email" name="email" required value="${esc(b?.email||'')}"></div></div><div class="field"><label>Phone</label><input name="phone" required value="${esc(b?.phone||'')}"></div><div class="field"><label>Rental product</label><select name="item_id" required>${active.map(p=>`<option value="${p.item_id}" ${b?.item_id===p.item_id?'selected':''}>${esc(p.product_name)} — ${money(p.daily_price)}/day</option>`).join('')}</select></div><div class="form-row"><div class="field"><label>Start date</label><input type="date" name="start_date" required value="${b?.start_date||''}"></div><div class="field"><label>End date</label><input type="date" name="end_date" required value="${b?.end_date||''}"></div></div><p class="inline-note">Rental days and total cost are recalculated by the server using the current product price. Overlapping bookings are rejected.</p><button class="btn" style="width:100%">${b?'Save booking':'Create booking'}</button></form>`)}
function fillCustomer(sel){const o=sel.selectedOptions[0],f=document.getElementById('admin-booking-form');if(!o.value)return;f.elements.customer_name.value=o.dataset.name;f.elements.email.value=o.dataset.email;f.elements.phone.value=o.dataset.phone}
function editBooking(b){bookingAdminModal(b)}
async function saveAdminBooking(e,id){e.preventDefault();const body=Object.fromEntries(new FormData(e.target).entries());body.item_id=Number(body.item_id);body.customer_id=body.customer_id?Number(body.customer_id):null;try{await api(id?'/api/admin/bookings/'+id:'/api/admin/bookings',{method:id?'PUT':'POST',body:JSON.stringify(body)});closeModal();toast(id?'Booking updated.':'Booking created.');renderAdmin()}catch(err){toast(err.message,true)}}
async function deleteBooking(id){if(!confirm('Are you sure you want to delete this booking?'))return;try{await api('/api/admin/bookings/'+id,{method:'DELETE'});toast('Booking deleted.');renderAdmin()}catch(e){toast(e.message,true)}}
boot();
