import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";

/**
 * Auto-save hook: saves nodes + edges to Supabase every 3 seconds
 * when changes are detected. Debounced to avoid hammering the DB.
 * Waits 5 seconds before first save to avoid overwriting with starter data.
 */
export function useAutoSave(projectId, nodes, edges) {
  const lastSaved = useRef(null);
  const timer = useRef(null);
  const ready = useRef(false);

  // Mark as ready after initial load delay
  useEffect(() => {
    ready.current = false;
    const t = setTimeout(() => {
      ready.current = true;
      lastSaved.current = JSON.stringify({ nodes, edges });
    }, 5000); // Wait 5s before allowing saves (lets project data load first)
    return () => clearTimeout(t);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !ready.current) return;

    const current = JSON.stringify({ nodes, edges });
    if (lastSaved.current && current === lastSaved.current) return;

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("projects")
        .update({ nodes, edges, updated_at: new Date().toISOString() })
        .eq("id", projectId);

      if (!error) {
        lastSaved.current = current;
      }
    }, 3000);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [projectId, nodes, edges]);
}
