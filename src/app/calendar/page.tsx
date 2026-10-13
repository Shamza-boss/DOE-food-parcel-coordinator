"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { MonthSwitcher, PageHeader } from "@/components/PageHeader";
import { countWeekdays, dayKind, monthDates, monthSchoolDays, WEEKDAY_ORDER, WEEKDAY_LABEL, HOLIDAYS } from "@/lib/calendar";
import { formatMonth, thisMonth } from "@/lib/format";

const heads = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const initial = thisMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const dates = monthDates(year, month);
  const lead = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const cells: Array<string | null> = [...Array(lead).fill(null), ...dates];
  while (cells.length % 7 !== 0) cells.push(null);
  const counts = countWeekdays(monthSchoolDays(year, month));
  const holidays = HOLIDAYS.filter((holiday) => holiday.date.startsWith(`${year}-${String(month).padStart(2, "0")}`));

  return (
    <>
      <PageHeader
        title="School calendar"
        subtitle="Only learner days inside a KwaZulu-Natal public-school term count. Weekends, public holidays, the 15 June 2026 special school holiday, and the 4 November 2026 election holiday are left out. 12–13 January and 10–11 December 2026 are educator days, so they are not feeding days."
        action={<MonthSwitcher year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />}
      />
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        {WEEKDAY_ORDER.map((day) => (
          <Paper key={day} sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">{WEEKDAY_LABEL[day]}</Typography>
            <Typography variant="h5">{counts[day]}</Typography>
          </Paper>
        ))}
        <Paper sx={{ px: 2, py: 1 }}>
          <Typography variant="overline">School days</Typography>
          <Typography variant="h5">{monthSchoolDays(year, month).length}</Typography>
        </Paper>
      </Stack>
      <Paper sx={{ p: 1, mb: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
          {heads.map((head) => (
            <Typography key={head} variant="caption" align="center" sx={{ fontWeight: 700 }}>{head}</Typography>
          ))}
          {cells.map((iso, index) => {
            const kind = iso ? dayKind(iso) : null;
            const bg = kind?.kind === "school" ? "#E5F2EA" : kind?.kind === "holiday" ? "#F8E4E1" : kind?.kind === "break" ? "#F3EFE4" : "transparent";
            return (
              <Box key={`${iso ?? "empty"}-${index}`} sx={{ minHeight: 72, p: 0.75, borderRadius: 1, bgcolor: bg }}>
                {iso ? <Typography variant="body2" sx={{ fontWeight: 600 }}>{Number(iso.slice(-2))}</Typography> : null}
                {kind?.label ? <Typography variant="caption" color="error.main">{kind.label}</Typography> : null}
                {kind?.kind === "break" ? <Typography variant="caption" color="text.secondary">Closed</Typography> : null}
              </Box>
            );
          })}
        </Box>
      </Paper>
      <Typography variant="body2" color="text.secondary">
        {holidays.length === 0
          ? `${formatMonth(year, month)} has no listed public or special school holiday.`
          : holidays.map((holiday) => `${holiday.date.slice(-2)} ${holiday.name}`).join(" · ")}
      </Typography>
    </>
  );
}
