/* ========================================================================
   QARTEXA V2: CONNECTION SETTINGS  (js/qx-config.js)
   This is the ONLY file you edit to connect the website to its database.
   1. Follow docs/SETUP-GUIDE.md to create a free Supabase project.
   2. Paste the two values below (Project URL and "anon public" key).
   The anon key is designed to be public: the database rules (see
   supabase/schema.sql) decide who can read and change what.
   Never paste the "service_role" key here.
   ======================================================================== */
window.QX_CONFIG = {
  supabaseUrl: '',        // e.g. 'https://abcdxyz.supabase.co'
  supabaseAnonKey: '',    // e.g. 'eyJhbGciOi...'
  demo: false             // true = try everything with sample data saved in your own browser only
};
