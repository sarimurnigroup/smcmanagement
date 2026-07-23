// GANTI dua nilai di bawah sesuai project Supabase kamu.
// Cara ambil: buka Supabase Dashboard > Settings > API
//   - Project URL       -> SUPABASE_URL
//   - anon / public key  -> SUPABASE_ANON_KEY
// Dua-duanya AMAN ditaruh di file JS yang bisa dilihat publik (bukan rahasia
// kayak service_role key). Keamanan akses data diatur lewat RLS di database,
// bukan lewat nyembunyiin key ini.

const SUPABASE_URL = 'https://unaxsddepfpswpkkqifk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Fz5mVn5fDUVONakQb0YzzQ_N2flMKF0';

// window.supabase datang dari <script src="...supabase-js..."> yang di-load
// di setiap HTML SEBELUM file ini. Kalau ada error "supabase is not defined",
// cek urutan <script> tag di halaman itu.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
