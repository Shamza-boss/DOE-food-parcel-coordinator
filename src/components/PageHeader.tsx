"use client";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { calendarYears } from "@/lib/calendar";
import { formatMonth, shiftMonth } from "@/lib/format";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "flex-end" }} sx={{ mb: 3 }}>
      <Box>
        <Typography variant="h4">{title}</Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}

export function MonthSwitcher({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const years = calendarYears();
  const min = years[0];
  const max = years[years.length - 1];
  const atStart = year === min && month === 1;
  const atEnd = year === max && month === 12;
  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Button variant="outlined" aria-label="Previous month" disabled={atStart} onClick={() => onChange(previous.year, previous.month)}>
        <ChevronLeftIcon />
      </Button>
      <Typography sx={{ minWidth: 148, textAlign: "center", fontWeight: 600 }}>{formatMonth(year, month)}</Typography>
      <Button variant="outlined" aria-label="Next month" disabled={atEnd} onClick={() => onChange(next.year, next.month)}>
        <ChevronRightIcon />
      </Button>
    </Stack>
  );
}
