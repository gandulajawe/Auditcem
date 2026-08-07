// File: src/components/DomainAnalyticsSection.tsx
"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileWarning, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { AuditReportItem } from "./AuditReportBuilder";
import { ALL_DOMAINS, getDomainConfig, renderDomainIcon, normalizeDomainName } from "./DomainBadge";
import { ParetoAnalysis } from "./ParetoAnalysis";

interface DomainAnalyticsSectionProps {
  reports: AuditReportItem[];
  defaultOpenDomain?: string;
}

/**
 * Merender satu blok per domain audit (MQAA, 6S, Visual Management, HSE, PS).
 * Setiap blok terisolasi: hanya memuat laporan milik domain tersebut,
 * sehingga resume/analisis satu domain tidak tercampur domain lain.
 */
export function DomainAnalyticsSection({ reports, defaultOpenDomain }: DomainAnalyticsSectionProps) {
  const [openDomain, setOpenDomain] = useState<string | null>(defaultOpenDomain ?? ALL_DOMAINS[0]);

  return (
    <div className="space-y-3">
      {ALL_DOMAINS.map((domain) => {
        const domainReports = reports.filter((r) => normalizeDomainName(r.domain) === domain);
        const config = getDomainConfig(domain);
        const isOpen = openDomain === domain;

        const openCount = domainReports.filter((r) => r.status === "Open").length;
        const inProgressCount = domainReports.filter((r) => r.status === "In Progress").length;
        const resolvedCount = domainReports.filter((r) => r.status === "Resolved").length;

        return (
          <div
            key={domain}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
          >
            <button
              type="button"
              onClick={() => setOpenDomain(isOpen ? null : domain)}
              className={`w-full flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 cursor-pointer transition-colors ${config.bg}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${config.accent}22` }}
                >
                  {renderDomainIcon(domain, `w-4.5 h-4.5 ${config.text}`)}
                </div>
                <div className="text-left">
                  <h3 className={`text-sm font-extrabold ${config.text}`}>{config.label}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {domainReports.length} laporan audit tercatat
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3 h-3" /> {openCount} Open
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" /> {inProgressCount} Progress
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3" /> {resolvedCount} Selesai
                </span>
                {isOpen ? (
                  <ChevronUp className={`w-5 h-5 ${config.text}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${config.text}`} />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/40 space-y-4 animate-fadeIn">
                {domainReports.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-1">
                    <FileWarning className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">
                      Belum ada laporan audit untuk domain {domain}.
                    </p>
                  </div>
                ) : (
                  <ParetoAnalysis reports={domainReports} accentColor={config.accent} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
