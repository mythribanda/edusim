"use client";

import React from "react";

export interface ClassCardProps {
  id: string;
  name: string;
  gradeLevel?: string;
  studentCount: number;
  averageMastery: number; // 0 - 100
  weakestTopic?: string | null;
  activeThisWeek?: number;
  subjects?: string[];
  joinCode?: string;
  onClick?: () => void;
}

/**
 * Returns color classes according to mastery band:
 * - Green (> 70)
 * - Yellow / Amber (40 - 70)
 * - Red (< 40)
 */
export function getMasteryBand(score: number) {
  const clamped = Math.min(100, Math.max(0, Math.round(score * 10) / 10));
  if (clamped > 70) {
    return {
      barColor: "bg-emerald-500",
      textColor: "text-emerald-700",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      status: "Mastered",
    };
  }
  if (clamped >= 40) {
    return {
      barColor: "bg-amber-500",
      textColor: "text-amber-700",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      status: "Developing",
    };
  }
  return {
    barColor: "bg-rose-500",
    textColor: "text-rose-700",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    status: "Needs Support",
  };
}

export default function ClassCard({
  id,
  name,
  gradeLevel,
  studentCount,
  averageMastery,
  weakestTopic,
  activeThisWeek,
  subjects,
  joinCode,
  onClick,
}: ClassCardProps) {
  const mastery = typeof averageMastery === "number" ? averageMastery : 0;
  const band = getMasteryBand(mastery);
  const clampedPercentage = Math.min(100, Math.max(0, mastery));

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {name}
              </h3>
              {gradeLevel && (
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  Grade {gradeLevel}
                </span>
              )}
            </div>
            {subjects && subjects.length > 0 && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {subjects.join(" • ")}
              </p>
            )}
          </div>

          {joinCode && (
            <span
              title="Class Join Code"
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-600"
            >
              <svg
                className="h-3 w-3 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
              {joinCode}
            </span>
          )}
        </div>

        {/* Student Count & Active Badge */}
        <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <span className="font-semibold text-slate-800">{studentCount}</span>{" "}
            {studentCount === 1 ? "student" : "students"}
          </div>

          {typeof activeThisWeek === "number" && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{activeThisWeek} active this week</span>
            </div>
          )}
        </div>

        {/* Progress Bar & Average Mastery */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Average Mastery</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${band.textColor}`}>
                {mastery.toFixed(1)}%
              </span>
              <span
                className={`rounded border px-1.5 py-0.2 text-[10px] font-semibold ${band.badgeBg}`}
              >
                {band.status}
              </span>
            </div>
          </div>

          {/* Colored Progress Bar */}
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${band.barColor}`}
              style={{ width: `${clampedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weakest Topic Footer */}
      {weakestTopic && (
        <div className="mt-5 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg
              className="h-3.5 w-3.5 text-amber-500 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <span className="truncate">
              Focus needed:{" "}
              <strong className="font-medium text-slate-700">
                {weakestTopic}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
