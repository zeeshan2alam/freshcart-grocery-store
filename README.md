# 🛒 FreshCart – Grocery Store

Ek khoobsurat, responsive grocery store ka **frontend** (HTML + CSS + JavaScript, koi backend nahi). Customer shop kar sakta hai, cart mein daal sakta hai aur checkout kar sakta hai; admin products, offers aur analytics manage karta hai.

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

## ⚠️ Note

- Ye sirf frontend demo hai. Saara data (products, users, orders, offers) browser ke **localStorage** mein save hota hai, to har browser ka data alag hota hai.
- Login aur payment **simulated** hain. Koi asli paisa nahi katta aur card/UPI details kahin save nahi hoti. Asli use ke liye backend zaroori hai.
- Analytics mein pehli baar dikhne wale orders **sample data** hain (admin ke "Sample hatayein" button se hata sakte hain).

## 🖥️ Locally chalayein

Kisi installation ki zaroorat nahi. `index.html` ko browser mein kholein.

## 🧰 Tech

HTML5 · CSS3 (custom properties, grid, flexbox) · Vanilla JavaScript · Google Fonts (Poppins, Inter) · Material Symbols

---

Designed & built with 💚 by **Zeeshan Alam**
