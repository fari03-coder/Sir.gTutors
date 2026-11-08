const SUPABASE_URL = "https://gqsznrvescgewkwmvhod.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OAJ8W1Bp3owL22c8hhGgRQ_n7TRC1o8";

window.supabaseClient = null;

if (
  window.supabase &&
  SUPABASE_URL !== "PASTE_HERE" &&
  SUPABASE_PUBLISHABLE_KEY !== "PASTE_HERE"
) {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}