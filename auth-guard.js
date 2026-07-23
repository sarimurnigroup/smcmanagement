// auth-guard.js
// Kumpulan fungsi yang dipakai bareng di semua halaman (kecuali index.html
// yang punya logic login sendiri). File ini HARUS di-load setelah
// supabase-client.js di tiap HTML.

// Ambil profil user yang lagi login (nama, role, status PIN).
// TIDAK redirect kalau gak ada sesi -- cuma balikin null.
// Dipakai index.html buat cek "apakah orang ini udah login sebelumnya".
async function getProfile() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabaseClient
    .from('users')
    .select('id, nama, role, pin_is_temp, is_active, assigned_route_id, email, foto_url, no_wa, no_ktp')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return null;

  if (data.is_active === false) {
    // Akun dinonaktifkan Superuser -- paksa keluar, perlakukan sama seperti belum login.
    await supabaseClient.auth.signOut();
    return null;
  }

  return data;
}

// Dipanggil di awal tiap halaman terproteksi (produksi.html, delivery.html,
// admin.html, ganti-pin.html). Redirect otomatis kalau:
//   - belum login sama sekali
//   - PIN masih sementara (kecuali lagi di halaman ganti-pin.html)
//   - role gak termasuk yang diizinkan buat halaman ini
//
// allowedRoles: array of string, misal ['produksi', 'produksi_delivery']
//               isi null kalau halaman ini boleh diakses semua role
//               (dipakai di ganti-pin.html)
async function requireAuth(allowedRoles) {
  const profile = await getProfile();

  if (!profile) {
    window.location.href = 'index.html';
    return null;
  }

  const currentPage = window.location.pathname.split('/').pop();

  if (profile.pin_is_temp && currentPage !== 'ganti-pin.html') {
    window.location.href = 'ganti-pin.html';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Login valid, tapi role ini gak berhak buka halaman ini.
    // Balikin ke index.html biar di-routing ulang ke halaman yang benar.
    window.location.href = 'index.html';
    return null;
  }

  return profile;
}

// Redirect ke halaman yang sesuai berdasarkan role.
// Dipakai index.html (abis login) dan ganti-pin.html (abis ganti PIN).
// produksi_delivery sengaja gak masuk map -- itu diarahkan ke index.html
// biar munculin layar "pilih fungsi" (2 tombol), bukan langsung nyasar
// ke salah satu halaman.
function redirectByRole(role) {
  const tujuan = {
    produksi: 'produksi.html',
    delivery: 'delivery.html',
    admin: 'admin.html',
    superuser: 'admin.html'
  };
  window.location.href = tujuan[role] || 'index.html';
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

// Render header standar (avatar mini + nama + email + role), dipake bareng
// di produksi.html, delivery.html, admin.html, mitra-monitoring.html, dan
// screen-pilih-fungsi di index.html. Aman dipanggil di halaman mana pun --
// elemen yang gak ada di HTML halaman itu bakal di-skip aja (gak error).
function renderUserHeader(profile) {
  const namaEl = document.getElementById('nama-user');
  const roleEl = document.getElementById('role-user');
  const emailEl = document.getElementById('email-user');
  const imgEl = document.getElementById('avatar-mini-img');
  const initialEl = document.getElementById('avatar-mini-initial');

  if (namaEl) namaEl.textContent = profile.nama;
  if (roleEl) roleEl.textContent = profile.role;
  if (emailEl) emailEl.textContent = profile.email;

  if (imgEl && initialEl) {
    if (profile.foto_url) {
      imgEl.src = profile.foto_url;
      imgEl.classList.remove('hidden');
      initialEl.classList.add('hidden');
    } else {
      imgEl.classList.add('hidden');
      initialEl.classList.remove('hidden');
      initialEl.textContent = (profile.nama || '?').trim().charAt(0).toUpperCase();
    }
  }
}
