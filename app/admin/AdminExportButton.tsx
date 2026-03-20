"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { exportAllData } from "@/app/actions";
import { toast } from "sonner";

export default function AdminExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // 1. Users Sheet
      const usersWs = XLSX.utils.json_to_sheet(data.users);
      XLSX.utils.book_append_sheet(wb, usersWs, "Users");
      
      // 2. Word Repository Sheet
      const wordsWs = XLSX.utils.json_to_sheet(data.words);
      XLSX.utils.book_append_sheet(wb, wordsWs, "Word Repository");
      
      // 3. Tactical Suffixes Sheet
      const tacticalWs = XLSX.utils.json_to_sheet(data.tacticalSuffixes);
      XLSX.utils.book_append_sheet(wb, tacticalWs, "Tactical Suffixes");
      
      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `sambung_kata_export_${date}.xlsx`;
      
      // Trigger download
      XLSX.writeFile(wb, filename);
      
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-[11px] font-black text-white hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest"
    >
      {isExporting ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Download className="w-3 h-3" />
      )}
      {isExporting ? "Exporting..." : "Export Data"}
    </button>
  );
}
