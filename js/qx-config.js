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
  supabaseUrl: 'https://abophgeersgkjtchtlxw.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFib3BoZ2VlcnNna2p0Y2h0bHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNTMyMjcsImV4cCI6MjEwOTcyOTIyN30.71QxAFyj0q4GSS3rdOQHWodMDgOVLMbfa90npVux9vE',
  demo: false
};
