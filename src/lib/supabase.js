import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://stinothaqbjhnfrffvti.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aW5vdGhhcWJqaG5mcmZmdnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTg5MjcsImV4cCI6MjA4OTE5NDkyN30.G9OxBm3VjoJloP46LbWgLZeXoeawmT12uzqByQry3og";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
