// ===== FILE: assets/app.js =====
// ================= SUPABASE INIT =================
const SUPABASE_URL = "https://ccwfthrxcibvquimjrkn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjd2Z0aHJ4Y2lidnF1aW1qcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MDc3ODgsImV4cCI6MjA5MzE4Mzc4OH0.CcTbsuQWhzA5pjSV_d_322byrH815ujMfq5m962gyz0"; // WAJIB ganti

// FORCE INIT (tanpa kondisi)
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var supabase = window.supabaseClient;

console.log("SUPABASE FIXED:", supabase);

// =====================================================
// ================= GLOBAL STATE ======================
// =====================================================
window.state = {
  customers: [],
  produkList: [],
  selectedCustomer: null,
  selectedSupplier: null,
  selectedProduk: null,
  cart: [],
  bahanList: [],
};
let editIndex = null;
let editCustomerId = null;
let deleteCustomerId = null;
let editSupplierId = null;
let deleteSupplierId = null;
let editSalesId = null;
let deleteSalesId = null;
let editProdukId = null;
let deleteProdukId = null;
let deleteId = null;
let editPembelianId = null;
let deletePembelianId = null;
let selectedProduksiId = null;
let currentRefId = null;
let currentType = null;
let currentHutangId = null;
let currentMaxSisa = 0;
let currentRefNo = null;


// ===== BRIDGE (biar kode lama tetap jalan) =====
Object.defineProperties(window, {
  customers: {
    get: () => window.state.customers,
    set: (val) => (window.state.customers = val),
  },
  produkList: {
    get: () => window.state.produkList,
    set: (val) => (window.state.produkList = val),
  },
  selectedCustomer: {
    get: () => window.state.selectedCustomer,
    set: (val) => (window.state.selectedCustomer = val),
  },
  cart: {
    get: () => window.state.cart,
    set: (val) => (window.state.cart = val),
  },
});

// =====================================================
// ================= LOAD SALES, CUSTOMER =====================
// =====================================================

async function loadCustomers() {
  const { data, error } = await supabase.from("customers").select("*");

  if (error) {
    console.error(error);
    return;
  }

  window.customers = data; // 🔥 ini kunci

  console.log("CUSTOMERS (DB):", data);
}
async function loadSales() {
  const select = document.getElementById("sales_id");
  if (!select) return;

  const { data, error } = await supabase.from("sales").select("id, nama").order("nama");

  if (error) {
    console.error("ERROR LOAD SALES:", error);
    return;
  }

  select.innerHTML = `
    <option value="">-- Pilih PIC --</option>
    ${data.map((s) => `<option value="${s.id}">${s.nama}</option>`).join("")}
  `;

  console.log("SALES DATA:", data);
}

// ================= ICON =================
function renderIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}
// =====================================================
// ================= PENJUALAN =====================
// =====================================================
async function loadPenjualan() {
  try {
    const { data, error } = await supabase
      .from("v_penjualan_status")
      .select("*") // 🔥 AMAN, TIDAK ERROR
      .order("tanggal", { ascending: false });

    if (error) throw error;

    console.log("DATA:", data); // debug

    renderPenjualan(data);
  } catch (err) {
    console.error("LOAD PENJUALAN ERROR:", err.message, err);
  }
}
function renderPenjualan(data) {
  const tbody = document.getElementById("table-penjualan-body");
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">Belum ada data</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data
    .map((row) => {
      const isLunas = row.status === "lunas";

      const customerNama = row.customer_nama || "-";
      const tanggal = row.tanggal ? formatTanggal(row.tanggal) : "-";
      const invoice = row.invoice || "-";
      const total = formatRupiah(row.total || 0);
      const sisa = formatRupiah(row.sisa || 0);

      return `
      <tr class="row-penjualan">

        <!-- TANGGAL -->
        <td class="col-tanggal">
          ${tanggal}
        </td>

        <!-- TRANSAKSI -->
        <td class="col-transaksi">
          <div class="cell-main">${customerNama}</div>
          <div class="cell-sub">${invoice}</div>
          <div class="cell-sub">Sisa: ${sisa}</div>
        </td>

        <!-- TOTAL -->
        <td class="col-total">
          ${total}
        </td>

        <!-- STATUS -->
        <td class="col-status">
          <span class="badge ${isLunas ? "success" : "warning"}">
            ${isLunas ? "lunas" : "kredit"}
          </span>
        </td>

        <!-- AKSI -->
        <td class="col-aksi">
          <div class="table-action">

            ${row.sisa > 0 ? `
              <span class="action-btn" onclick="bayarPiutang('${row.id}', ${row.sisa}, '${invoice}')">💰</span>
            ` : ""}

            <span class="action-btn" onclick="openInvoice('${row.id}')">
              <i data-lucide="file-text"></i>
            </span>

            <span class="action-btn" onclick="editPenjualan('${row.id}')">
              <i data-lucide="pencil"></i>
            </span>

            <span class="action-btn" onclick="deletePenjualan('${row.id}')">
              <i data-lucide="trash-2"></i>
            </span>

          </div>
        </td>

      </tr>
    `;
    })
    .join("");

  renderIcons();
}
// ================= LOAD COMPONENT =================
async function loadComponent(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  const res = await fetch(file);
  el.innerHTML = await res.text();
  renderIcons();
}

function setActiveMenu(page) {
  // reset semua active
  document.querySelectorAll(".sidebar-menu li").forEach((item) => {
    item.classList.remove("active");
  });

  // set active item
  const activeItem = document.querySelector(`.sidebar-menu li[data-page="${page}"]`);

  if (activeItem) {
    activeItem.classList.add("active");

    const parentGroup = activeItem.closest(".menu-group");

    if (parentGroup) {
      const parent = parentGroup.querySelector(".menu-parent");
      const submenu = parentGroup.querySelector(".submenu");

      if (parent) parent.classList.add("active-parent");
      if (submenu) submenu.classList.add("show");
    }
  }

  // ===== MASTER =====
  const masterMenu = document.getElementById("master-menu");
  const masterParent = document.querySelector('[onclick*="master-menu"]');

  if (masterMenu && masterParent) {
    if (page.startsWith("master-")) {
      masterMenu.classList.add("show");
      masterParent.classList.add("open");
      masterParent.classList.add("active-parent");
    } else {
      masterMenu.classList.remove("show");
      masterParent.classList.remove("open");
      masterParent.classList.remove("active-parent");
    }
  }

  // ===== STOK =====
  const stokMenu = document.getElementById("stok-menu");
  const stokParent = document.querySelector('[onclick*="stok-menu"]');

  if (stokMenu && stokParent) {
    if (page.includes("stok")) {
      stokMenu.classList.add("show");
      stokParent.classList.add("open");
      stokParent.classList.add("active-parent");
    } else {
      stokMenu.classList.remove("show");
      stokParent.classList.remove("open");
      stokParent.classList.remove("active-parent");
    }
  }
}
// ================= LOAD STOK =================
async function loadStokList() {
  const tbody = document.getElementById("stok-list-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  const { data, error } = await supabase.from("v_stok_nilai").select("*");

  if (error) {
    console.error("ERROR LOAD STOK:", error);
    tbody.innerHTML = `<tr><td colspan="5">Gagal load data</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Belum ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.kode}</td>
        <td>${item.nama}</td>
        <td class="text-right">${item.qty}</td>
        <td class="text-right"> ${formatRupiah(item.nilai_aset)}</td>
      </tr>
    `,
    )
    .join("");
}

async function loadArusStok() {
  const tbody = document.getElementById("arus-stok-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("arus_stok")
    .select(
      `
      tanggal,
      ref_type,
      ref_no,
      ref_nama,
      ref_id,
      masuk,
      keluar,
      produk:produk_id(nama)
    `,
    )
    .order("tanggal", { ascending: false }); // ✅ FIX: hapus created_at

  if (error) {
    console.error("ERROR LOAD ARUS:", error);
    tbody.innerHTML = `<tr><td colspan="7">Gagal load data</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">Belum ada data</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((row, i) => {
      return `
      <tr>
        <td>${i + 1}</td>
        <td>${formatTanggal(row.tanggal)}</td>

        <td>
          <span class="link-ref"
            onclick="openRef('${row.ref_type}','${row.ref_id}')">
            ${row.ref_no || "-"}
          </span>
        </td>

        <td>${row.ref_nama || "-"}</td>

        <td>${row.produk?.nama || "-"}</td>
        <td class="text-right">${row.masuk || 0}</td>
        <td class="text-right">${row.keluar || 0}</td>
      </tr>
    `;
    })
    .join("");
}

// ================= DASBOR =================
async function loadDashboard() {
  try {
    console.log("DASHBOARD RUNNING");

    const { data: penjualan, error: err1 } = await supabase.from("penjualan").select("total, customer_id");

    if (err1) throw err1;

    let totalPenjualan = 0;
    const customerSet = new Set();

    (penjualan || []).forEach((p) => {
      const val = Number(p.total || 0);
      totalPenjualan += val;

      if (p.customer_id) {
        customerSet.add(p.customer_id);
      }
    });

    const omset = totalPenjualan; // ✅ FIX
    const totalNota = (penjualan || []).length;
    const customerAktif = customerSet.size;

    // ================= QTY =================
    const { data: detail } = await supabase.from("penjualan_detail").select("qty");

    const qty = (detail || []).reduce((sum, d) => sum + Number(d.qty || 0), 0);

    // ================= PIUTANG =================
    const { data: piutangData } = await supabase.from("v_piutang").select("sisa");

    const piutang = (piutangData || []).reduce((sum, p) => sum + Number(p.sisa || 0), 0);

    // ================= HUTANG =================
    const { data: hutangData } = await supabase.from("v_hutang").select("sisa");

    const hutang = (hutangData || []).reduce((sum, h) => sum + Number(h.sisa || 0), 0);

    // ================= ARUS KAS =================
    const { data: kasData } = await supabase.from("v_arus_kas").select("masuk, keluar");

    let kasMasuk = 0;
    let kasKeluar = 0;

    (kasData || []).forEach((k) => {
      kasMasuk += Number(k.masuk || 0);
      kasKeluar += Number(k.keluar || 0);
    });

    const rata = totalNota ? Math.round(totalPenjualan / totalNota) : 0;

    // ================= RENDER =================
    setText("dash-omset", formatRupiah(omset));
    setText("dash-kas-masuk", formatRupiah(kasMasuk));
    setText("dash-kas-keluar", formatRupiah(kasKeluar));

    setText("dash-nota", totalNota);
    setText("dash-qty", qty);
    setText("dash-rata", formatRupiah(rata));
    setText("dash-piutang", formatRupiah(piutang));
    setText("dash-hutang", formatRupiah(hutang));
    setText("dash-customer", customerAktif);
  } catch (err) {
    console.error("ERROR DASHBOARD:", err);
  }
}

function openRef(type, id) {
  if (type === "PO") {
    route(`form-pembelian?id=${id}`);
  } else if (type === "INV") {
    route(`form-penjualan?id=${id}`);
  }
}
// ================= GENERATE CODE =================
function generateCode(prefix, lastNumber = 0) {
  const next = lastNumber + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}
async function generateCustomerCode() {
  const { data, error } = await supabase
    .from("customers")
    .select("kode")
    .not("kode", "is", null) // 🔥 skip yang null
    .order("kode", { ascending: false })
    .limit(1);

  if (error) {
    console.error("ERROR GENERATE CODE:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return "CUST-001";
  }

  const lastKode = data[0].kode;

  // 🔥 VALIDASI FORMAT
  if (!lastKode || !lastKode.includes("-")) {
    return "CUST-001";
  }

  const num = parseInt(lastKode.split("-")[1]) || 0;

  return `CUST-${String(num + 1).padStart(3, "0")}`;
}
async function generateSalesCode() {
  const { data, error } = await supabase.from("sales").select("kode").order("created_at", { ascending: false }).limit(1);

  if (error || !data || data.length === 0) return "SLS-001";

  const last = data[0].kode || "SLS-000";
  const num = parseInt(last.split("-")[1]) || 0;

  return "SLS-" + String(num + 1).padStart(3, "0");
}

// =====================================================
// ====================== TOGGLE SIDEBAR =====================
// =====================================================

function closeSidebarMobile() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (window.innerWidth <= 768) {
    sidebar?.classList.remove("show");
    overlay?.classList.remove("show");
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("mini");

  // AUTO COLLAPSE MASTER
  const masterMenu = document.getElementById("master-menu");
  const masterParent = document.querySelector(".menu-parent");

  if (sidebar.classList.contains("mini")) {
    masterMenu?.classList.remove("show");
    masterParent?.classList.remove("open");
  }
}

function toggleMobileSidebar() {
  document.getElementById("sidebar").classList.toggle("show");
  document.getElementById("overlay").classList.toggle("show");
}

function closeMobileSidebar() {
  document.getElementById("sidebar").classList.remove("show");
  document.getElementById("overlay").classList.remove("show");
}
function toggleSubmenu(id, el) {
  const menu = document.getElementById(id);
  if (!menu) return;

  menu.classList.toggle("show");
  el.classList.toggle("open");
}

// ====================== SWIPE =====================
(function initSwipeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const swipeZone = document.getElementById("swipeZone");

  if (!sidebar) return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let dragging = false;
  let fromEdge = false;

  const THRESHOLD = 70; // jarak minimal untuk trigger
  const EDGE = 25; // area tepi untuk mulai open
  const MAX_TRACK = 260; // lebar sidebar
  const VERTICAL_LOCK = 40; // toleransi vertikal (biar tidak ganggu scroll)

  function isOpen() {
    return sidebar.classList.contains("show");
  }

  function openSidebar() {
    sidebar.classList.add("show");
    overlay?.classList.add("show");
    sidebar.style.transform = ""; // reset inline transform
  }

  function closeSidebar() {
    sidebar.classList.remove("show");
    overlay?.classList.remove("show");
    sidebar.style.transform = "";
  }

  function onStart(e) {
    if (window.innerWidth > 768) return;

    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    currentX = startX;

    // mulai dari edge kiri untuk OPEN, atau dari dalam sidebar untuk CLOSE
    fromEdge = startX <= EDGE;
    dragging = fromEdge || isOpen();

    if (!dragging) return;

    sidebar.style.transition = "none"; // disable anim saat drag
  }

  function onMove(e) {
    if (!dragging) return;

    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = Math.abs(touch.clientY - startY);

    // kalau geser vertikal dominan → biarkan scroll
    if (dy > VERTICAL_LOCK) return;

    // OPEN (dari kiri)
    if (!isOpen() && fromEdge) {
      const translate = Math.min(Math.max(dx - MAX_TRACK, -MAX_TRACK), 0);
      sidebar.style.transform = `translateX(${translate}px)`;
    }

    // CLOSE (dari kanan ke kiri saat sidebar terbuka)
    if (isOpen()) {
      const translate = Math.min(Math.max(dx, -MAX_TRACK), 0);
      sidebar.style.transform = `translateX(${translate}px)`;
    }

    currentX = touch.clientX;
  }

  function onEnd() {
    if (!dragging) return;

    const dx = currentX - startX;

    sidebar.style.transition = "0.25s ease";

    // keputusan open/close
    if (!isOpen() && fromEdge) {
      // gesture buka
      if (dx > THRESHOLD) openSidebar();
      else closeSidebar();
    } else if (isOpen()) {
      // gesture tutup
      if (dx < -THRESHOLD) closeSidebar();
      else openSidebar();
    }

    dragging = false;
    fromEdge = false;
  }

  // attach events
  const target = document; // bisa juga swipeZone, tapi document lebih fleksibel

  target.addEventListener("touchstart", onStart, { passive: true });
  target.addEventListener("touchmove", onMove, { passive: true });
  target.addEventListener("touchend", onEnd, { passive: true });

  // overlay click tetap menutup
  overlay?.addEventListener("click", closeSidebar);
})();
// =====================================================
// ====================== LOAD PAGE =====================
// =====================================================
function initForm() {
  if (window.editPenjualanId) return; // 🔥 penting

  console.log("INIT FORM RUNNING");

  window.selectedCustomer = null;
  window.cart = [];

  const elCustomer = document.getElementById("customer");
  const elTelp = document.getElementById("telp");
  const elAlamat = document.getElementById("alamat");
  const elSales = document.getElementById("sales");

  if (elCustomer) elCustomer.value = "";
  if (elTelp) elTelp.value = "";
  if (elAlamat) elAlamat.value = "";
  if (elSales) elSales.value = "";
}
async function loadPage(page) {
  const container = document.getElementById("app"); // ⬅ ganti nama (AMAN)
  if (!container) return;

  try {
    const res = await fetch(`pages/${page}.html`);
    const html = await res.text();
    const editId = localStorage.getItem("edit_penjualan_id");

    container.innerHTML = html;

    renderIcons();

    // INIT KHUSUS FORM

    if (page === "form") {
      setTimeout(async () => {
        console.log("INIT FORM PENJUALAN");

        const editId = localStorage.getItem("edit_penjualan_id");

        // 🔥 JIKA EDIT → JANGAN RESET
        if (!editId && typeof initForm === "function") {
          initForm();
        }

        if (typeof loadCustomers === "function") await loadCustomers();

        if (typeof loadSalesPenjualan === "function") {
          await loadSalesPenjualan();
        }

        if (typeof setInvoice === "function") setInvoice();

        if (typeof loadProduk === "function") {
          await loadProduk();
        }

        if (typeof loadHppProduk === "function") {
          await loadHppProduk();
        }

        // 🔥 INI YANG KAMU BELUM PUNYA
        if (editId && typeof loadEditPenjualan === "function") {
          console.log("LOAD EDIT:", editId);

          await loadEditPenjualan(editId);

          localStorage.removeItem("edit_penjualan_id");
        }
      }, 100);
    }

    if (page === "penjualan") {
      setTimeout(async () => {
        await loadPenjualan();
      }, 50);
    }

    if (page === "master-customer") {
      setTimeout(async () => {
        await loadCustomersMaster();
      }, 50);
    }

    if (page === "master-supplier") {
      setTimeout(() => loadSupplier(), 50);
    }

    if (page === "master-sales") {
      setTimeout(() => loadSalesMaster(), 50);
    }

    if (page === "master-produk") {
      setTimeout(() => loadProdukMaster(), 50);
    }

    if (page.startsWith("form-pembelian")) {
      setTimeout(async () => {
        await loadSuppliers();
        await loadProduk();
        setPO();

        const editId = localStorage.getItem("edit_pembelian_id");

        if (editId && typeof loadEditPembelian === "function") {
          editPembelianId = editId;
          await loadEditPembelian(editId);
          localStorage.removeItem("edit_pembelian_id");
        }
      }, 100);
    }

    if (page === "lihat-stok") {
      loadStokList();
    }
    if (page === "arus-stok") {
      loadArusStok();
    }

    if (page === "pembelian") {
      setTimeout(async () => {
        await loadPembelian();
      }, 50);
    }

    if (page === "dashboard") {
      setTimeout(loadDashboard, 100);
    }

    if (page === "produksi") {
      setTimeout(loadProduksi, 100);
    }

    if (page === "form-produksi") {
      setTimeout(() => {
        loadSales();
        loadSupplierDropdown();
        loadProdukBahan();
        setNoProduksi();
        initFormProduksi(); // 🔥 penting
      }, 100);
    }

    if (page === "kartu-stok") {
      setTimeout(() => {
        loadKartuProduk();
      }, 100);
    }

    if (page === "persediaan") {
      setTimeout(() => {
        loadLaporanPersediaan();
      }, 100);
    }

    if (page === "analisa-margin") {
      setTimeout(() => {
        loadAnalisaMargin();
      }, 100);
    }

    if (page === "analisa-stok") {
      setTimeout(() => {
        loadAnalisaStok();
      }, 100);
    }

    if (page === "invoice") {
      setTimeout(() => {
        loadInvoice();
      }, 100);
    }

    if (page === "hutang") {
      setTimeout(loadHutang, 100);
    }
    if (page === "piutang") {
      setTimeout(loadPiutang, 100);
    }
    if (page === "pembayaran") {
      loadArusPembayaran();
    }
    if (page === "arus-kas") {
      setTimeout(loadArusKas, 100);
    }

    if (page === "pengeluaran") loadPengeluaran();
    if (page === "talangan") {
      loadTalangan();
    }

    if (page === "kas") {
      setTimeout(loadKas, 50);
    }
    if (page === "penyesuaian-stok") {
  await loadAdjustment()
  await loadProdukAdjustment()
}
  } catch (err) {
    container.innerHTML = "<h3>Page tidak ditemukan</h3>";
    console.error(err);
  }
}
async function loadEditPenjualan(id) {
  try {
    const { data, error } = await supabase
      .from("penjualan")
      .select(
        `
        *,
        customers(*),
        penjualan_detail(
          *,
          produk:produk_id(nama)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    console.log("DATA EDIT:", data);

    // ================= STATE =================
    window.editPenjualanId = id;

    const customer = data.customers || {};
    const detail = data.penjualan_detail || [];

    // ================= STOP AUTO RESET =================
    window.isEditMode = true;

    // ================= CUSTOMER =================
    const customerInput = document.getElementById("customer");
    customerInput.value = customer.nama || "";

    window.selectedCustomer = {
      id: customer.id,
      nama: customer.nama,
      telp: customer.telp,
      alamat: customer.alamat,
    };

    // ================= FIELD =================
    document.getElementById("telp").value = customer.telp || "";
    document.getElementById("alamat").value = customer.alamat || "";
    document.getElementById("tanggal").value = data.tanggal || "";
    document.getElementById("invoice").value = data.invoice || "";

    // ================= CART =================
    window.cart = detail.map((d) => ({
      produk_id: d.produk_id,
      produk: d.produk?.nama || "Produk",
      qty: d.qty || 0,
      harga: d.harga || 0,
      satuan: "Pcs",
    }));

    renderCart();

    // ================= AKTIFKAN KEMBALI =================
    setTimeout(() => {
      window.isEditMode = false;
    }, 300);
  } catch (err) {
    console.error("EDIT ERROR:", err.message, err);
  }
}

// =====================================================
// ====================PANGGIL NO REF =====================
// =====================================================
async function setInvoice() {
  const { data, error } = await supabase.rpc("generate_invoice");

  if (error) {
    console.error("Gagal generate invoice", error);
    return;
  }

  const el = document.getElementById("invoice");
  if (el) el.value = data;
}

// =====================================================
// ====================== GET FORM DATA =====================
// =====================================================
function getFormData() {
  const customer = document.getElementById("customer")?.value || "";
  const telp = document.getElementById("telp")?.value || "";
  const alamat = document.getElementById("alamat")?.value || "";
  const tanggal = document.getElementById("tanggal")?.value || "";

  const salesEl = document.getElementById("sales");
  const sales = salesEl ? salesEl.value : "";

  const pembayaran = document.getElementById("pembayaran")?.value || "cash";
  const dp = parseFloat(document.getElementById("dp")?.value || 0);

  // ✅ AMBIL LANGSUNG DARI OBJECT
  const customer_id = window.selectedCustomer?.id || null;

  // ✅ SELECT VALUE SUDAH UUID
  const sales_id = sales || null;

  return {
    customer: customer.trim(),
    customer_id,
    telp: telp.trim(),
    alamat: alamat.trim(),
    tanggal,
    sales: sales_id,
    pembayaran,
    dp,
    items: Array.isArray(window.cart) ? window.cart : [],
    total: calculateTotal(),
  };
}

function searchCustomer(keyword) {
  const dropdown = document.getElementById("customer-dropdown");
  window.selectedCustomer = null;

  if (!dropdown) return;

  if (!keyword) {
    dropdown.innerHTML = "";
    return;
  }

  const results = window.customers.filter((c) => c.nama.toLowerCase().includes(keyword.toLowerCase()));

  if (results.length === 0) {
    dropdown.innerHTML = `
      <div class="dropdown-item" onclick="openCustomerModal('${keyword}')">
        + Tambah "${keyword}"
      </div>
    `;
    return;
  }

  dropdown.innerHTML = results
    .map(
      (c) => `
        <div class="dropdown-item" onclick="selectCustomer('${c.id}')">
          ${c.nama}
        </div>
      `,
    )
    .join("");
}

// =====================================================
// ====================== CUSTOMER SELECT =====================
// =====================================================
function selectCustomer(id) {
  const c = window.customers.find((x) => String(x.id) === String(id));
  if (!c) return;

  window.selectedCustomer = c;

  console.log("SELECTED CUSTOMER:", c); // 🔥 debug

  document.getElementById("customer").value = c.nama;
  document.getElementById("telp").value = c.telp;
  document.getElementById("alamat").value = c.alamat;

  document.getElementById("customer-dropdown").innerHTML = "";
}
// =====================================================
// ================= TOMBOL TAMBAH CUSTOMER =====================
// =====================================================
function openCustomerModal() {
  // 🔥 reset delete state
  deleteCustomerId = null;

  // pastikan modal delete tidak aktif
  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) deleteModal.classList.remove("show");

  // buka modal customer
  document.getElementById("customerModal").classList.add("show");
}
// =====================================================
// ===============SAVE CUSTOMER FROM MODAL =====================
// =====================================================

async function saveCustomerFromModal() {
  const nama = document.getElementById("cust-nama")?.value.trim();
  const telp = document.getElementById("cust-telp")?.value.trim();
  const alamat = document.getElementById("cust-alamat")?.value.trim();

  if (!nama) {
    alert("Nama wajib diisi");
    return;
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        nama,
        telp,
        alamat,
      })
      .select()
      .single();

    if (error) throw error;

    // 🔥 set sebagai customer terpilih
    window.selectedCustomer = data;

    // isi ke form utama
    document.getElementById("customer").value = data.nama;
    document.getElementById("telp").value = data.telp || "";
    document.getElementById("alamat").value = data.alamat || "";

    // tutup modal
    closeCustomerModal();

    // refresh list customer dari DB
    if (typeof loadCustomers === "function") {
      await loadCustomers();
    }

    console.log("CUSTOMER CREATED:", data);
  } catch (err) {
    console.error(err);
    alert("Gagal simpan customer");
  }
}

function closeCustomerModal() {
  document.getElementById("customerModal")?.classList.remove("show");
}
// =====================================================
// ====================== CALCULATE =====================
// =====================================================
function calculateTotal() {
  return (window.cart || []).reduce((sum, item) => {
    return sum + item.qty * item.harga;
  }, 0);
}

function debugForm() {
  const data = getFormData();
  console.log("FORM DATA:", data);

  if (validateForm(data)) {
    console.log("VALID ✔");
  }
}
// =====================================================
// ====================== PENJUALAN =====================
// =====================================================

async function loadSalesPenjualan() {
  console.log("LOAD SALES PENJUALAN");

  const { data, error } = await supabase.from("sales").select("*");

  if (error) {
    console.error("ERROR SALES:", error);
    return;
  }

  console.log("DATA SALES:", data);

  const select = document.getElementById("sales");
  if (!select) {
    console.warn("SELECT #sales tidak ditemukan");
    return;
  }

  select.innerHTML = '<option value="">-- Pilih Sales --</option>';

  data.forEach((s) => {
    select.innerHTML += `<option value="${s.id}">${s.nama}</option>`;
  });
}
async function saveTransaksi() {
  const data = getFormData();
  if (!validateForm(data)) return;

  try {
    let customerId = data.customer_id;

    // ================= CUSTOMER =================
    if (!customerId) {
      const nama = (data.customer || "").trim();

      const { data: existing } = await supabase.from("customers").select("id").ilike("nama", nama).limit(1);

      if (existing && existing.length > 0) {
        customerId = existing[0].id;
      } else {
        const { data: cust, error } = await supabase
          .from("customers")
          .insert({
            nama,
            telp: data.telp,
            alamat: data.alamat,
          })
          .select()
          .single();

        if (error) throw error;
        customerId = cust.id;
      }
    }

    // ================= INVOICE =================
    const invoiceNo = document.getElementById("invoice")?.value || "INV-" + Date.now(); // fallback aman

    // ================= PAYLOAD =================
    const payload = {
      tanggal: data.tanggal,
      customer_id: customerId,
      sales_id: String(data.sales),
      total: Number(data.total) || 0,
      pembayaran: data.pembayaran || "cash",
      dp: Number(data.dp) || 0,
      invoice: invoiceNo, // 🔥 WAJIB
    };

    let penjualanId;
    let resultRow;

    // ================= EDIT MODE =================
    if (window.editPenjualanId) {
      const id = window.editPenjualanId;

      await supabase.from("penjualan").update(payload).eq("id", id);

      penjualanId = id;

      // bersihkan data lama
      await supabase.from("penjualan_detail").delete().eq("penjualan_id", id);
      await supabase.from("arus_stok").delete().eq("ref_id", id).eq("ref_type", "INV");
      await supabase.from("pembayaran").delete().eq("ref_id", id).eq("ref_type", "INV");

      const { data } = await supabase.from("penjualan").select("id, invoice").eq("id", id).single();

      resultRow = data;
    } else {
      // ================= INSERT =================
      const { data, error } = await supabase.from("penjualan").insert(payload).select("id, invoice").single();

      if (error) throw error;

      penjualanId = data.id;
      resultRow = data;
    }

    // ================= DETAIL =================
    const details = data.items.map((item) => {
      const key = String(item.produk_id);
      const hpp = Number(window.hppMap?.[key] || 0);

      return {
        penjualan_id: penjualanId,
        produk_id: item.produk_id,
        qty: Number(item.qty),
        harga: Number(item.harga),
        hpp,
      };
    });

    await supabase.from("penjualan_detail").insert(details);

    // ================= ARUS STOK =================
    const arus = data.items.map((item) => ({
      tanggal: payload.tanggal,
      ref_type: "INV",
      ref_id: penjualanId,
      ref_no: resultRow.invoice,
      ref_nama: data.customer,
      produk_id: item.produk_id,
      masuk: 0,
      keluar: Number(item.qty),
      harga: Number(item.harga),
      keterangan: "Penjualan",
    }));

    await supabase.from("arus_stok").insert(arus);

    // ================= PEMBAYARAN =================

    // hapus dulu (anti double)
    await supabase.from("pembayaran").delete().eq("ref_id", penjualanId).eq("ref_type", "INV");

    // CASH → langsung masuk kas
    if (payload.pembayaran === "cash") {
      await supabase.from("pembayaran").insert({
        id: crypto.randomUUID(), // 🔥 anti duplicate
        tanggal: payload.tanggal,
        ref_type: "INV",
        ref_id: penjualanId,
        ref_no: resultRow.invoice,
        jumlah: payload.total,
        tipe: "masuk",
        metode: "cash",
        keterangan: "Penjualan " + resultRow.invoice,
      });
    }

    // ================= DONE =================

    await logActivity({
      aksi: "CREATE",
      modul: "Penjualan",
      ref_no: resultRow.invoice,
      keterangan: "Transaksi penjualan",
    });

    showNotif(`${getCurrentUser()?.username || "User"} membuat Penjualan ${resultRow.invoice}`);

    showToast(`Berhasil: ${resultRow.invoice}`);

    window.editPenjualanId = null;
    resetForm();

    setTimeout(() => route("penjualan"), 300);
  } catch (err) {
    console.error("ERROR SAVE:", err);
    showToast("Gagal simpan transaksi", "error");
  }
}
// ====================== delete edit penjualan =====================
function deletePenjualan(id) {
  console.log("OPEN DELETE:", id);

  deleteId = id;

  const modal = document.getElementById("deleteModal");
  if (!modal) return;

  modal.classList.add("show");
}

async function confirmDelete() {
  if (!deleteId) return;

  try {
    // hapus detail dulu
    await supabase.from("penjualan_detail").delete().eq("penjualan_id", deleteId);

    // hapus header
    const { error } = await supabase.from("penjualan").delete().eq("id", deleteId);

    if (error) throw error;

    closeDeleteModal();
    loadPenjualan();
  } catch (err) {
    console.error(err);
    alert("Gagal hapus");
  }
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (!modal) return;

  modal.classList.remove("show");
  deleteCustomerId = null;
}

function editPenjualan(id) {
  console.log("EDIT:", id);
  // simpan id ke global / localStorage
  localStorage.setItem("edit_penjualan_id", id);

  route("form");
}

// =====================================================
// ================= PEMBELIAN =====================
// =====================================================
async function loadSuppliers() {
  const { data } = await supabase.from("suppliers").select("*");
  window.suppliers = data || [];
}

async function loadSupplierDropdown() {
  const select = document.getElementById("supplier_id");
  if (!select) return;

  const { data, error } = await supabase.from("suppliers").select("id, nama").order("nama");

  if (error) {
    console.error("ERROR LOAD SUPPLIER:", error);
    return;
  }

  select.innerHTML = `
    <option value="">-- Internal (tanpa jasa) --</option>
    ${data.map((s) => `<option value="${s.id}">${s.nama}</option>`).join("")}
  `;

  console.log("SUPPLIER DROPDOWN:", data);
}

function searchSupplier(keyword) {
  const dropdown = document.getElementById("supplier-dropdown");
  window.selectedSupplier = null;

  if (!keyword) {
    dropdown.innerHTML = "";
    return;
  }

  const results = window.suppliers.filter((s) => s.nama.toLowerCase().includes(keyword.toLowerCase()));

  dropdown.innerHTML = results
    .map(
      (s) => `
    <div class="dropdown-item" onclick="selectSupplier('${s.id}')">
      ${s.nama}
    </div>
  `,
    )
    .join("");
}

function selectSupplier(id) {
  const s = window.suppliers.find((x) => x.id === id);
  if (!s) return;

  window.selectedSupplier = s;

  document.getElementById("supplier").value = s.nama;
  document.getElementById("telp").value = s.telp || "";
  document.getElementById("alamat").value = s.alamat || "";

  document.getElementById("supplier-dropdown").innerHTML = "";
}

async function setPO() {
  const { data } = await supabase.rpc("generate_po");

  const el = document.getElementById("po");
  if (el) el.value = data;
}
async function savePembelian() {
  const supplier = window.selectedSupplier;

  if (!supplier) return showToast("Supplier wajib dipilih", "error");
  if (!cart.length) return showToast("Item kosong", "error");

  const basePayload = {
    supplier_id: supplier.id,
    tanggal: document.getElementById("tanggal").value,
    total: calculateTotal(),
    pembayaran: document.getElementById("pembayaran").value,
    dp: parseFloat(document.getElementById("dp").value || 0),
  };

  try {
    let pembelianId;
    let resultRow;

    // ================= EDIT MODE =================
    if (editPembelianId) {
      const { error: errUpdate } = await supabase.from("pembelian").update(basePayload).eq("id", editPembelianId);

      if (errUpdate) throw errUpdate;

      pembelianId = editPembelianId;

      // ❌ hapus detail lama
      const { error: errDelete } = await supabase.from("pembelian_detail").delete().eq("pembelian_id", pembelianId);

      if (errDelete) throw errDelete;

      // ❌ hapus arus stok lama (PENTING)
      const { error: errDeleteArus } = await supabase.from("arus_stok").delete().eq("ref_id", pembelianId).eq("ref_type", "PO");

      if (errDeleteArus) throw errDeleteArus;

      // ambil no_po terbaru
      const { data, error: errGet } = await supabase.from("pembelian").select("id, no_po").eq("id", pembelianId).single();

      if (errGet) throw errGet;

      resultRow = data;
    } else {
      // ================= INSERT MODE =================
      const { data, error: errInsert } = await supabase.from("pembelian").insert(basePayload).select("id, no_po").single();

      if (errInsert) throw errInsert;

      pembelianId = data.id;
      resultRow = data;
    }

    // ================= INSERT DETAIL =================
    const details = cart.map((item) => ({
      pembelian_id: pembelianId,
      produk_id: item.produk_id,
      qty: Number(item.qty),
      harga: Number(item.harga),
    }));

    const { error: errDetail } = await supabase.from("pembelian_detail").insert(details);

    if (errDetail) throw errDetail;

    // ================= INSERT ARUS STOK =================
    const arus = cart.map((item) => ({
      tanggal: basePayload.tanggal,
      ref_type: "PO",
      ref_id: pembelianId,
      ref_no: resultRow.no_po,
      ref_nama: supplier.nama,
      produk_id: item.produk_id,
      masuk: Number(item.qty),
      keluar: 0,
      harga: Number(item.harga),
      keterangan: "Pembelian",
    }));

    const { error: errArus } = await supabase.from("arus_stok").insert(arus);

    if (errArus) throw errArus;

    // ================= SUCCESS =================
    showToast(editPembelianId ? `Update berhasil (${resultRow.no_po})` : `Berhasil (${resultRow.no_po})`);

    // reset state
    editPembelianId = null;
    window.cart = [];

    resetForm();

    setTimeout(() => {
      route("pembelian");
    }, 300);
  } catch (err) {
    console.error("ERROR SAVE PEMBELIAN:", err);
    showToast("Gagal simpan pembelian", "error");
  }
}

// =====================================================
// ================= DATA PEMBELIAN =====================
// =====================================================
async function loadPembelian() {
  const { data, error } = await supabase
    .from("pembelian")
    .select(
      `
      id,
      no_po,
      tanggal,
      total,
      pembayaran,
      suppliers ( nama )
    `,
    )
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("LOAD PEMBELIAN ERROR:", error);
    return;
  }

  renderPembelian(data);
}
function renderPembelian(data) {
  const tbody = document.getElementById("table-pembelian-body");
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">Belum ada data</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data
    .map(
      (row) => `
    <tr>
      <td>${formatTanggal(row.tanggal)}</td>

      <td>
        <div class="cell-main">${row.suppliers?.nama || "-"}</div>
        <div class="cell-sub">${row.no_po}</div>
      </td>

      <td>${formatRupiah(row.total)}</td>

      <td>
        <span class="badge ${row.pembayaran === "cash" ? "success" : "warning"}">
          ${row.pembayaran}
        </span>
      </td>

      <td class="table-action">
  <span class="action-btn" onclick="editPembelian('${row.id}')">
    <i data-lucide="pencil"></i>
  </span>

  <span class="action-btn" onclick="deletePembelian('${row.id}')">
    <i data-lucide="trash-2"></i>
  </span>
</td>
    </tr>
  `,
    )
    .join("");

  renderIcons();
}

function deletePembelian(id) {
  deletePembelianId = id;
  document.getElementById("deleteModal").classList.add("show");
}

async function confirmDeletePembelian() {
  if (!deletePembelianId) return;

  try {
    // hapus detail dulu
    await supabase.from("pembelian_detail").delete().eq("pembelian_id", deletePembelianId);

    // hapus header
    await supabase.from("pembelian").delete().eq("id", deletePembelianId);

    closeDeleteModal();
    loadPembelian();
    showToast("Pembelian berhasil dihapus");
  } catch (err) {
    console.error(err);
    showToast("Gagal hapus", "error");
  }
}
function editPembelian(id) {
  editPembelianId = id;
  localStorage.setItem("edit_pembelian_id", id);
  route("form-pembelian");
}
async function loadEditPembelian(id) {
  const { data, error } = await supabase
    .from("pembelian")
    .select(
      `
      *,
      suppliers(*),
      pembelian_detail(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  // isi form
  document.getElementById("supplier").value = data.suppliers.nama;
  document.getElementById("telp").value = data.suppliers.telp || "";
  document.getElementById("alamat").value = data.suppliers.alamat || "";
  document.getElementById("tanggal").value = data.tanggal;
  document.getElementById("po").value = data.no_po;

  window.selectedSupplier = data.suppliers;

  // isi cart
  window.cart = data.pembelian_detail.map((d) => ({
    produk_id: d.produk_id,
    produk: d.produk || "Produk",
    qty: d.qty,
    harga: d.harga,
    satuan: "Pcs",
  }));

  renderCart();
}
// =====================================================
// ================= PRODUKSI =====================
// =====================================================
function initFormProduksi() {
  const btn = document.getElementById("btn-tambah-bahan");
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");

  if (btn) {
    btn.addEventListener("click", openModalBahan);
  }
  if (editId) {
    loadEditProduksi(editId);
  }
}
async function saveProduksi() {
  if (window.isSubmittingProduksi) return; // 🔥 anti double click
  window.isSubmittingProduksi = true;

  try {
    // ===== AMBIL INPUT =====
    const tanggal = document.getElementById("tanggal")?.value;
    const bahan = window.bahanList || [];

    const salesId = document.getElementById("sales_id")?.value || null;
    const supplierId = document.getElementById("supplier_id")?.value || null;

    const pembayaran = document.getElementById("pembayaran_jasa")?.value || "kredit";
    const biayaJasa = Number(document.getElementById("biaya_jasa")?.value || 0);

    // ===== VALIDASI =====
    if (!tanggal) throw new Error("Tanggal wajib diisi");
    if (!bahan.length) throw new Error("Bahan belum ada");

    if (bahan.some((b) => !b.produk_id || !b.qty || b.qty <= 0)) {
      throw new Error("Data bahan tidak valid");
    }

    if (biayaJasa > 0 && !supplierId) {
      throw new Error("Supplier wajib dipilih jika ada biaya jasa");
    }

    // ===== GENERATE NO PRODUKSI =====
    const { data: noProduksi, error: errNo } = await supabase.rpc("generate_no_produksi");
    if (errNo) throw errNo;

    const noProduksiValue = typeof noProduksi === "string" ? noProduksi : noProduksi?.generate_no_produksi;

    if (!noProduksiValue) throw new Error("Gagal generate no produksi");

    // ===== INSERT HEADER =====
    const { data: header, error: err1 } = await supabase
      .from("produksi")
      .insert({
        tanggal,
        no_produksi: noProduksiValue,
        sales_id: salesId,
        supplier_id: supplierId,
        biaya_jasa: biayaJasa,
        status: "PROSES",
      })
      .select("id, no_produksi")
      .single();

    if (err1) throw err1;

    const produksiId = header.id;

    // ===== INSERT DETAIL =====
    const detail = bahan.map((b) => ({
      produksi_id: produksiId,
      produk_id: b.produk_id,
      qty: Number(b.qty),
      tipe: "BAHAN",
    }));

    const { error: err2 } = await supabase.from("produksi_detail").insert(detail);

    if (err2) throw err2;

    // ===== ARUS STOK =====
    const arus = bahan.map((b) => ({
      tanggal,
      ref_type: "PROD",
      ref_id: produksiId,
      ref_no: header.no_produksi,
      ref_nama: "Produksi",
      produk_id: b.produk_id,
      masuk: 0,
      keluar: Number(b.qty),
      harga: 0,
      keterangan: "Produksi (proses)",
    }));

    const { error: err3 } = await supabase.from("arus_stok").insert(arus);

    if (err3) throw err3;

    // ===== HANDLE BIAYA JASA =====
    if (supplierId && biayaJasa > 0) {
      // 🔥 HAPUS DULU JIKA ADA (ANTI DOUBLE)
      await supabase.from("pembayaran").delete().eq("ref_id", produksiId).eq("ref_type", "PROD");

      // ===== KREDIT → MASUK HUTANG =====
      if (pembayaran === "kredit") {
        const { error: err4 } = await supabase.from("pembelian").insert({
          no_po: "PO-" + header.no_produksi,
          supplier_id: supplierId,
          total: biayaJasa,
          pembayaran: "kredit",
          dp: 0,
          tanggal,
        });

        if (err4) throw err4;
      }

      // ===== CASH → ARUS KAS =====
      if (pembayaran === "cash") {
        const { error: err5 } = await supabase.from("pembayaran").insert({
          tanggal,
          ref_type: "PROD",
          ref_id: produksiId,
          ref_no: header.no_produksi,
          jumlah: biayaJasa,
          tipe: "keluar",
          metode: "cash",
          keterangan: "Jasa produksi",
        });

        if (err5) throw err5;
      }
    }

    // ===== SUCCESS =====
    alert(`Produksi dibuat (${header.no_produksi})`);

    window.bahanList = [];

    setTimeout(() => {
      route("produksi");
    }, 300);
  } catch (err) {
    console.error("ERROR PRODUKSI:", err);
    alert(err.message || "Gagal simpan produksi");
  } finally {
    window.isSubmittingProduksi = false; // 🔥 reset lock
  }
}

async function finishProduksi(id, hasilId, qtyHasil) {
  try {
    // ===== VALIDASI =====
    if (!hasilId) return alert("Produk hasil belum dipilih");
    if (!qtyHasil || qtyHasil <= 0) return alert("Qty hasil tidak valid");

    // ===== AMBIL HEADER =====
    const { data: header, error: errHeader } = await supabase.from("produksi").select("no_produksi, tanggal, status").eq("id", id).single();

    if (errHeader) throw errHeader;

    if (header.status === "SELESAI") {
      return alert("Produksi sudah selesai");
    }

    // ===== AMBIL SEMUA BAHAN =====
    const { data: bahanList, error: errBahan } = await supabase.from("produksi_detail").select("qty").eq("produksi_id", id).eq("tipe", "BAHAN");

    if (errBahan) throw errBahan;

    if (!bahanList || bahanList.length === 0) {
      return alert("Bahan tidak ditemukan");
    }

    // ===== HITUNG TOTAL =====
    let totalQtyBahan = 0;
    let totalNilaiBahan = 0;

    for (const b of bahanList) {
      const qty = Number(b.qty) || 0;
      const harga = 50000; // TODO: nanti ambil HPP real

      totalQtyBahan += qty;
      totalNilaiBahan += qty * harga;
    }

    // ===== BIAYA TAMBAHAN =====
    const biayaRoast = totalQtyBahan * 10000;

    const totalBiaya = totalNilaiBahan + biayaRoast;
    const hpp = totalBiaya / qtyHasil;

    // ===== INSERT HASIL =====
    const { error: errInsert } = await supabase.from("produksi_detail").insert({
      produksi_id: id,
      produk_id: hasilId,
      qty: qtyHasil,
      tipe: "HASIL",
    });

    if (errInsert) throw errInsert;

    // ===== ARUS STOK MASUK =====
    const { error: errArus } = await supabase.from("arus_stok").insert({
      tanggal: header.tanggal,
      ref_type: "PROD",
      ref_id: id,
      ref_no: header.no_produksi,
      ref_nama: "Produksi",
      produk_id: hasilId,
      masuk: qtyHasil,
      keluar: 0,
      harga: hpp,
      keterangan: "Hasil produksi",
    });

    if (errArus) throw errArus;

    // ===== UPDATE STATUS =====
    const { error: errUpdate } = await supabase.from("produksi").update({ status: "SELESAI" }).eq("id", id);

    if (errUpdate) throw errUpdate;

    alert(`Produksi selesai\nHPP: ${Math.round(hpp)}`);

    loadProduksi();
  } catch (err) {
    console.error("ERROR FINISH:", err);
    alert(err.message || "Gagal menyelesaikan produksi");
  }
}

async function getLastHpp(produkId) {
  const { data, error } = await supabase
    .from("arus_stok")
    .select("harga")
    .eq("produk_id", produkId)
    .gt("masuk", 0) // hanya barang masuk
    .order("tanggal", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 0;

  return Number(data.harga) || 0;
}

function addBahan() {
  const id = document.getElementById("bahan-id").value;
  const nama = document.getElementById("bahan-nama").value;
  const qty = Number(document.getElementById("bahan-qty").value);

  if (!id || !nama) {
    return alert("Pilih produk dari list");
  }

  if (!qty || qty <= 0) {
    return alert("Qty tidak valid");
  }

  // 🔥 pastikan array ada
  if (!window.bahanList) {
    window.bahanList = [];
  }

  window.bahanList.push({
    produk_id: id,
    nama: nama,
    qty: qty,
  });

  console.log("BAHAN LIST:", window.bahanList);

  closeModalBahan();
  renderBahanList(); // nanti kita bikin
}
function renderBahanList() {
  const container = document.getElementById("bahan-list");
  if (!container) return;

  const list = window.bahanList || [];

  if (!list.length) {
    container.innerHTML = `<div class="empty">Belum ada bahan</div>`;
    updateSummaryProduksi();
    return;
  }

  container.innerHTML = list
    .map(
      (b, i) => `
      <div class="cart-item">
        <div>
          <div class="cart-title">${b.nama}</div>
          <div class="cart-sub">${b.qty} kg</div>
        </div>
        <button class="btn-delete" onclick="removeBahan(${i})">✕</button>
      </div>
    `,
    )
    .join("");

  updateSummaryProduksi(); // 🔥 FIX DI SINI
}

function renderBahan() {
  const el = document.getElementById("bahan-list");

  if (!window.bahanList.length) {
    el.innerHTML = `<div class="empty">Belum ada bahan</div>`;
    return;
  }

  el.innerHTML = window.bahanList
    .map(
      (b, i) => `
    <div class="cart-item">
      <div>
        <strong>${b.nama}</strong><br/>
        ${b.qty} kg
      </div>
      <button onclick="removeBahan(${i})">x</button>
    </div>
  `,
    )
    .join("");

  updateSummary();
}

function removeBahan(index) {
  window.bahanList.splice(index, 1);
  renderBahanList();
}
function updateSummaryProduksi() {
  const elBahan = document.getElementById("sum-bahan");
  const elEstimasi = document.getElementById("sum-estimasi");
  const elJasa = document.getElementById("sum-jasa"); // 🔥 tambahan

  if (!elBahan || !elEstimasi) return;

  let total = 0;

  (window.bahanList || []).forEach((b) => {
    total += Number(b.qty) || 0;
  });

  const estimasi = total * 0.8;

  elBahan.innerText = total + " kg";
  elEstimasi.innerText = estimasi.toFixed(2) + " kg";

  // 🔥 TAMBAHAN BIAYA JASA
  if (elJasa) {
    const biaya = Number(document.getElementById("biaya_jasa")?.value || 0);
    elJasa.innerText = formatRupiah(biaya);
  }
}

function closeModalBahan() {
  document.getElementById("modal-bahan").classList.remove("show");

  document.getElementById("bahan-id").value = "";
  document.getElementById("bahan-nama").value = "";
  document.getElementById("bahan-qty").value = 1;
}
function initProdukAutocomplete() {
  const input = document.getElementById("bahan-nama");
  const hidden = document.getElementById("bahan-id");

  if (!input) return;

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();

    const results = (window.produkList || []).filter((p) => p.nama.toLowerCase().includes(val));

    renderDropdown(results, input, hidden);
  });
}

function renderDropdown(list, input, hidden) {
  let dropdown = document.getElementById("produk-dropdown");

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "produk-dropdown";
    dropdown.className = "dropdown-list";
    input.parentNode.appendChild(dropdown);
  }

  if (!list.length) {
    dropdown.innerHTML = `<div class="dropdown-item empty">Tidak ditemukan</div>`;
    return;
  }

  dropdown.innerHTML = list
    .map(
      (p) => `
      <div class="dropdown-item" data-id="${p.id}" data-nama="${p.nama}">
        ${p.nama}
      </div>
    `,
    )
    .join("");

  dropdown.querySelectorAll(".dropdown-item").forEach((el) => {
    el.onclick = () => {
      input.value = el.dataset.nama;
      hidden.value = el.dataset.id;
      dropdown.innerHTML = "";
    };
  });
}
function showProdukDropdown(list, input, hidden) {
  let dropdown = document.getElementById("produk-dropdown");

  if (!dropdown) {
    dropdown = document.createElement("div");
    dropdown.id = "produk-dropdown";
    dropdown.className = "dropdown-list";
    input.parentNode.appendChild(dropdown);
  }

  dropdown.innerHTML = list
    .map(
      (p) => `
      <div class="dropdown-item" data-id="${p.id}" data-nama="${p.nama}">
        ${p.nama}
      </div>
    `,
    )
    .join("");

  dropdown.querySelectorAll(".dropdown-item").forEach((el) => {
    el.onclick = () => {
      input.value = el.dataset.nama;
      hidden.value = el.dataset.id;
      dropdown.innerHTML = "";
    };
  });
}
function openModalBahan() {
  const modal = document.getElementById("modal-bahan");
  modal.classList.add("show");

  setTimeout(() => {
    initProdukAutocomplete(); // 🔥 WAJIB
  }, 100);
}
// ================= LOAD PRODUKSI =====================
async function loadProduksi() {
  const { data, error } = await supabase.from("produksi").select("*").order("tanggal", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const el = document.getElementById("produksi-body");

  el.innerHTML = data
    .map((p, i) => {
      return `
      <tr>
        <td>${i + 1}</td>
        <td><b>${p.no_produksi}</b></td>
        <td>${formatTanggal(p.tanggal)}</td>

        <td>
          ${p.status === "SELESAI" ? `<span class="badge success">SELESAI</span>` : `<span class="badge warning">PROSES</span>`}
        </td>

        <td class="text-center">
          <button onclick="editProduksi('${p.id}')" class="btn-xs">Edit</button>
          <button onclick="deleteProduksi('${p.id}')" class="btn-xs danger">Hapus</button>

          ${p.status !== "SELESAI" ? `<button onclick="openFinish('${p.id}')" class="btn-xs primary">Selesaikan</button>` : "-"}
        </td>
      </tr>
      `;
    })
    .join("");
}
async function confirmFinish() {
  try {
    const hasilId = document.getElementById("hasil-id").value;
    const qty = Number(document.getElementById("hasil-qty").value);

    if (!hasilId) return alert("Pilih produk hasil");
    if (!qty || qty <= 0) return alert("Qty tidak valid");

    const { error } = await supabase.rpc("finish_produksi", {
      p_produksi_id: selectedProduksiId,
      p_produk_hasil: hasilId,
      p_qty: qty,
    });

    if (error) throw error;

    alert("Produksi selesai");

    closeFinish();
    loadProduksi();
  } catch (err) {
    console.error(err);
    alert("Gagal finish produksi");
  }
}
function openFinish(id) {
  selectedProduksiId = id;

  const modal = document.getElementById("modal-finish");
  const select = document.getElementById("hasil-id");
  const qty = document.getElementById("hasil-qty");

  // reset input
  if (select) select.value = "";
  if (qty) qty.value = "";

  // load dropdown produk hasil
  loadProdukHasil();

  // tampilkan modal (pakai class, bukan style inline)
  if (modal) modal.classList.add("show");
}

function closeFinish() {
  const modal = document.getElementById("modal-finish");
  if (modal) modal.classList.remove("show");

  selectedProduksiId = null;
}

async function loadProdukHasil() {
  const el = document.getElementById("hasil-id");
  if (!el) return;

  const { data, error } = await supabase.from("produk").select("id, nama").ilike("nama", "RB%").order("nama");

  if (error) {
    console.error("ERROR PRODUK:", error);
    return;
  }

  if (!data || data.length === 0) {
    el.innerHTML = `<option value="">❌ Tidak ada produk hasil</option>`;
    return;
  }

  el.innerHTML = `
    <option value="">-- Pilih Produk --</option>
    ${data.map((p) => `<option value="${p.id}">${p.nama}</option>`).join("")}
  `;
}
async function setNoProduksi() {
  const el = document.getElementById("no_produksi");
  if (!el) return;

  const { data, error } = await supabase.rpc("generate_no_produksi");

  if (error) {
    console.error("ERROR NO PRODUKSI:", error);
    return;
  }

  el.value = data;
}
async function loadProdukBahan() {
  const { data, error } = await supabase.from("produk").select("id, nama").order("nama");

  if (error) {
    console.error("ERROR LOAD PRODUK:", error);
    return;
  }

  window.produkList = data || [];
}
async function deleteProduksi(id) {
  if (!confirm("Yakin hapus produksi ini?")) return;

  try {
    // hapus detail
    await supabase.from("produksi_detail").delete().eq("produksi_id", id);

    // hapus arus stok
    await supabase.from("arus_stok").delete().eq("ref_id", id).eq("ref_type", "PROD");

    // hapus header
    const { error } = await supabase.from("produksi").delete().eq("id", id);
    if (error) throw error;

    alert("Berhasil dihapus");
    loadProduksi();
  } catch (err) {
    console.error(err);
    alert("Gagal hapus");
  }
}
function editProduksi(id) {
  route("form-produksi?id=" + id);
}
async function loadEditProduksi(id) {
  const { data, error } = await supabase.from("produksi").select("*").eq("id", id).single();

  if (error) return console.error(error);

  document.getElementById("tanggal").value = data.tanggal;
  document.getElementById("sales_id").value = data.sales_id || "";
  document.getElementById("supplier_id").value = data.supplier_id || "";
  document.getElementById("biaya_jasa").value = data.biaya_jasa || 0;
}

// =====================================================
// =====================Kartu Stok/KARTU PRODUK =====================
// =====================================================
async function loadKartuProduk() {
  await loadFilterProdukSupabase(); // 🔥 tambah ini

  const { data, error } = await supabase.from("v_kartu_produk").select("*").order("nama", { ascending: true });

  if (error) return console.error(error);

  renderKartuProduk(data);
  renderSummary(data);

  // 🔥 EVENT FILTER
  const select = document.getElementById("filter-produk");

  if (select && !select.dataset.loaded) {
    select.dataset.loaded = "true";

    select.addEventListener("change", () => {
      const val = select.value;

      const filtered = !val ? data : data.filter((d) => d.nama === val);

      renderKartuProduk(filtered);
      renderSummary(filtered);
    });
  }
}
async function loadHppProduk() {
  const { data, error } = await supabase.from("v_kartu_produk").select("id, hpp"); // 🔥 GANTI KE ID

  if (error) {
    console.error("ERROR LOAD HPP:", error);
    return;
  }

  window.hppMap = {};

  data.forEach((p) => {
    window.hppMap[p.id] = Number(p.hpp || 0); // 🔥 KEY = ID
  });

  console.log("HPP MAP:", window.hppMap);
}
function renderKartuProduk(data) {
  const el = document.getElementById("kartu-stok-body");

  if (!data.length) {
    el.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">Tidak ada data</td>
      </tr>
    `;
    return;
  }

  el.innerHTML = data
    .map(
      (d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${d.nama}</td>
      <td>${d.kategori || "-"}</td>
      <td>${formatNumber(d.stok)}</td>
      <td>${formatRp(d.hpp)}</td>
      <td>${formatRp(d.harga_jual)}</td>
      <td>${formatRp(d.nilai_hpp)}</td>
      <td>${formatRp(d.nilai_jual)}</td>
      <td>${formatRp(d.margin)}</td>
    </tr>
  `,
    )
    .join("");
}

function renderSummary(data) {
  const totalHpp = data.reduce((a, b) => a + Number(b.nilai_hpp || 0), 0);
  const totalJual = data.reduce((a, b) => a + Number(b.nilai_jual || 0), 0);
  const margin = totalJual - totalHpp;

  document.getElementById("sum-hpp").innerText = formatRp(totalHpp);
  document.getElementById("sum-jual").innerText = formatRp(totalJual);
  document.getElementById("sum-margin").innerText = formatRp(margin);
}
async function loadProdukFilter() {
  const data = await google.script.run.withSuccessHandler((res) => res).getMasterData();

  const select = document.getElementById("filter-produk");
  select.innerHTML = '<option value="">-- Pilih Produk --</option>';

  data.produk.forEach((p) => {
    select.innerHTML += `<option value="${p.nama}">${p.nama}</option>`;
  });
}

function renderKartuStok(data, produkFilter = "") {
  const tbody = document.getElementById("kartu-stok-body");
  tbody.innerHTML = "";

  let saldo = 0;

  const filtered = data.filter((d) => !produkFilter || d.produk === produkFilter);

  filtered.forEach((d) => {
    saldo += (Number(d.masuk) || 0) - (Number(d.keluar) || 0);

    const row = `
      <tr>
        <td>${d.tanggal}</td>
        <td>${d.noRef}</td>
        <td>${d.produk}</td>
        <td>${d.masuk}</td>
        <td>${d.keluar}</td>
        <td>${saldo}</td>
        <td>${d.keterangan || ""}</td>
      </tr>
    `;

    tbody.innerHTML += row;
  });
}

function getDataKartuStok() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Arus Stok");
  const data = sh.getDataRange().getValues();

  const headers = data.shift();

  return data.map((row) => ({
    tanggal: row[0],
    noRef: row[1],
    produk: row[2],
    masuk: row[3],
    keluar: row[4],
    keterangan: row[8],
  }));
}

function initKartuStok() {
  loadProdukFilter();

  google.script.run
    .withSuccessHandler((data) => {
      renderKartuStok(data);
    })
    .getDataKartuStok();

  const select = document.getElementById("filter-produk");

  if (select && !select.dataset.loaded) {
    select.dataset.loaded = "true"; // 🔒 lock

    select.addEventListener("change", function () {
      const produk = this.value;

      google.script.run
        .withSuccessHandler((data) => {
          renderKartuStok(data, produk);
        })
        .getDataKartuStok();
    });
  }
}

async function loadFilterProdukSupabase() {
  const { data, error } = await supabase.from("produk").select("nama").order("nama");

  if (error) return console.error(error);

  const select = document.getElementById("filter-produk");
  if (!select) return;

  select.innerHTML = `<option value="">-- Semua Produk --</option>`;

  data.forEach((p) => {
    select.innerHTML += `<option value="${p.nama}">${p.nama}</option>`;
  });
}

//========================================================
// ==================== FORMAT RUPIAH =====================

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}
function formatNumber(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}
// =====================================================
// ====================== ROUTING =====================
// =====================================================
function route(page) {
  loadPage(page);
  setActiveMenu(page);
}

// =====================================================
// ====================== INIT APP =====================
// =====================================================
async function initApp() {
  checkLogin(); // 🔥 WAJIB

  // 🔥 LOAD COMPONENT DULU
  await loadComponent("navbar", "components/navbar.html");
  await loadComponent("sidebar", "components/sidebar.html");

  // 🔥 BARU RENDER USER (SUDAH AMAN)
  renderUser();

  // 🔥 FIX CLICK HANDLER (setelah sidebar ada)
  document.querySelectorAll(".sidebar-menu li").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (item.classList.contains("menu-parent")) {
        e.stopPropagation();
        return;
      }

      closeSidebarMobile();
    });
  });

  await loadCustomers();
  console.log("CUSTOMERS:", window.customers);

  await loadPage("dashboard");
  setActiveMenu("dashboard");

  renderIcons();
}

window.onload = initApp;

// ===== INIT GLOBAL EVENT =====
document.addEventListener("input", (e) => {
  if (e.target?.id === "biaya_jasa") {
    updateSummaryProduksi();
  }
});
function initFormPembelian() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    editPembelianId = id;
    loadEditPembelian(id);
  } else {
    editPembelianId = null;
    resetFormPembelian(); // jika ada
  }
}

// =====================================================
// ====================== CART ===========================
// =====================================================

// ================= ADD / UPDATE CART =================

function addToCart() {
  const produk = document.getElementById("produk").value.trim();
  const qty = parseFloat(document.getElementById("qty").value);
  const harga = parseFloat(document.getElementById("harga").value);
  const satuan = document.getElementById("satuan").value;

  if (!produk) return alert("Produk kosong");
  if (qty <= 0 || harga <= 0) return alert("Qty / Harga tidak valid");

  if (!window.selectedProduk) {
    alert("Pilih produk dari list");
    return;
  }

  const data = {
    produk_id: window.selectedProduk.id,
    produk: produk,
    qty,
    harga,
    satuan,
  };

  // 🔥 EDIT MODE
  if (editIndex !== null) {
    window.cart[editIndex] = data;
    editIndex = null;
  } else {
    const existing = window.cart.find((i) => i.produk_id === data.produk_id);

    if (existing) {
      existing.qty += qty;
    } else {
      window.cart.push(data);
    }
  }

  renderCart();
  closeModal();

  // reset
  window.selectedProduk = null;
}

// ================= RENDER CART =================
function renderCart() {
  const container = document.getElementById("cart-list");
  if (!container) return;

  let html = "";
  let total = 0;

  window.cart.forEach((item, index) => {
    const subtotal = item.qty * item.harga;
    total += subtotal;

    html += `
      <div class="cart-item">
        <div class="cart-left">
          <div class="cart-title">${item.produk}</div>
          <div class="cart-sub">
            ${item.qty} ${item.satuan} × ${formatRupiah(item.harga)}
          </div>
        </div>

        <div class="cart-right">
          <div class="cart-price">${formatRupiah(subtotal)}</div>
          <button class="cart-edit" onclick="editItem(${index})">✎</button>
          <button class="cart-delete" onclick="removeItem(${index})">✕</button>
        </div>
      </div>
    `;
  });

  if (window.cart.length === 0) {
    html = `<div class="cart-empty">Belum ada item</div>`;
  }

  container.innerHTML = html;

  updateSummary();
  resetItemForm();
}

// ================= UPDATE SUMMARY =================
function updateSummary() {
  let total = 0;

  window.cart.forEach((item) => {
    total += item.qty * item.harga;
  });

  const pembayaran = document.getElementById("pembayaran")?.value;
  const dp = parseFloat(document.getElementById("dp")?.value || 0);

  const sisa = Math.max(total - dp, 0);

  // TOTAL
  document.getElementById("sum-total").innerText = formatRupiah(total);

  // SISA
  const sisaGroup = document.getElementById("group-sisa");
  const sisaEl = document.getElementById("sum-sisa");

  if (pembayaran === "kredit") {
    sisaEl.innerText = formatRupiah(sisa);
    sisaGroup.style.display = "flex";
  } else {
    sisaGroup.style.display = "none";
  }
}

// ================= REMOVE =================
function removeItem(index) {
  window.cart.splice(index, 1);
  renderCart();
}

// ================= EDIT =================
function editItem(index) {
  const item = window.cart[index];

  document.getElementById("produk").value = item.produk;
  document.getElementById("qty").value = item.qty;
  document.getElementById("harga").value = item.harga;
  document.getElementById("satuan").value = item.satuan;

  // 🔥 penting
  window.selectedProduk = {
    id: item.produk_id,
  };

  editIndex = index;

  openModal();
}

// ================= RESET =================
function resetForm() {
  // reset state
  window.selectedCustomer = null;
  window.cart = [];

  // reset input
  const fields = ["customer", "telp", "alamat", "tanggal", "dp"];

  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // reset select
  const sales = document.getElementById("sales");
  if (sales) sales.selectedIndex = 0;

  const pembayaran = document.getElementById("pembayaran");
  if (pembayaran) pembayaran.value = "cash";

  // reset cart UI
  renderCart();

  // generate invoice baru
  if (typeof setInvoice === "function") {
    setInvoice();
  }
}
function resetItemForm() {
  document.getElementById("produk").value = "";
  document.getElementById("qty").value = 1;
  document.getElementById("harga").value = 0;
  document.getElementById("satuan").value = "Pcs";

  window.selectedProduk = null;
  editIndex = null;
}
// ================= FORMAT =================

// ================= MODAL =================
function openModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;

  modal.classList.add("show");
}

function closeModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;

  modal.classList.remove("show");
}

// ================= EVENTS =================
document.addEventListener("change", function (e) {
  if (e.target.id === "pembayaran") {
    updateSummary();
  }
});
document.addEventListener("input", function (e) {
  if (e.target.id === "dp") {
    updateSummary();
  }
});
window.addEventListener("scroll", function () {
  const nav = document.querySelector(".navbar");
  if (!nav) return;

  if (window.scrollY > 5) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});
function validateForm(data = null) {
  // kalau tidak dikirim, ambil dari form
  if (!data) {
    data = getFormData();
  }

  // ================= VALIDASI CUSTOMER =================
  if (!data.customer || !data.customer.trim()) {
    showToast("Customer wajib diisi", "error");
    return false;
  }

  // ================= VALIDASI TANGGAL =================
  if (!data.tanggal) {
    showToast("Tanggal wajib diisi", "error");
    return false;
  }

  // ================= VALIDASI SALES =================
  if (!data.sales) {
    showToast("Sales wajib dipilih", "error");
    return false;
  }

  // ================= VALIDASI ITEM =================
  if (!data.items || data.items.length === 0) {
    showToast("Item belum ada", "error");
    return false;
  }

  // ================= VALIDASI DP =================
  if (data.pembayaran === "kredit" && data.dp > data.total) {
    showToast("DP tidak boleh lebih dari total", "error");
    return false;
  }

  return true;
}

// =====================================================
// ====================== TOAST =====================
// =====================================================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = message;
  toast.className = "toast show";

  if (type === "error") {
    toast.classList.add("error");
  }

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// =====================================================
// ================== MASTER BASE =====================
// =====================================================

// ================== DATA CUSTOMER =====================
async function loadCustomersMaster() {
  const { data, error } = await supabase.from("customers").select("*");

  if (error) {
    console.error(error);
    return;
  }

  renderCustomerTable(data);
}
function renderCustomerTable(data) {
  const tbody = document.getElementById("table-customer");
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="4">Kosong</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (c) => `
    <tr>
      <td>${c.nama}</td>
      <td>${c.telp}</td>
      <td>${c.alamat}</td>

      <td class="table-action">
        <span onclick="editCustomer('${c.id}')">✎</span>
        <span onclick="deleteCustomer('${c.id}')">🗑</span>
      </td>
    </tr>
  `,
    )
    .join("");
}
async function editCustomer(id) {
  editCustomerId = id;

  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();

  if (error) {
    console.error(error);
    return;
  }

  // isi form
  document.getElementById("cust_nama").value = data.nama || "";
  document.getElementById("cust_telp").value = data.telp || "";
  document.getElementById("cust_alamat").value = data.alamat || "";

  openCustomerModal();
}
async function saveCustomer() {
  const nama = document.getElementById("cust_nama").value.trim();
  const telp = document.getElementById("cust_telp").value.trim();
  const alamat = document.getElementById("cust_alamat").value.trim();

  if (!nama) {
    showToast("Nama wajib diisi", "error");
    return;
  }

  try {
    if (editCustomerId) {
      // UPDATE
      const { error } = await supabase.from("customers").update({ nama, telp, alamat }).eq("id", editCustomerId);

      if (error) throw error;

      showToast("Customer berhasil diupdate");
    } else {
      // INSERT
      const { error } = await supabase.from("customers").insert({ nama, telp, alamat });

      if (error) throw error;

      showToast("Customer berhasil ditambahkan");
    }

    closeCustomerModal();
    loadCustomersMaster();

    editCustomerId = null;
  } catch (err) {
    console.error(err);
    showToast("Gagal simpan", "error");
  }
}
async function deleteCustomer(id) {
  deleteCustomerId = id;

  // cek apakah dipakai
  const { data } = await supabase.from("penjualan").select("id").eq("customer_id", id).limit(1);

  if (data.length > 0) {
    showToast("Customer sudah dipakai, tidak bisa dihapus", "error");
    return;
  }

  document.getElementById("deleteModal").classList.add("show");
}
async function confirmDeleteCustomer() {
  if (!deleteCustomerId) return;

  try {
    const { error } = await supabase.from("customers").delete().eq("id", deleteCustomerId);

    if (error) {
      // 🔥 HANDLE KHUSUS
      if (error.code === "23503") {
        showToast("Customer masih dipakai di transaksi", "error");
        return;
      }

      throw error;
    }

    closeDeleteModal();
    loadCustomersMaster();
    showToast("Berhasil dihapus");
  } catch (err) {
    console.error(err);
    showToast("Gagal hapus", "error");
  }
}

function closeCustomerModal() {
  const nama = document.getElementById("cust-nama");
  const telp = document.getElementById("cust-telp");
  const alamat = document.getElementById("cust-alamat");

  if (nama) nama.value = "";
  if (telp) telp.value = "";
  if (alamat) alamat.value = "";

  document.getElementById("customerModal")?.classList.remove("show");
}

// ================== DATA CUSTOMER =====================
async function loadSupplier() {
  const { data, error } = await supabase.from("suppliers").select("*");

  if (error) {
    console.error(error);
    return;
  }

  renderSupplier(data);
}

// RENDER
function renderSupplier(data) {
  const tbody = document.getElementById("table-supplier");

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Kosong</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
      <td>${s.nama}</td>
      <td>${s.telp}</td>
      <td>${s.alamat}</td>
      <td>
        <span onclick="editSupplier('${s.id}')">✎</span>
        <span onclick="deleteSupplier('${s.id}')">🗑</span>
      </td>
    </tr>
  `,
    )
    .join("");
}

// OPEN MODAL
function openSupplierModal() {
  editSupplierId = null;

  sup_nama.value = "";
  sup_telp.value = "";
  sup_alamat.value = "";

  document.getElementById("supplierModal").classList.add("show");
}

// CLOSE
function closeSupplierModal() {
  document.getElementById("supplierModal").classList.remove("show");
}

// EDIT
async function editSupplier(id) {
  editSupplierId = id;

  const { data } = await supabase.from("suppliers").select("*").eq("id", id).single();

  // 🔥 BUKA MODAL DULU
  document.getElementById("supplierModal").classList.add("show");

  // 🔥 BARU ISI
  document.getElementById("sup_nama").value = data.nama || "";
  document.getElementById("sup_telp").value = data.telp || "";
  document.getElementById("sup_alamat").value = data.alamat || "";
}

// SAVE
async function saveSupplier() {
  const nama = sup_nama.value.trim();
  const telp = sup_telp.value.trim();
  const alamat = sup_alamat.value.trim();

  if (!nama) return showToast("Nama wajib diisi", "error");

  if (editSupplierId) {
    await supabase.from("suppliers").update({ nama, telp, alamat }).eq("id", editSupplierId);
  } else {
    await supabase.from("suppliers").insert({ nama, telp, alamat });
  }

  closeSupplierModal();
  loadSupplier();
  showToast("Berhasil disimpan");
}

// DELETE OPEN
function deleteSupplier(id) {
  deleteSupplierId = id;
  document.getElementById("deleteModal").classList.add("show");
}

// CONFIRM DELETE
async function confirmDeleteSupplier() {
  if (!deleteSupplierId) return;

  const { error } = await supabase.from("suppliers").delete().eq("id", deleteSupplierId);

  if (error) {
    showToast("Gagal hapus", "error");
    return;
  }

  closeDeleteModal();
  loadSupplier();
  showToast("Berhasil dihapus");
}

// ================== DATA SALES =====================
// LOAD
async function loadSalesMaster() {
  const { data, error } = await supabase.from("sales").select("*");

  if (error) {
    console.error(error);
    return;
  }

  renderSales(data);
}

// RENDER
function renderSales(data) {
  const tbody = document.getElementById("table-sales");

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Kosong</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s) => `
    <tr>
      <td>${s.nama}</td>
      <td>${s.telp}</td>
      <td>${s.alamat}</td>
      <td>
        <span onclick="editSales('${s.id}')">✎</span>
        <span onclick="deleteSales('${s.id}')">🗑</span>
      </td>
    </tr>
  `,
    )
    .join("");
}

// OPEN MODAL (TAMBAH)
function openSalesModal() {
  editSalesId = null;

  sales_nama.value = "";
  sales_telp.value = "";
  sales_alamat.value = "";

  document.getElementById("salesModal").classList.add("show");
}

// CLOSE
function closeSalesModal() {
  document.getElementById("salesModal").classList.remove("show");
}

// EDIT
async function editSales(id) {
  editSalesId = id;

  const { data } = await supabase.from("sales").select("*").eq("id", id).single();

  // buka dulu
  document.getElementById("salesModal").classList.add("show");

  // isi
  sales_nama.value = data.nama || "";
  sales_telp.value = data.telp || "";
  sales_alamat.value = data.alamat || "";
}

// SAVE
async function saveSales() {
  const nama = sales_nama.value.trim();
  const telp = sales_telp.value.trim();
  const alamat = sales_alamat.value.trim();

  if (!nama) return showToast("Nama wajib diisi", "error");

  if (editSalesId) {
    await supabase.from("sales").update({ nama, telp, alamat }).eq("id", editSalesId);
  } else {
    await supabase.from("sales").insert({ nama, telp, alamat });
  }

  closeSalesModal();
  loadSalesMaster();
  showToast("Berhasil disimpan");
}

// DELETE OPEN
function deleteSales(id) {
  deleteSalesId = id;
  document.getElementById("deleteModal").classList.add("show");
}

// CONFIRM DELETE
async function confirmDeleteSales() {
  if (!deleteSalesId) return;

  const { error } = await supabase.from("sales").delete().eq("id", deleteSalesId);

  if (error) {
    showToast("Gagal hapus", "error");
    return;
  }

  closeDeleteModal();
  loadSalesMaster();
  showToast("Berhasil dihapus");
}
// ================== DATA PRODUK =====================

async function loadProduk() {
  const { data, error } = await supabase.from("produk").select("*");

  if (error) {
    console.error(error);
    return;
  }

  window.produkList = data;
  console.log("PRODUK:", data);
}

function searchProduk(keyword) {
  const dropdown = document.getElementById("produk-dropdown");
  if (!dropdown) return;

  if (!keyword) {
    dropdown.innerHTML = "";
    return;
  }

  const results = (window.produkList || []).filter((p) => (p.nama || "").toLowerCase().includes(keyword.toLowerCase()));

  dropdown.innerHTML = results
    .map(
      (p) => `
    <div class="dropdown-item" onclick="selectProduk('${p.id}')">
      ${p.nama}
    </div>
  `,
    )
    .join("");
}
function selectProduk(id) {
  const p = window.produkList.find((x) => x.id === id);
  if (!p) return;

  document.getElementById("produk").value = p.nama;

  // set satuan
  const elSatuan = document.getElementById("satuan");
  const match = [...elSatuan.options].find((opt) => opt.value.toLowerCase() === (p.satuan || "").toLowerCase());
  if (match) elSatuan.value = match.value;

  window.selectedProduk = p;

  document.getElementById("produk-dropdown").innerHTML = "";

  // 🔥 pindah ke qty
  document.getElementById("qty").focus();
  document.getElementById("qty").select();
}
// LOAD
async function loadProdukMaster() {
  const { data, error } = await supabase.from("produk").select("*");

  if (error) {
    console.error(error);
    return;
  }

  renderProduk(data);
}

// RENDER
function renderProduk(data) {
  const tbody = document.getElementById("table-produk");

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Kosong</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (p) => `
    <tr>
      <td>${p.kode}</td>
      <td>${p.nama}</td>
      <td>${p.satuan}</td>
      <td>${formatRupiah(p.harga_jual)}</td>
      <td>
        <span onclick="editProduk('${p.id}')">✎</span>
        <span onclick="deleteProduk('${p.id}')">🗑</span>
      </td>
    </tr>
  `,
    )
    .join("");
}

// OPEN MODAL (TAMBAH)
function openProdukModal() {
  editProdukId = null;

  prd_kode.value = "";
  prd_nama.value = "";
  prd_satuan.value = "";
  prd_harga.value = 0;

  document.getElementById("produkModal").classList.add("show");
}

// CLOSE
function closeProdukModal() {
  document.getElementById("produkModal").classList.remove("show");
}

// EDIT
async function editProduk(id) {
  editProdukId = id;

  const { data } = await supabase.from("produk").select("*").eq("id", id).single();

  document.getElementById("produkModal").classList.add("show");

  prd_kode.value = data.kode || "";
  prd_nama.value = data.nama || "";
  prd_satuan.value = data.satuan || "";
  prd_harga.value = data.harga_jual || 0;
}

// SAVE
async function saveProduk() {
  const kode = prd_kode.value.trim();
  const nama = prd_nama.value.trim();
  const satuan = prd_satuan.value.trim();
  const harga_jual = parseFloat(prd_harga.value || 0);

  if (!kode || !nama) {
    showToast("Kode & Nama wajib", "error");
    return;
  }

  try {
    if (editProdukId) {
      await supabase.from("produk").update({ kode, nama, satuan, harga_jual }).eq("id", editProdukId);
    } else {
      await supabase.from("produk").insert({ kode, nama, satuan, harga_jual });
    }

    closeProdukModal();
    loadProdukMaster();
    showToast("Berhasil disimpan");
  } catch (err) {
    console.error(err);
    showToast("Gagal simpan", "error");
  }
}

// DELETE
function deleteProduk(id) {
  deleteProdukId = id;
  document.getElementById("deleteModal").classList.add("show");
}

// CONFIRM DELETE
async function confirmDeleteProduk() {
  if (!deleteProdukId) return;

  const { error } = await supabase.from("produk").delete().eq("id", deleteProdukId);

  if (error) {
    showToast("Gagal hapus", "error");
    return;
  }

  closeDeleteModal();
  loadProdukMaster();
  showToast("Berhasil dihapus");
}

//================== LAPORAN PERSEDIAAN =====================//
async function loadLaporanPersediaan() {
  const { data, error } = await supabase.from("v_kartu_produk").select("*").order("nama");

  if (error) {
    console.error(error);
    return;
  }

  renderLaporanPersediaan(data);
}

function renderLaporanPersediaan(data) {
  const tbody = document.getElementById("laporan-persediaan-body");

  if (!tbody) return;

  let html = "";
  let totalNilai = 0;

  data.forEach((item, i) => {
    totalNilai += Number(item.nilai_hpp || 0);

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.nama}</td>
        <td>${item.kategori || "-"}</td>
        <td>${formatNumber(item.stok)}</td>
        <td>Rp ${formatNumber(item.hpp)}</td>
        <td>Rp ${formatNumber(item.nilai_hpp)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  document.getElementById("total-persediaan").innerText = "Rp " + formatNumber(totalNilai);
}

function renderLaporanPersediaan(data) {
  const tbody = document.getElementById("laporan-persediaan-body");

  if (!tbody) return;

  let html = "";
  let totalNilai = 0;

  data.forEach((item, i) => {
    totalNilai += Number(item.nilai_hpp || 0);

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.nama}</td>
        <td>${item.kategori || "-"}</td>
        <td>${formatNumber(item.stok)}</td>
        <td>Rp ${formatNumber(item.hpp)}</td>
        <td>Rp ${formatNumber(item.nilai_hpp)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  document.getElementById("total-persediaan").innerText = "Rp " + formatNumber(totalNilai);
}

//================== ANALISIS MARGIN =====================//

async function loadAnalisaMargin() {
  const { data, error } = await supabase.from("penjualan_detail").select(`
      qty,
      harga,
      hpp,
      produk_id,
      produk:produk_id(nama, kategori)
    `);

  if (error) {
    console.error(error);
    return;
  }

  renderAnalisaMargin(data);
}
function renderAnalisaMargin(data) {
  const tbody = document.getElementById("analisa-margin-body");

  let map = {};
  let totalJual = 0;
  let totalHpp = 0;

  data.forEach((item) => {
    const nama = item.produk?.nama || "-";
    const kategori = item.produk?.kategori || "-";

    const nilaiJual = item.qty * item.harga;
    const nilaiHpp = item.qty * item.hpp;
    const margin = nilaiJual - nilaiHpp;

    totalJual += nilaiJual;
    totalHpp += nilaiHpp;

    if (!map[nama]) {
      map[nama] = {
        nama,
        kategori,
        qty: 0,
        jual: 0,
        hpp: 0,
        margin: 0,
      };
    }

    map[nama].qty += item.qty;
    map[nama].jual += nilaiJual;
    map[nama].hpp += nilaiHpp;
    map[nama].margin += margin;
  });

  let html = "";
  let i = 1;

  Object.values(map).forEach((p) => {
    html += `
      <tr>
        <td>${i++}</td>
        <td>${p.nama}</td>
        <td>${p.kategori}</td>
        <td>${formatNumber(p.qty)}</td>
        <td>Rp ${formatNumber(p.jual)}</td>
        <td>Rp ${formatNumber(p.hpp)}</td>
        <td>Rp ${formatNumber(p.margin)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  document.getElementById("total-jual").innerText = "Rp " + formatNumber(totalJual);

  document.getElementById("total-hpp").innerText = "Rp " + formatNumber(totalHpp);

  document.getElementById("total-margin").innerText = "Rp " + formatNumber(totalJual - totalHpp);
}

//================== ANALISIS STOK =====================//

async function loadAnalisaStok() {
  const { data, error } = await supabase.from("arus_stok").select(`
      produk_id,
      masuk,
      keluar,
      produk:produk_id(nama, kategori)
    `);

  if (error) {
    console.error(error);
    return;
  }

  renderAnalisaStok(data);
}
function renderAnalisaStok(data) {
  const tbody = document.getElementById("analisa-stok-body");

  let map = {};

  data.forEach((item) => {
    const nama = item.produk?.nama || "-";
    const kategori = item.produk?.kategori || "-";

    if (!map[nama]) {
      map[nama] = {
        nama,
        kategori,
        masuk: 0,
        keluar: 0,
      };
    }

    map[nama].masuk += Number(item.masuk || 0);
    map[nama].keluar += Number(item.keluar || 0);
  });

  let html = "";
  let i = 1;

  Object.values(map).forEach((p) => {
    const stok = p.masuk - p.keluar;

    // 🔥 indikator
    let status = "Normal";
    if (p.keluar === 0 && stok > 0) status = "Slow Moving";
    if (p.keluar > p.masuk * 0.7) status = "Fast Moving";

    html += `
      <tr>
        <td>${i++}</td>
        <td>${p.nama}</td>
        <td>${p.kategori}</td>
        <td>${formatNumber(p.masuk)}</td>
        <td>${formatNumber(p.keluar)}</td>
        <td>${formatNumber(stok)}</td>
        <td>${status}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

//================== PRINT PDF =====================//
function generateInvoiceHTML(data, items, invoice) {
  return `
    <div style="padding:20px;font-family:sans-serif">
      <h2>INVOICE</h2>
      <p>No: ${invoice}</p>
      <p>Tanggal: ${data.tanggal}</p>

      <hr/>

      <p><strong>Customer:</strong> ${data.customer}</p>

      <table border="1" width="100%" cellspacing="0" cellpadding="5">
        <thead>
          <tr>
            <th>Produk</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (i) => `
            <tr>
              <td>${i.nama}</td>
              <td>${i.qty}</td>
              <td>Rp ${formatNumber(i.harga)}</td>
              <td>Rp ${formatNumber(i.qty * i.harga)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <h3>Total: Rp ${formatNumber(data.total)}</h3>
    </div>
  `;
}

function kirimWA(invoice, total) {
  const text = `Invoice ${invoice}\nTotal: Rp ${formatNumber(total)}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}
function openInvoice(id) {
  localStorage.setItem("invoice_id", id);
  route("invoice");
}
async function loadInvoice() {
  const id = localStorage.getItem("invoice_id");

  console.log("INVOICE ID:", id);

  // ================= HEADER =================
  const { data: header, error: err1 } = await supabase
    .from("penjualan")
    .select(
      `
      id,
      invoice,
      tanggal,
      total,
      customers (
        nama,
        alamat
      )
    `,
    )
    .eq("id", id)
    .single();

  if (err1) {
    console.error("ERROR HEADER:", err1);
    return;
  }

  // ================= DETAIL =================
  const { data: detail, error: err2 } = await supabase
    .from("penjualan_detail")
    .select(
      `
      qty,
      harga,
      produk:produk_id (
        nama
      )
    `,
    )
    .eq("penjualan_id", id);

  if (err2) {
    console.error("ERROR DETAIL:", err2);
    return;
  }

  console.log("HEADER:", header);
  console.log("DETAIL:", detail);

  // ================= RENDER =================
  renderInvoice({
    ...header,
    penjualan_detail: detail,
  });
}

function renderInvoice(data) {
  // ================= HEADER =================
  document.getElementById("inv-no").innerText = data.invoice;
  document.getElementById("inv-date").innerText = formatTanggal(data.tanggal);
  document.getElementById("inv-date2").innerText = formatTanggal(data.tanggal);

  // ================= CUSTOMER =================
  document.getElementById("inv-customer").innerText = data.customers?.nama || "-";

  // 🔥 FIX 3: SHIP TO (ALAMAT)
  document.getElementById("inv-alamat").innerHTML = `
    ${data.customers?.nama || "-"}<br/>
    ${data.customers?.alamat || "-"}
  `;

  // ================= DETAIL =================
  let subtotal = 0;
  const detail = data.penjualan_detail || [];

  document.getElementById("inv-body").innerHTML = detail
    .map((d, i) => {
      const total = Number(d.qty) * Number(d.harga);
      subtotal += total;

      return `
        <tr>
          <td>${i + 1}</td>
          <td>${d.produk?.nama || "-"}</td>
          <td style="text-align:right">${formatRupiah(d.harga)}</td>
          <td style="text-align:center">${d.qty}</td>
          <td style="text-align:right">${formatRupiah(total)}</td>
        </tr>
      `;
    })
    .join("");

  // ================= TOTAL =================
  const totalFix = subtotal || data.total || 0;

  document.getElementById("inv-sub").innerText = formatRupiah(totalFix);
  document.getElementById("inv-total").innerText = formatRupiah(totalFix);
  document.getElementById("inv-total2").innerText = formatRupiah(totalFix);
}

//================== HUTANG =====================//
async function loadHutang() {
  const table = document.getElementById("hutang-table");
  if (!table) return;

  table.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  const { data, error } = await supabase.from("v_hutang").select("*").order("id", { ascending: false });

  if (error) {
    console.error(error);
    table.innerHTML = `<tr><td colspan="7">Gagal load data</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    table.innerHTML = `<tr><td colspan="7">Tidak ada data</td></tr>`;
    return;
  }

  table.innerHTML = data
    .map((h, i) => {
      const total = Number(h.total || 0);
      const dibayar = Number(h.dibayar || 0);
      const sisa = Number(h.sisa || 0);

      return `
      <tr>
        <td>${i + 1}</td>

        <td>
          <b>${h.no_po || "-"}</b><br>
          <small>${h.supplier || "-"}</small>
        </td>

        <td>${formatRupiah(total)}</td>
        <td>${formatRupiah(dibayar)}</td>
        <td>${formatRupiah(sisa)}</td>

        <td>
          <span style="
            padding:4px 8px;
            border-radius:6px;
            font-size:12px;
            background:${sisa <= 0 ? "#16a34a" : "#dc2626"};
            color:white;
          ">
            ${h.status || "-"}
          </span>
        </td>

        <td>
          ${sisa > 0 ? `<button onclick="bayarHutang('${h.id}', ${sisa}, '${h.no_po}')">Bayar</button>` : "✔"}
        </td>
      </tr>
      `;
    })
    .join("");
}
async function bayarHutang(id, maxSisa, ref_no) {
  try {
    let jumlah = prompt("Masukkan nominal bayar:");
    if (!jumlah) return;

    jumlah = Number(jumlah);

    if (jumlah <= 0) return alert("Nominal tidak valid");
    if (jumlah > maxSisa) return alert("Melebihi sisa hutang");

    let pihak = prompt("Dibayar oleh (Tomo / Aris / Kas):");
    if (!pihak) return;

    // 🔥 fallback kalau ref kosong (antisipasi data lama)
    if (!ref_no) {
      ref_no = "PO-" + Date.now();
    }

    const { error } = await supabase.from("pembayaran").insert({
      tanggal: new Date().toISOString().slice(0, 10),
      ref_type: "PO",
      ref_id: id,
      ref_no: ref_no,
      jumlah,
      tipe: "keluar",
      metode: "transfer",
      pihak,
      keterangan: "Bayar " + ref_no,
    });

    if (error) throw error;

    alert("Pembayaran berhasil");

    closeModalBayar();

    await loadPenjualan();
    await loadPiutang();
    await loadHutang();
    await loadArusKas();
    await loadDashboard();
  } catch (err) {
    console.error("ERROR BAYAR:", err);
    alert("Gagal bayar");
  }
}
function openModalBayar(id, sisa, ref_no) {
  bayarState.id = id;
  bayarState.sisa = sisa;
  bayarState.ref_no = ref_no;

  document.getElementById("bayar-jumlah").value = sisa;
  document.getElementById("bayar-pihak").value = "";

  document.getElementById("modal-bayar").style.display = "block";
}
function closeModalBayar() {
  document.getElementById("modal-bayar").style.display = "none";
}
async function submitBayar() {
  try {
    const jumlah = Number(document.getElementById("bayar-jumlah").value);
    const pihak = document.getElementById("bayar-pihak").value;

    if (!jumlah || jumlah <= 0) {
      return alert("Nominal tidak valid");
    }

    if (jumlah > bayarState.sisa) {
      return alert("Tidak boleh melebihi sisa hutang");
    }

    if (!pihak) {
      return alert("Pilih yang membayar");
    }

    const { error } = await supabase.from("pembayaran").insert({
      tanggal: new Date().toISOString().slice(0, 10),
      ref_type: "PO",
      ref_id: bayarState.id,
      ref_no: bayarState.ref_no,
      jumlah: jumlah,
      tipe: "keluar",
      metode: "transfer",
      pihak: pihak,
      keterangan: "Bayar hutang",
    });

    if (error) throw error;

    alert("Pembayaran berhasil");

    closeModalBayar(); // tutup dulu

    await loadPenjualan();
    await loadPiutang();
    await loadHutang(); // pindahkan ke sini
    await loadArusKas();
    await loadDashboard();
  } catch (err) {
    console.error(err);
    alert("Gagal bayar");
  }
}
//================== PIUTANG =====================//
async function loadPiutang() {
  const table = document.getElementById("piutang-table");
  if (!table) return;

  table.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  const { data, error } = await supabase.from("v_piutang").select("*").order("id", { ascending: false });

  if (error) {
    console.error(error);
    table.innerHTML = `<tr><td colspan="7">Gagal load data</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    table.innerHTML = `<tr><td colspan="7">Tidak ada data</td></tr>`;
    return;
  }

  table.innerHTML = data
    .map((p, i) => {
      const total = Number(p.total || 0);
      const dibayar = Number(p.dibayar || 0);
      const sisa = Number(p.sisa || 0);

      return `
      <tr>
        <td>${i + 1}</td>

        <td>
          <b>${p.invoice || "-"}</b><br>
          <small>${p.customer || "-"}</small>
        </td>

        <td>${formatRupiah(total)}</td>
        <td>${formatRupiah(dibayar)}</td>
        <td>${formatRupiah(sisa)}</td>

        <td>
          <span style="
            padding:4px 8px;
            border-radius:6px;
            font-size:12px;
            background:${sisa <= 0 ? "#16a34a" : "#dc2626"};
            color:white;
          ">
            ${p.status || "-"}
          </span>
        </td>

        <td>
          ${sisa > 0 ? `<button onclick="bayarPiutang('${p.id}', ${sisa}, '${p.invoice}')">Bayar</button>` : "✔"}
        </td>
      </tr>
      `;
    })
    .join("");
}
async function bayarPiutang(id, maxSisa, invoice) {
  try {
    let jumlah = prompt("Masukkan nominal pembayaran:");
    if (!jumlah) return;

    jumlah = Number(jumlah);

    if (jumlah <= 0) return alert("Nominal tidak valid");
    if (jumlah > maxSisa) return alert("Melebihi sisa");

    let metode = prompt("Metode (cash / transfer):", "transfer") || "transfer";

    const { error } = await supabase.from("pembayaran").insert({
      tanggal: new Date().toISOString().slice(0, 10),
      ref_type: "INV",
      ref_id: id,
      ref_no: invoice, // ✅ sudah benar
      jumlah,
      tipe: "masuk",
      metode,
      keterangan: "Bayar " + invoice, // 🔥 FIX (biar jelas)
    });

    if (error) throw error;

    alert("Pembayaran diterima");

    await loadPenjualan();
    await loadPiutang();
    await loadArusKas();
    await loadDashboard();
  } catch (err) {
    console.error("BAYAR ERROR:", err);
    alert("Gagal input pembayaran");
  }
}
//==================== PEMBAYARAN ====================//
async function loadArusPembayaran() {
  const { data, error } = await supabase.from("v_arus_kas_saldo").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("arus-table").innerHTML = (data || [])
    .map(
      (r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${formatDate(r.tanggal)}</td>
        <td>${r.ref_no || "-"}</td>
        <td>${r.relasi || "-"}</td>
        <td style="color:green">${formatRupiah(r.masuk)}</td>
        <td style="color:red">${formatRupiah(r.keluar)}</td>
        <td><b>${formatRupiah(r.saldo)}</b></td> <!-- 🔥 dari DB -->
        <td>${r.metode || "-"}</td>
      </tr>
    `,
    )
    .join("");
}
async function submitBayar() {
  const jumlah = Number(document.getElementById("input-jumlah").value);

  if (!jumlah || jumlah <= 0) {
    alert("Nominal tidak valid");
    return;
  }

  const { error } = await supabase.from("pembayaran").insert({
    ref_id: currentRefId,
    ref_type: currentType,
    tipe: currentType === "INV" ? "masuk" : "keluar",
    jumlah: jumlah,
    metode: "transfer",
    tanggal: new Date(),
  });

  if (error) {
    console.error(error);
    alert("Gagal simpan");
    return;
  }

  closeModal();

  // reload data
  loadHutang();
  loadPiutang();
  loadArusPembayaran();
}
function openModalBayar(id, type, label) {
  currentRefId = id;
  currentType = type;

  document.getElementById("input-jumlah").value = "";
  document.getElementById("modal-bayar").style.display = "flex";

  console.log("Bayar:", label);
}
function closeModalBayar() {
  document.getElementById("modal-bayar").style.display = "none";
}

//======HELPER======//
function getVal(id) {
  return document.getElementById(id)?.value;
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}
function nowISODate() {
  return new Date().toISOString();
}
function formatRupiah(angka) {
  return (
    "Rp " +
    new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(angka || 0)
  );
}
function formatTanggal(date) {
  if (!date) return "-";

  const d = new Date(date);

  const hari = String(d.getDate()).padStart(2, "0");
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const tahun = d.getFullYear();

  return `${hari}/${bulan}/${tahun}`;
}
//======ARUS KAS======//

async function loadArusKas() {
  if (!isPageActive("arus-kas-body")) return; // 🔥 lebih clean

  try {
    const { data, error } = await supabase.from("v_arus_kas_saldo").select("*").order("tanggal", { ascending: true });

    if (error) throw error;

    const tbody = document.getElementById("arus-kas-body");

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">Tidak ada data</td></tr>`;
      return;
    }

    let html = "";

    data.forEach((row) => {
      html += `
        <tr>
          <td>${formatTanggal(row.tanggal)}</td>
          <td>${row.ref_no || "-"}</td>
          <td>${row.keterangan || "-"}</td>
          <td>${row.metode || "-"}</td>
          <td>${row.masuk ? formatRupiah(row.masuk) : "-"}</td>
          <td>${row.keluar ? formatRupiah(row.keluar) : "-"}</td>
          <td><b>${formatRupiah(row.saldo)}</b></td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  } catch (err) {
    console.error("ERROR ARUS KAS:", err);
  }
}
//====== PENGELUARAN======//
async function savePengeluaran() {
  try {
    const tanggal = document.getElementById("tgl").value;
    const metode = document.getElementById("metode").value;
    const jumlah = Number(document.getElementById("jumlah").value);
    const ket = document.getElementById("ket").value;
    const dibayar = document.getElementById("dibayar").value;

    // ================= VALIDASI =================
    if (!tanggal) return alert("Tanggal wajib diisi");
    if (!jumlah || jumlah <= 0) return alert("Jumlah tidak valid");

    // ================= GENERATE REF =================
    const refNo = "EXP-" + Date.now(); // 🔥 WAJIB (biar tidak "-")

    // ================= LOGIKA =================
    let tipe = "keluar";
    let pihak = null;

    if (dibayar === "talangan") {
      tipe = "pending"; // jadi hutang karyawan
      pihak = null;
    } else {
      tipe = "keluar"; // langsung kas keluar
      pihak = dibayar; // Tomo / Aris / Kas
    }

    // ================= INSERT =================
    const { error } = await supabase.from("pembayaran").insert({
      tanggal,
      ref_type: "EXP",
      ref_id: null,
      ref_no: refNo, // 🔥 FIX UTAMA
      jumlah,
      tipe,
      metode,
      pihak,
      keterangan: ket || "Pengeluaran",
    });

    if (error) throw error;

    alert("Pengeluaran berhasil");

    // ================= RESET =================
    document.getElementById("jumlah").value = "";
    document.getElementById("ket").value = "";

    // ================= RELOAD =================
    await loadPengeluaran();
    await loadArusKas();
    await loadDashboard();

    // ================= REDIRECT =================
    route("pengeluaran");
  } catch (err) {
    console.error("ERROR PENGELUARAN:", err);
    alert("Gagal simpan pengeluaran");
  }
}
async function loadPengeluaran() {
  try {
    const tbody = document.getElementById("pengeluaran-body");

    // 🔥 guard DOM
    if (!tbody) return;

    // loading state
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Loading...</td></tr>`;

    // query
    const { data, error } = await supabase.from("pembayaran").select("*").eq("ref_type", "EXP").order("tanggal", { ascending: false }).order("created_at", { ascending: false });

    if (error) throw error;

    // empty state
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>`;
      return;
    }

    // formatter (lebih aman)
    const fmtDate = (d) => (typeof formatTanggal === "function" ? formatTanggal(d) : d);
    const fmtRp = (n) => (typeof formatRupiah === "function" ? formatRupiah(n) : n);

    // render
    tbody.innerHTML = data
      .map((row, i) => {
        const dibayar = row.tipe === "pending" ? "Talangan" : row.pihak || "Kas";

        return `
          <tr>
            <td>${i + 1}</td>
            <td>${fmtDate(row.tanggal)}</td>
            <td>${dibayar}</td>
            <td>${row.keterangan || "-"}</td>
            <td>${row.metode || "-"}</td>
            <td class="text-right">${fmtRp(row.jumlah || 0)}</td>
            <td class="text-center">
              <button class="btn-danger btn-xs" onclick="hapusPengeluaran('${row.id}')">
                Hapus
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    console.error("ERROR LOAD PENGELUARAN:", err);

    const tbody = document.getElementById("pengeluaran-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">
            Gagal load data
          </td>
        </tr>
      `;
    }
  }
}

async function hapusPengeluaran(id) {
  const ok = confirm("Hapus data ini?");
  if (!ok) return;

  try {
    const { error } = await supabase.from("pembayaran").delete().eq("id", id);

    if (error) throw error;

    loadPengeluaran();
  } catch (err) {
    console.error(err);
    alert("Gagal hapus");
  }
}
async function loadTalangan() {
  try {
    const tbody = document.getElementById("talangan-body");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Loading...</td></tr>`;

    const { data, error } = await supabase
      .from("pembayaran")
      .select("*")
      .eq("tipe", "pending") // 🔥 ini kunci
      .order("tanggal", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>`;
      return;
    }

    tbody.innerHTML = data
      .map((row, i) => {
        return `
          <tr>
            <td>${i + 1}</td>
            <td>${formatTanggal(row.tanggal)}</td>
            <td>${row.pihak || "-"}</td>
            <td>${row.keterangan || "-"}</td>
            <td>${row.metode || "-"}</td>
            <td>${formatRupiah(row.jumlah || 0)}</td>
            <td>
              <button onclick="bayarTalangan('${row.id}', ${row.jumlah})">
                Bayar
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    console.error("ERROR TALANGAN:", err);

    const tbody = document.getElementById("talangan-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7">Gagal load data</td></tr>`;
    }
  }
}
async function bayarTalangan(parentId, jumlah, pihak) {
  try {
    const ok = confirm(`Bayar hutang ${pihak || ""} sebesar ${formatRupiah(jumlah)}?`);
    if (!ok) return;

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("pembayaran").insert({
      tanggal: today,
      ref_type: "TALANGAN",
      ref_id: parentId,
      ref_no: null,
      jumlah: jumlah,
      tipe: "keluar",
      metode: "transfer", // bisa kamu ganti dari UI nanti
      keterangan: "Bayar hutang karyawan",
      ref_parent: parentId,
      pihak: pihak || null,
    });

    if (error) throw error;

    alert("Berhasil dibayar");
    loadTalangan();
  } catch (err) {
    console.error("ERROR BAYAR:", err);
    alert("Gagal bayar");
  }
}

async function loadKas() {
  try {
    const { data, error } = await supabase.from("v_arus_kas_saldo").select("*");

    if (error) throw error;

    if (!data || data.length === 0) return;

    const totalMasuk = data.reduce((a, b) => a + (b.masuk || 0), 0);
    const totalKeluar = data.reduce((a, b) => a + (b.keluar || 0), 0);
    const saldo = data[data.length - 1].saldo || 0;

    document.getElementById("saldo-kas").innerText = formatRupiah(saldo);
    document.getElementById("total-masuk").innerText = formatRupiah(totalMasuk);
    document.getElementById("total-keluar").innerText = formatRupiah(totalKeluar);
  } catch (err) {
    console.error("LOAD KAS ERROR:", err);
  }
}
function isPageActive(pageId) {
  return document.getElementById(pageId) !== null;
}

//====== SISTEM LOGIN ========//
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}
function toggleDropdown() {
  const menu = document.getElementById("dropdown-menu");
  menu.classList.toggle("show");
}

// klik di luar → auto close
window.addEventListener("click", function (e) {
  const wrapper = document.querySelector(".avatar-wrapper");
  if (!wrapper.contains(e.target)) {
    document.getElementById("dropdown-menu").classList.remove("show");
  }
});

function handleProfile() {
  alert("Menu Profile (belum dibuat)");
}
//====== LOG AKTIFITAS ========//
async function logActivity({ aksi, modul, ref_no, keterangan }) {
  try {
    const user = getCurrentUser();

    await supabase.from("activity_logs").insert({
      user_name: user?.username || "unknown",
      aksi,
      modul,
      ref_no,
      keterangan,
    });
  } catch (err) {
    console.error("LOG ERROR:", err);
  }
}

function showNotif(message) {
  let container = document.getElementById("notif-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "notif-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  const notif = document.createElement("div");
  notif.innerText = message;

  notif.style.background = "#111";
  notif.style.color = "#fff";
  notif.style.padding = "10px 14px";
  notif.style.marginBottom = "10px";
  notif.style.borderRadius = "8px";
  notif.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
  notif.style.fontSize = "13px";

  container.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 3000);
}

function checkLogin() {
  const user = localStorage.getItem("user");

  const isLoginPage = window.location.pathname.includes("login.html");

  if (!user && !isLoginPage) {
    window.location.href = "login.html";
  }
}
function renderUser() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const el = document.getElementById("nav-user");
  if (!el) return;

  el.innerText = user?.username || "Guest";
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}
// ================= LOGIN =================
window.login = async function (e) {
  e.preventDefault();

  const username = document.getElementById("username")?.value;
  const password = document.getElementById("password")?.value;

  if (!username || !password) {
    alert("Isi username & password");
    return;
  }

  const { data, error } = await supabase.from("users").select("*").eq("username", username).eq("password", password).single();

  if (error || !data) {
    alert("Login gagal");
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));

  window.location.href = "index.html";
};

// ================= GLOBAL =================

let DATA_ADJUSTMENT = []

// ================= LOAD DATA =================

async function loadAdjustment() {

  const tbody = document.getElementById(
    "table-adjustment-body"
  )

  if (!tbody) return

  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center">
        Memuat...
      </td>
    </tr>
  `

  const { data, error } = await supabase
    .from("v_stok_adjustment")
    .select("*")
    .order("tanggal", { ascending:false })

  if(error){

    console.error(error)

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          Gagal load data
        </td>
      </tr>
    `

    return
  }

  DATA_ADJUSTMENT = data || []

  renderAdjustment()

}

// ================= RENDER =================

function renderAdjustment() {

  const tbody = document.getElementById(
    "table-adjustment-body"
  )

  if (!tbody) return

  if(DATA_ADJUSTMENT.length === 0){

    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          Belum ada data
        </td>
      </tr>
    `

    return
  }

  tbody.innerHTML = DATA_ADJUSTMENT.map(item => `

    <tr>

      <td>
        ${formatTanggal(item.tanggal)}
      </td>

      <td>
        ${item.no_ref}
      </td>

      <td>
        ${item.nama_produk}
      </td>

      <td>
        <span class="badge ${
          item.tipe === "MASUK"
          ? "success"
          : "danger"
        }">
          ${item.tipe}
        </span>
      </td>

      <td>
        ${item.qty}
      </td>

      <td>
        ${item.keterangan || "-"}
      </td>

    </tr>

  `).join("")

}

// ================= LOAD PRODUK =================

async function loadProdukAdjustment() {

  const { data, error } = await supabase
    .from("produk")
    .select("id,kode,nama")
    .order("nama")

  if(error){
    console.error(error)
    return
  }

  const el = document.getElementById(
    "adj-produk"
  )

  if (!el) return

  el.innerHTML = `
    <option value="">
      Pilih Produk
    </option>
  `

  data.forEach(item => {

    el.innerHTML += `
      <option value="${item.id}">
        ${item.kode} - ${item.nama}
      </option>
    `

  })

}

// ================= MODAL =================

function openModalAdjustment(){

  document
    .getElementById("modal-adjustment")
    ?.classList.add("show")

}

function closeModalAdjustment(){

  document
    .getElementById("modal-adjustment")
    ?.classList.remove("show")

}

// ================= SAVE =================

async function simpanAdjustment(){

  const produk_id =
    document.getElementById("adj-produk").value

  const tipe =
    document.getElementById("adj-tipe").value

  const qty = Number(
    document.getElementById("adj-qty").value
  )

  const harga = Number(
    document.getElementById("adj-harga").value
  )

  const keterangan =
    document.getElementById("adj-keterangan").value

  if(!produk_id){
    return alert("Produk wajib dipilih")
  }

  if(!qty || qty <= 0){
    return alert("Qty tidak valid")
  }

  const no_ref = "ADJ-" + Date.now()

  const { error } = await supabase
    .from("stok_adjustment")
    .insert([{
      no_ref,
      produk_id,
      tipe,
      qty,
      harga,
      keterangan
    }])

  if(error){

    console.error(error)

    return alert(error.message)

  }

  closeModalAdjustment()

  document.getElementById("adj-qty").value = ""
  document.getElementById("adj-harga").value = 0
  document.getElementById("adj-keterangan").value = ""

  await loadAdjustment()

  if(typeof showToast === "function"){
    showToast("Penyesuaian berhasil disimpan")
  } else {
    alert("Penyesuaian berhasil disimpan")
  }

}

// ================= INIT =================

loadAdjustment()
loadProdukAdjustment()
