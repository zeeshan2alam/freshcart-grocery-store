# 🛒 FreshCart – Grocery Store

Ek khoobsurat, responsive grocery store ka **frontend** (HTML + CSS + JavaScript) jo **FastAPI backend** se connected hai. Customer shop kar sakta hai, cart mein daal sakta hai aur checkout kar sakta hai; admin products, offers aur analytics manage karta hai.

- 🔌 **Backend repo:** https://github.com/zeeshan2alam/freshcart-api
- ☁️ **Live API (Render):** https://freshcart-api-havl.onrender.com ([docs](https://freshcart-api-havl.onrender.com/docs))

## 🚀 Live demo

**👉 https://zeeshan2alam.github.io/freshcart-grocery-store/**

## 🔑 Demo logins

| Role | Email | Password |
|---|---|---|
| Customer | `user@freshcart.com` | `user123` |
| Admin | `admin@freshcart.com` | `admin123` |

Login page par "Customer demo" / "Admin demo" buttons se ye apne aap bhar jaate hain. Customer naya account bhi bana sakta hai (Sign up).

## ✨ Features

**Customer**
- Products browse, search, category filter aur sort
- Add to cart (stepper, stock limit ke saath), cart drawer
- Checkout: delivery address, UPI / Card / Cash on Delivery, form validation
- Coupon code, ₹500 se upar free delivery
- Order confirmation (confetti 🎉) aur order history

**Admin**
- Products ka add / edit / delete, rate aur quantity ke saath
- **Analytics:** KPI tiles, revenue aur orders ke charts, stock health aur payment donuts, inventory by category, top sellers, restock list, 7 / 30 din ka toggle aur har chart ka table view
- **Offers:** sale banner (marquee) launch karo jo sabhi users ko dikhta hai, coupon code aur discount ke saath
- Saare customers ke orders

**UI / UX**
- Material style theme, light + dark mode, mobile se desktop tak responsive
- Animations: fly-to-cart, confetti, button ripple, 3D tilt, animated charts (`prefers-reduced-motion` ka respect karta hai)

## 🔌 Frontend ↔ Backend

Site shuru hote hi `config.js` mein diye gaye API ko ping karti hai:

- **Server mila** → login (JWT), products, offers, coupons aur orders sab backend ke database se aate hain. Prices, discount, delivery aur stock server tay karta hai. Login page par "🟢 Live server se connected" dikhta hai.
- **Server nahi mila** → **demo mode**: sab kuch browser ke localStorage mein chalta hai, taaki site hamesha kaam kare ("🟡 Demo mode").

Free Render server idle hone par so jaata hai, to pehli baar connect hone mein **30–60 second** lag sakte hain. Us waqt "Demo mode mein chalayein" ka button bhi milta hai.

Dusra server try karne ke liye site ek baar `?api=http://127.0.0.1:8000` ke saath kholein (`?api=off` se wapas demo mode).

## ⚠️ Note

- Login aur payment **simulated** hain. Koi asli paisa nahi katta aur card/UPI details kahin save nahi hoti (sirf payment method server ko jaata hai).
- Free Render par database temporary hai: server restart hone par data reset ho kar demo data wapas aa jaata hai.
- Analytics mein pehli baar dikhne wale orders **sample data** hain (admin ke "Sample hatayein" button se hata sakte hain).

## 🖥️ Locally chalayein

Frontend ke liye installation ki zaroorat nahi, `index.html` ko browser mein kholein (server ke bina demo mode chalega). Poora stack chalane ke liye backend repo ke README mein steps hain.

## 🧰 Tech

HTML5 · CSS3 (custom properties, grid, flexbox) · Vanilla JavaScript · Google Fonts (Poppins, Inter) · Material Symbols · Backend: FastAPI + SQLAlchemy + JWT

---

Designed & built with 💚 by **Zeeshan Alam**
