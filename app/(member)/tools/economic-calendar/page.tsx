"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
  Filter,
} from "lucide-react";

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  time: string;
  impact: "high" | "medium" | "low";
  forecast: string;
  previous: string;
  actual: string;
  currency: string;
}

// Static economic calendar data - curated list of recurring high-impact events
const RECURRING_EVENTS: Omit<EconomicEvent, "id" | "date" | "actual">[] = [
  // USD
  { title: "Non-Farm Payrolls", country: "US", time: "19:30", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "FOMC Interest Rate Decision", country: "US", time: "01:00", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "CPI m/m", country: "US", time: "19:30", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "Core CPI m/m", country: "US", time: "19:30", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "GDP q/q", country: "US", time: "19:30", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "Unemployment Rate", country: "US", time: "19:30", impact: "medium", forecast: "—", previous: "—", currency: "USD" },
  { title: "Retail Sales m/m", country: "US", time: "19:30", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "ISM Manufacturing PMI", country: "US", time: "21:00", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "PPI m/m", country: "US", time: "19:30", impact: "medium", forecast: "—", previous: "—", currency: "USD" },
  { title: "Initial Jobless Claims", country: "US", time: "19:30", impact: "medium", forecast: "—", previous: "—", currency: "USD" },
  { title: "FOMC Meeting Minutes", country: "US", time: "01:00", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  { title: "Fed Chair Powell Speaks", country: "US", time: "23:00", impact: "high", forecast: "—", previous: "—", currency: "USD" },
  // EUR
  { title: "ECB Interest Rate Decision", country: "EU", time: "19:15", impact: "high", forecast: "—", previous: "—", currency: "EUR" },
  { title: "CPI y/y (EU)", country: "EU", time: "16:00", impact: "high", forecast: "—", previous: "—", currency: "EUR" },
  { title: "GDP q/q (EU)", country: "EU", time: "16:00", impact: "high", forecast: "—", previous: "—", currency: "EUR" },
  { title: "German Manufacturing PMI", country: "DE", time: "14:30", impact: "medium", forecast: "—", previous: "—", currency: "EUR" },
  { title: "ECB President Lagarde Speaks", country: "EU", time: "20:00", impact: "high", forecast: "—", previous: "—", currency: "EUR" },
  // GBP
  { title: "BOE Interest Rate Decision", country: "GB", time: "18:00", impact: "high", forecast: "—", previous: "—", currency: "GBP" },
  { title: "CPI y/y (UK)", country: "GB", time: "13:00", impact: "high", forecast: "—", previous: "—", currency: "GBP" },
  { title: "GDP m/m (UK)", country: "GB", time: "13:00", impact: "high", forecast: "—", previous: "—", currency: "GBP" },
  { title: "Employment Change (UK)", country: "GB", time: "13:00", impact: "medium", forecast: "—", previous: "—", currency: "GBP" },
  // JPY
  { title: "BOJ Interest Rate Decision", country: "JP", time: "10:00", impact: "high", forecast: "—", previous: "—", currency: "JPY" },
  { title: "CPI y/y (Japan)", country: "JP", time: "06:30", impact: "medium", forecast: "—", previous: "—", currency: "JPY" },
  { title: "GDP q/q (Japan)", country: "JP", time: "06:50", impact: "high", forecast: "—", previous: "—", currency: "JPY" },
  // AUD
  { title: "RBA Interest Rate Decision", country: "AU", time: "10:30", impact: "high", forecast: "—", previous: "—", currency: "AUD" },
  { title: "Employment Change (AU)", country: "AU", time: "08:30", impact: "high", forecast: "—", previous: "—", currency: "AUD" },
  { title: "CPI q/q (AU)", country: "AU", time: "08:30", impact: "high", forecast: "—", previous: "—", currency: "AUD" },
  // CAD
  { title: "BOC Interest Rate Decision", country: "CA", time: "20:45", impact: "high", forecast: "—", previous: "—", currency: "CAD" },
  { title: "Employment Change (CA)", country: "CA", time: "19:30", impact: "high", forecast: "—", previous: "—", currency: "CAD" },
  // CHF
  { title: "SNB Interest Rate Decision", country: "CH", time: "14:30", impact: "high", forecast: "—", previous: "—", currency: "CHF" },
  // NZD
  { title: "RBNZ Interest Rate Decision", country: "NZ", time: "08:00", impact: "high", forecast: "—", previous: "—", currency: "NZD" },
  // Gold/Oil
  { title: "Crude Oil Inventories", country: "US", time: "21:30", impact: "medium", forecast: "—", previous: "—", currency: "USD" },
];

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", GB: "🇬🇧", JP: "🇯🇵", AU: "🇦🇺", CA: "🇨🇦",
  CH: "🇨🇭", NZ: "🇳🇿", DE: "🇩🇪", CN: "🇨🇳",
};

const IMPACT_STYLES = {
  high: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  low: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
};

function generateWeekEvents(weekStart: Date): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  // Distribute events across the week (Mon-Fri)
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split("T")[0];

    // Pick events for this day based on a deterministic distribution
    const dayEvents = RECURRING_EVENTS.filter((_, idx) => {
      // Spread events across the week using modulo
      return idx % 5 === dayOffset;
    });

    dayEvents.forEach((event, i) => {
      events.push({
        ...event,
        id: `${dateStr}-${i}`,
        date: dateStr,
        actual: "—",
      });
    });
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export default function EconomicCalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [filterImpact, setFilterImpact] = useState("all");

  const events = useMemo(() => generateWeekEvents(currentWeek), [currentWeek]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterCurrency !== "all" && e.currency !== filterCurrency) return false;
      if (filterImpact !== "all" && e.impact !== filterImpact) return false;
      return true;
    });
  }, [events, filterCurrency, filterImpact]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, EconomicEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!groups[event.date]) groups[event.date] = [];
      groups[event.date].push(event);
    });
    return groups;
  }, [filteredEvents]);

  function formatWeekRange() {
    const end = new Date(currentWeek);
    end.setDate(end.getDate() + 4);
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${currentWeek.toLocaleDateString("id-ID", opts)} — ${end.toLocaleDateString("id-ID", opts)} ${end.getFullYear()}`;
  }

  function navigateWeek(direction: number) {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + direction * 7);
    setCurrentWeek(next);
  }

  function getDayName(dateStr: string) {
    const d = new Date(dateStr);
    const dayIdx = d.getDay();
    return DAY_NAMES[dayIdx === 0 ? 6 : dayIdx - 1] || "";
  }

  function formatDateShort(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  const isCurrentWeek = getMonday(new Date()).getTime() === currentWeek.getTime();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#96FC03]/10 flex items-center justify-center">
          <CalendarDays size={20} className="text-[#96FC03]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F5]">Economic Calendar</h1>
          <p className="text-sm text-[#8B949E]">Jadwal rilis data ekonomi penting (waktu WIB)</p>
        </div>
      </div>

      {/* Week navigation */}
      <Card className="!p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg hover:bg-[#222229] text-[#8B949E] hover:text-[#F0F0F5] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <p className="font-bold text-[#F0F0F5]">{formatWeekRange()}</p>
            {isCurrentWeek && (
              <span className="text-xs text-[#96FC03]">Minggu ini</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <button
                onClick={() => setCurrentWeek(getMonday(new Date()))}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#222229] text-[#8B949E] hover:text-[#96FC03] hover:border-[#96FC03]/30 transition-colors"
              >
                Hari ini
              </button>
            )}
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 rounded-lg hover:bg-[#222229] text-[#8B949E] hover:text-[#F0F0F5] transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-[#8B949E]" />
          <div className="flex gap-1 flex-wrap">
            {["all", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCurrency(c)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  filterCurrency === c
                    ? "border-[#96FC03]/50 bg-[#96FC03]/10 text-[#96FC03]"
                    : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#8B949E]" />
          <div className="flex gap-1">
            {[
              { key: "all", label: "All" },
              { key: "high", label: "High" },
              { key: "medium", label: "Medium" },
              { key: "low", label: "Low" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterImpact(f.key)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  filterImpact === f.key
                    ? "border-[#96FC03]/50 bg-[#96FC03]/10 text-[#96FC03]"
                    : "border-[#222229] text-[#8B949E] hover:border-[#96FC03]/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Impact legend */}
      <div className="flex items-center gap-4 text-xs text-[#8B949E]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> High Impact</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Medium Impact</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Low Impact</span>
      </div>

      {/* Calendar by day */}
      {Object.keys(groupedByDate).length === 0 ? (
        <Card className="text-center py-12">
          <CalendarDays size={32} className="text-[#222229] mx-auto mb-3" />
          <p className="text-sm text-[#8B949E]">Tidak ada event dengan filter ini.</p>
        </Card>
      ) : (
        Object.entries(groupedByDate).map(([date, dayEvents]) => {
          const today = new Date().toISOString().split("T")[0];
          const isToday = date === today;

          return (
            <div key={date}>
              <div className={`flex items-center gap-2 mb-3 px-1 ${isToday ? "text-[#96FC03]" : "text-[#8B949E]"}`}>
                <span className="text-sm font-bold">{getDayName(date)}</span>
                <span className="text-xs">{formatDateShort(date)}</span>
                {isToday && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#96FC03]/10">Hari ini</span>
                )}
              </div>

              <Card className="!p-0 overflow-hidden">
                <div className="divide-y divide-[#222229]">
                  {dayEvents.map((event) => {
                    const style = IMPACT_STYLES[event.impact];
                    return (
                      <div key={event.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0A0A0F]/50 transition-colors">
                        {/* Impact dot */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />

                        {/* Time */}
                        <div className="w-12 flex-shrink-0">
                          <span className="text-xs font-mono text-[#8B949E]">{event.time}</span>
                        </div>

                        {/* Flag + Currency */}
                        <div className="w-16 flex-shrink-0 flex items-center gap-1.5">
                          <span className="text-sm">{COUNTRY_FLAGS[event.country] || "🌐"}</span>
                          <span className="text-xs font-medium text-[#F0F0F5]">{event.currency}</span>
                        </div>

                        {/* Event name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F0F0F5] truncate">{event.title}</p>
                        </div>

                        {/* Impact badge */}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${style.bg} ${style.text}`}>
                          {event.impact}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          );
        })
      )}

      {/* Disclaimer */}
      <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-400/80">
          Jadwal dan waktu bersifat indikatif. Selalu cek jadwal resmi di forexfactory.com atau investing.com untuk data real-time terbaru sebelum trading.
        </p>
      </div>
    </div>
  );
}
