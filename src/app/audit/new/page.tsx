// File: src/app/audit/new/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { DynamicAuditForm } from "@/components/DynamicAuditForm";

export default function NewAuditPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 p-4 md:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Homepage App Grid</span>
          </Link>

          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Multi-Finding Input Form
          </span>
        </div>

        <DynamicAuditForm />
      </div>
    </div>
  );
}
