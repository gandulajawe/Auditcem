"use client";

import React from "react";
import { ShieldCheck, Sparkles, Eye, HardHat, Cog, Tag } from "lucide-react";

export type DomainType = "MQAA" | "6S" | "Visual Management" | "HSE" | "PS" | string;

interface DomainBadgeProps {
  domain: DomainType;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function renderDomainIcon(domain: string, className: string) {
  const norm = domain.trim().toLowerCase();
  if (norm.includes("mqaa")) return <ShieldCheck className={className} />;
  if (norm.includes("6s")) return <Sparkles className={className} />;
  if (norm.includes("visual") || norm.includes("vm")) return <Eye className={className} />;
  if (norm.includes("hse") || norm.includes("k3")) return <HardHat className={className} />;
  if (norm.includes("ps") || norm.includes("process")) return <Cog className={className} />;
  return <Tag className={className} />;
}

export function getDomainConfig(domain: string) {
  const norm = domain.trim().toLowerCase();
  if (norm.includes("mqaa")) {
    return {
      bg: "bg-indigo-50 hover:bg-indigo-100/80",
      text: "text-indigo-700",
      border: "border-indigo-200/80",
      accent: "#4F46E5",
      label: "MQAA (Quality Assurance)",
    };
  }
  if (norm.includes("6s")) {
    return {
      bg: "bg-emerald-50 hover:bg-emerald-100/80",
      text: "text-emerald-700",
      border: "border-emerald-200/80",
      accent: "#10B981",
      label: "6S (Sort-Safety)",
    };
  }
  if (norm.includes("visual") || norm.includes("vm")) {
    return {
      bg: "bg-purple-50 hover:bg-purple-100/80",
      text: "text-purple-700",
      border: "border-purple-200/80",
      accent: "#9333EA",
      label: "Visual Management",
    };
  }
  if (norm.includes("hse") || norm.includes("k3")) {
    return {
      bg: "bg-amber-50 hover:bg-amber-100/80",
      text: "text-amber-700",
      border: "border-amber-200/80",
      accent: "#F59E0B",
      label: "HSE (Safety & Env)",
    };
  }
  if (norm.includes("ps") || norm.includes("process")) {
    return {
      bg: "bg-blue-50 hover:bg-blue-100/80",
      text: "text-blue-700",
      border: "border-blue-200/80",
      accent: "#3B82F6",
      label: "Process Standardization",
    };
  }
  return {
    bg: "bg-slate-100 hover:bg-slate-200/80",
    text: "text-slate-700",
    border: "border-slate-200",
    accent: "#64748B",
    label: domain,
  };
}

export function DomainBadge({ domain, showIcon = true, className = "", size = "md" }: DomainBadgeProps) {
  const config = getDomainConfig(domain);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium gap-1 rounded-md",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5 rounded-lg",
    lg: "px-3 py-1.5 text-sm font-bold gap-2 rounded-xl",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all duration-200 shadow-xs hover:shadow-sm ${className}`}
    >
      {showIcon && renderDomainIcon(domain, iconSizes[size])}
      <span>{domain}</span>
    </span>
  );
}

export default DomainBadge;
