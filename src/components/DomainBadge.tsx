"use client";

import { ShieldCheck, Sparkles, Eye, HardHat, Cog, Tag } from "lucide-react";

export type DomainType = "MQAA" | "6S" | "Visual Management" | "HSE" | "PS" | string;

interface DomainBadgeProps {
  domain: DomainType;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function getDomainIcon(domain: string) {
  const norm = domain.trim().toLowerCase();
  if (norm.includes("mqaa")) return ShieldCheck;
  if (norm.includes("6s")) return Sparkles;
  if (norm.includes("visual") || norm.includes("vm")) return Eye;
  if (norm.includes("hse") || norm.includes("k3")) return HardHat;
  if (norm.includes("ps") || norm.includes("process")) return Cog;
  return Tag;
}

export function getDomainConfig(domain: string) {
  const norm = domain.trim().toLowerCase();
  if (norm.includes("mqaa")) {
    return {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-300",
      accent: "#6A0DAD",
      label: "MQAA (Quality Assurance)",
    };
  }
  if (norm.includes("6s")) {
    return {
      bg: "bg-pink-100",
      text: "text-pink-800",
      border: "border-pink-300",
      accent: "#F2A7C6",
      label: "6S (Sort-Safety)",
    };
  }
  if (norm.includes("visual") || norm.includes("vm")) {
    return {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      border: "border-indigo-300",
      accent: "#A569BD",
      label: "Visual Management",
    };
  }
  if (norm.includes("hse") || norm.includes("k3")) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      border: "border-emerald-300",
      accent: "#10B981",
      label: "HSE (Safety & Env)",
    };
  }
  if (norm.includes("ps") || norm.includes("process")) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-800",
      border: "border-amber-300",
      accent: "#F59E0B",
      label: "Process Standardization",
    };
  }
  return {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
    accent: "#6B7280",
    label: domain,
  };
}

export function DomainBadge({ domain, showIcon = true, className = "", size = "md" }: DomainBadgeProps) {
  const Icon = getDomainIcon(domain);
  const config = getDomainConfig(domain);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-bold gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{domain}</span>
    </span>
  );
}
