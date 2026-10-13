"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MonthSwitcher, PageHeader } from "@/components/PageHeader";
import { formatDate, formatZar, thisMonth } from "@/lib/format";
import { sumFoodCost } from "@/lib/calc";
import { buildLines } from "@/lib/order";
import { can, useApp } from "@/lib/store";

export default function DashboardPage() {
  const { role, state, ensureOrders, addVariation, removeVariation, reset } = useApp();
  const initial = thisMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const summary = useMemo(() => {
    const orders = state.orders.filter((order) => order.year === year && order.month === month);
    const rows = orders.flatMap((order) => {
      const school = state.schools.find((entry) => entry.id === order.schoolId);
      if (!school && !order.snapshot) return [];
      const lines = order.status === "closed" && order.snapshot ? order.snapshot.lines : school ? buildLines(state, school, year, month) : [];
      const gas = school?.gasDeliveries.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
      return [{
        id: order.id,
        school: order.snapshot?.schoolName ?? school?.name ?? "School",
        status: order.status,
        learners: order.snapshot?.learnerCount ?? school?.learnerCount ?? 0,
        food: order.status === "closed" && order.snapshot ? order.snapshot.foodCost : sumFoodCost(lines),
        gas,
      }];
    });
    const plan = state.plans.find((entry) => entry.year === year && entry.month === month && entry.status === "accepted");
    const variations = state.variations.filter((entry) => entry.year === year && entry.month === month);
    const food = rows.reduce((sum, row) => sum + row.food, 0);
    const delivery = plan?.totalCost ?? 0;
    const extra = variations.reduce((sum, entry) => sum + entry.amount, 0);
    return { rows, plan, variations, food, delivery, extra, total: food + delivery + extra };
  }, [state, year, month]);

  return (
    <Box>
      <PageHeader
        title="Monthly cost"
        subtitle="Food from each school's order, plus the accepted delivery plan and any extra costs you want to keep an eye on."
        action={<MonthSwitcher year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />}
      />
      {summary.rows.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }} action={can(role, "orders") ? <Button color="inherit" onClick={() => ensureOrders(year, month)}>Open this month</Button> : undefined}>
          No orders are open for this month yet.
        </Alert>
      ) : null}
      {!summary.plan ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          There is no accepted delivery plan, so delivery cost is not in the total. The coordinator builds the week, and the owner accepts it.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          Delivery plan accepted{summary.plan.acceptedAt ? ` ${formatDate(summary.plan.acceptedAt.slice(0, 10))}` : ""}. {summary.plan.trips.length} trips at {formatZar(summary.plan.deliveryCostZar)} each.
        </Alert>
      )}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        {[
          ["Food", summary.food],
          ["Delivery", summary.delivery],
          ["Other costs", summary.extra],
          ["Total", summary.total],
        ].map(([name, value]) => (
          <Paper key={String(name)} sx={{ p: 2, flex: 1 }}>
            <Typography variant="overline" color="text.secondary">{name}</Typography>
            <Typography variant="h5">{formatZar(Number(value))}</Typography>
          </Paper>
        ))}
      </Stack>
      <Paper sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>School</TableCell>
              <TableCell>Order</TableCell>
              <TableCell align="right">Learners</TableCell>
              <TableCell align="right">Food</TableCell>
              <TableCell>Last gas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summary.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.school}</TableCell>
                <TableCell>
                  <Button component={Link} href={`/orders/${row.id}`} size="small">
                    {row.status === "closed" ? "Closed" : "Open estimate"}
                  </Button>
                </TableCell>
                <TableCell align="right">{row.learners}</TableCell>
                <TableCell align="right">{formatZar(row.food)}</TableCell>
                <TableCell>{row.gas ? `${formatDate(row.gas.date)} · ${row.gas.cylinderSizeKg} kg` : "Not recorded"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Other costs</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Add a cost you may want to track later, such as gas refills or a once-off fee. These sit beside the food order and do not change pack quantities.
        </Typography>
        <Stack spacing={1} sx={{ mb: 2 }}>
          {summary.variations.map((variation) => (
            <Stack key={variation.id} direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography>{variation.label}</Typography>
                {variation.notes ? <Typography variant="body2" color="text.secondary">{variation.notes}</Typography> : null}
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography>{formatZar(variation.amount)}</Typography>
                {can(role, "variations") ? <Button size="small" onClick={() => removeVariation(variation.id)}>Remove</Button> : null}
              </Stack>
            </Stack>
          ))}
          {summary.variations.length === 0 ? <Typography color="text.secondary">None for this month.</Typography> : null}
        </Stack>
        {can(role, "variations") ? (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField label="Cost" value={label} onChange={(event) => setLabel(event.target.value)} />
            <TextField label="Amount (R)" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <TextField label="Note" value={notes} onChange={(event) => setNotes(event.target.value)} />
            <Button
              variant="contained"
              onClick={() => {
                const parsed = Number(amount);
                if (!label.trim() || Number.isNaN(parsed)) return;
                addVariation({ year, month, label: label.trim(), amount: parsed, notes: notes.trim() });
                setLabel("");
                setAmount("");
                setNotes("");
              }}
            >
              Add cost
            </Button>
          </Stack>
        ) : null}
      </Paper>
      {can(role, "orders") ? (
        <Button sx={{ mt: 3 }} color="inherit" onClick={() => {
          if (window.confirm("Replace the saved working copy with the example school and opening prices?")) reset();
        }}>
          Reset example data
        </Button>
      ) : null}
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        This browser keeps the working copy. The app deploys to Vercel without a database.
      </Typography>
    </Box>
  );
}
