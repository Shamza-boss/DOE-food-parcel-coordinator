"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import OrderTable from "@/components/OrderTable";
import { PageHeader } from "@/components/PageHeader";
import { calendarYears } from "@/lib/calendar";
import { formatMonth } from "@/lib/format";
import { can, linesForOrder, useApp } from "@/lib/store";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { role, state, closeOrder, reopenOrder, useAsTemplate } = useApp();
  const found = linesForOrder(state, params.id);
  const [month, setMonth] = useState("11");
  const [year, setYear] = useState("2026");
  const [message, setMessage] = useState<string | null>(null);

  if (!found) {
    return <Alert severity="warning">This order is not in the working copy.</Alert>;
  }

  const { order, lines } = found;
  const school = state.schools.find((entry) => entry.id === order.schoolId);
  const typeName = order.snapshot?.schoolTypeName ?? state.schoolTypes.find((type) => type.id === school?.schoolTypeId)?.name;

  return (
    <>
      <PageHeader
        title={`${order.snapshot?.schoolName ?? school?.name ?? "School"} · ${formatMonth(order.year, order.month)}`}
        subtitle={`${typeName ?? "School type"} · ${order.snapshot?.learnerCount ?? school?.learnerCount ?? 0} learners. Required quantity is portion × learners × school days. Packs are that quantity converted to the purchase unit, then rounded to the nearest whole pack.`}
      />
      {order.status === "closed" ? (
        <Alert severity="success" sx={{ mb: 2 }}>This month is closed. Prices and the calendar will not change it.</Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>This order is open, so it still follows the school record, portions, and chosen prices.</Alert>
      )}
      {lines.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>No portions are captured for this school type, so the sheet is empty.</Alert>
      ) : (
        <OrderTable lines={lines} />
      )}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }} alignItems={{ sm: "center" }}>
        {can(role, "orders") && order.status === "open" ? (
          <Button variant="contained" onClick={() => closeOrder(order.id)}>Close order</Button>
        ) : null}
        {can(role, "orders") && order.status === "closed" ? (
          <Button onClick={() => reopenOrder(order.id)}>Reopen</Button>
        ) : null}
        {can(role, "orders") ? (
          <>
            <TextField select size="small" label="Year" value={year} onChange={(event) => setYear(event.target.value)}>
              {calendarYears().map((value) => <MenuItem key={value} value={String(value)}>{value}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Month" value={month} onChange={(event) => setMonth(event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => (
                <MenuItem key={index + 1} value={String(index + 1)}>{formatMonth(2026, index + 1).replace(" 2026", "")}</MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              onClick={() => {
                const error = useAsTemplate(order.id, Number(year), Number(month));
                setMessage(error);
                if (!error) router.push(`/orders/order_${order.schoolId}_${year}_${month.padStart(2, "0")}`);
              }}
            >
              Use as template
            </Button>
          </>
        ) : null}
      </Stack>
      {message ? <Alert severity="warning" sx={{ mt: 2 }}>{message}</Alert> : null}
    </>
  );
}
