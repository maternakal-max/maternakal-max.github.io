const LS_KEYS = {
  users: "toko_users",
  products: "toko_products",
  session: "toko_session",
  cart: "toko_cart",
}

const state = { users: [], products: [], session: null, cart: [] }

const el = (q) => document.querySelector(q)
const els = (q) => document.querySelectorAll(q)
const money = (n) => "Rp " + (n || 0).toLocaleString("id-ID")
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

function load() {
  state.users = JSON.parse(localStorage.getItem(LS_KEYS.users) || "[]")
  state.products = JSON.parse(localStorage.getItem(LS_KEYS.products) || "[]")
  state.session = JSON.parse(localStorage.getItem(LS_KEYS.session) || "null")
  state.cart = JSON.parse(localStorage.getItem(LS_KEYS.cart) || "[]")
  if (state.users.length === 0) {
    state.users.push({ id: id(), name: "Admin", email: "rafsyan@gmail.com", password: "rafa1234", role: "admin" })
    save("users")
  }
}

function save(k) {
  localStorage.setItem(LS_KEYS[k], JSON.stringify(state[k]))
}

function toast(t) {
  const x = el("#toast")
  x.textContent = t
  x.classList.add("show")
  setTimeout(() => x.classList.remove("show"), 1600)
}

function showSession() {
  const nav = el("#nav")
  const lr = el("#nav-role")
  if (state.session) {
    nav.classList.remove("hidden")
    lr.textContent = (state.session.role === "admin" ? "Admin" : "Pembeli") + " · " + state.session.name
  } else {
    nav.classList.add("hidden")
  }
}

function switchPane(tabId, paneId) {
  els(".tab").forEach((b) => b.classList.remove("active"))
  els(".pane").forEach((p) => p.classList.remove("active"))
  el(tabId).classList.add("active")
  el(paneId).classList.add("active")
}

function authView() {
  if (state.session) {
    el("#authSection").classList.add("hidden")
  } else {
    el("#authSection").classList.remove("hidden")
  }
}

function route() {
  showSession()
  authView()
  if (!state.session) {
    el("#adminSection").classList.add("hidden")
    el("#shopSection").classList.add("hidden")
    return
  }
  if (state.session.role === "admin") {
    el("#adminSection").classList.remove("hidden")
    el("#shopSection").classList.add("hidden")
    renderAdmin()
  } else {
    el("#adminSection").classList.add("hidden")
    el("#shopSection").classList.remove("hidden")
    renderShop()
    renderCart()
  }
}

function register(name, email, password, role) {
  email = email.trim().toLowerCase()
  if (state.users.find((u) => u.email === email)) return toast("Email sudah terdaftar")
  const u = { id: id(), name, email, password, role }
  state.users.push(u)
  save("users")
  toast("Registrasi berhasil, silakan login")
}

function login(email, password) {
  email = email.trim().toLowerCase()
  const u = state.users.find((x) => x.email === email && x.password === password)
  if (!u) return toast("Email atau password salah")
  state.session = { id: u.id, name: u.name, email: u.email, role: u.role }
  save("session")
  toast("Selamat datang, " + u.name)
  route()
}

function logout() {
  state.session = null
  localStorage.removeItem(LS_KEYS.session)
  toast("Logout berhasil")
  route()
}

function resetProductForm() {
  el("#prodId").value = ""
  el("#prodName").value = ""
  el("#prodPrice").value = ""
  el("#prodStock").value = ""
  el("#prodImage").value = ""
  el("#prodDesc").value = ""
}

function saveProduct(e) {
  e.preventDefault()
  const pid = el("#prodId").value || id()
  const name = el("#prodName").value.trim()
  const price = parseInt(el("#prodPrice").value || "0")
  const stock = parseInt(el("#prodStock").value || "0")
  const image = el("#prodImage").value.trim()
  const desc = el("#prodDesc").value.trim()
  if (!name) return toast("Nama wajib")
  let p = state.products.find((x) => x.id === pid)
  if (p) {
    p.name = name
    p.price = price
    p.stock = stock
    p.image = image
    p.desc = desc
  } else {
    p = { id: pid, name, price, stock, image, desc }
    state.products.push(p)
  }
  save("products")
  toast("Produk tersimpan")
  resetProductForm()
  renderAdmin()
}

function editProduct(pid) {
  const p = state.products.find((x) => x.id === pid)
  if (!p) return
  el("#prodId").value = p.id
  el("#prodName").value = p.name
  el("#prodPrice").value = p.price
  el("#prodStock").value = p.stock
  el("#prodImage").value = p.image || ""
  el("#prodDesc").value = p.desc || ""
}

function deleteProduct(pid) {
  state.products = state.products.filter((x) => x.id !== pid)
  save("products")
  toast("Produk dihapus")
  renderAdmin()
  renderShop()
}

function renderAdmin() {
  const wrap = el("#adminProductList")
  wrap.innerHTML = ""
  const items = state.products.slice().sort((a, b) => b.price - a.price)
  items.forEach((p) => {
    const row = document.createElement("div")
    row.className = "item"
    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${p.image || ""}" alt="" style="width:60px;height:45px;object-fit:cover;border-radius:8px;background:#0b1220">
        <div>
          <div style="font-weight:600">${p.name}</div>
          <div style="color:#94a3b8">${money(p.price)} · Stok ${p.stock}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" data-act="edit">Edit</button>
        <button class="btn btn-danger" data-act="del">Hapus</button>
      </div>
    `
    row.querySelector('[data-act="edit"]').onclick = () => editProduct(p.id)
    row.querySelector('[data-act="del"]').onclick = () => deleteProduct(p.id)
    wrap.appendChild(row)
  })
}

function renderShop() {
  const grid = el("#shopProductGrid")
  grid.innerHTML = ""
  const q = el("#searchInput").value.trim().toLowerCase()
  let items = state.products.filter((p) => p.stock > 0)
  if (q) items = items.filter((p) => p.name.toLowerCase().includes(q) || p.desc?.toLowerCase().includes(q))
  items.forEach((p) => {
    const card = document.createElement("div")
    card.className = "product"
    card.innerHTML = `
      <img src="${p.image || ""}" alt="">
      <h3>${p.name}</h3>
      <div class="price">${money(p.price)}</div>
      <div style="color:#94a3b8">${p.desc || ""}</div>
      <button class="btn btn-primary">Tambah ke Keranjang</button>
    `
    card.querySelector("button").onclick = () => addToCart(p.id)
    grid.appendChild(card)
  })
}

function addToCart(pid) {
  const p = state.products.find((x) => x.id === pid)
  if (!p || p.stock <= 0) return toast("Stok habis")
  const item = state.cart.find((x) => x.productId === pid)
  if (item) {
    if (item.qty < p.stock) {
      item.qty += 1
    } else {
      return toast("Lebih dari stok tersedia")
    }
  } else {
    state.cart.push({ id: id(), productId: pid, qty: 1 })
  }
  save("cart")
  toast("Ditambahkan ke keranjang")
  renderCart()
}

function removeFromCart(itemId) {
  state.cart = state.cart.filter((x) => x.id !== itemId)
  save("cart")
  renderCart()
}

function renderCart() {
  const wrap = el("#cartItems")
  wrap.innerHTML = ""
  let total = 0
  state.cart.forEach((it) => {
    const p = state.products.find((x) => x.id === it.productId)
    if (!p) return
    total += p.price * it.qty
    const row = document.createElement("div")
    row.className = "item"
    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${p.image || ""}" alt="" style="width:50px;height:38px;object-fit:cover;border-radius:8px;background:#0b1220">
        <div>
          <div style="font-weight:600">${p.name}</div>
          <div style="color:#94a3b8">${it.qty} × ${money(p.price)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" data-act="minus">-</button>
        <button class="btn btn-secondary" data-act="plus">+</button>
        <button class="btn btn-danger" data-act="remove">Hapus</button>
      </div>
    `
    row.querySelector('[data-act="minus"]').onclick = () => {
      it.qty = Math.max(1, it.qty - 1)
      save("cart")
      renderCart()
    }
    row.querySelector('[data-act="plus"]').onclick = () => {
      if (it.qty < state.products.find((x) => x.id === it.productId).stock) {
        it.qty += 1
        save("cart")
        renderCart()
      } else {
        toast("Melebihi stok")
      }
    }
    row.querySelector('[data-act="remove"]').onclick = () => removeFromCart(it.id)
    wrap.appendChild(row)
  })
  el("#cartTotal").textContent = money(total)
}

function checkout() {
  if (state.cart.length === 0) return toast("Keranjang kosong")
  for (const it of state.cart) {
    const p = state.products.find((x) => x.id === it.productId)
    if (!p || p.stock < it.qty) return toast("Stok tidak cukup: " + (p?.name || ""))
  }
  state.cart.forEach((it) => {
    const p = state.products.find((x) => x.id === it.productId)
    p.stock -= it.qty
  })
  state.cart = []
  save("products")
  save("cart")
  toast("Checkout berhasil")
  renderShop()
  renderCart()
}

function bind() {
  el("#loginTab").onclick = () => switchPane("#loginTab", "#loginPane")
  el("#registerTab").onclick = () => switchPane("#registerTab", "#registerPane")
  el("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault()
    register(el("#regName").value, el("#regEmail").value, el("#regPassword").value, el("#regRole").value)
  })
  el("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault()
    login(el("#loginEmail").value, el("#loginPassword").value)
  })
  el("#logoutBtn").onclick = logout
  el("#productForm").addEventListener("submit", saveProduct)
  el("#resetProductBtn").onclick = resetProductForm
  el("#searchInput").addEventListener("input", () => renderShop())
  el("#checkoutBtn").onclick = checkout
}

document.addEventListener("DOMContentLoaded", () => {
  load()
  bind()
  route()
})
