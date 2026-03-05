"use client";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { format, subDays } from "date-fns";
import { useProgressStore } from "@/store/useProgressStore";

export default function CalendarHeatmapCard() {
  const { activity } = useProgressStore();
  const end = new Date();
  const start = subDays(end, 365);

  const values = Object.keys(activity).map(k=>({ date: k, count: activity[k] }));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="text-sm text-slate-300 mb-2">Activity</h3>
      <CalendarHeatmap
        startDate={start}
        endDate={end}
        values={values}
        classForValue={(v:any) => {
          if (!v || !v.count) return "color-empty";
          return v.count > 4 ? "color-github-4"
               : v.count > 3 ? "color-github-3"
               : v.count > 2 ? "color-github-2"
               : "color-github-1";
        }}
        tooltipDataAttrs={(v:any)=>({ "data-tip": `${v.date || ""} : ${v.count || 0}` })}
        showWeekdayLabels
      />
      <style jsx global>{`
        .color-empty { fill: #0f172a; }
        .color-github-1 { fill: #10b98133; }
        .color-github-2 { fill: #10b98155; }
        .color-github-3 { fill: #10b98188; }
        .color-github-4 { fill: #10b981cc; }
      `}</style>
    </div>
  );
}
