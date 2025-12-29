import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://delkooaxroutckwvxfbe.supabase.co";
const supabaseAnonKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbGtvb2F4cm91dGNrd3Z4ZmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODcxNzMsImV4cCI6MjA3NjE2MzE3M30.3upU-B8uVds1N3N0dl_EoZgo0SYyq3hxeRwGCDZWpho";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
