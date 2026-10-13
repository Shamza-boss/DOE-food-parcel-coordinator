"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { MonthSwitcher, PageHeader } from "@/components/PageHeader";
import { weekStart } from "@/lib/calendar";
import { formatNumber, formatWeekday, formatZar, thisMonth } from "@/lib/format";
import { can, planMonth, useApp } from "@/lib/store";
import type { DeliveryPlan, DeliveryTrip } from "@/lib/types";

export default function DeliveriesPage() {
  const { role, state, updateSettings, savePlan } = useApp();
  const initial = thisMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [capacity, setCapacity] = useState(String(state.settings.vehicleCapacityKg));
  const [cost, setCost] = useState(String(state.settings.deliveryCostZar));
  const [comment, setComment] = useState("");
  const live = useMemo(() => planMonth(state, year, month), [state, year, month]);
  const saved = state.plans.find((plan) => plan.year === year && plan.month === month);
  const groups = new Map<string, DeliveryTrip[]>();
  for (const trip of live.trips) {
    const key = weekStart(trip.date);
    groups.set(key, [...(groups.get(key) ?? []), trip]);
  }
  const planner = can(role, "deliveries");
  const owner = can(role, "accept");

  function currentPlan(status: DeliveryPlan["status"]): DeliveryPlan {
    return {
      year,
      month,
      status,
      acceptedAt: status === "accepted" ? new Date().toISOString() : undefined,
      vehicleCapacityKg: state.settings.vehicleCapacityKg,
      deliveryCostZar: state.settings.deliveryCostZar,
      trips: live.trips,
      totalCost: live.trips.reduce((sum, trip) => sum + trip.cost, 0),
      notes: live.notes,
      comment,
    };
  }

  return (
    <>
      <PageHeader
        title="Weekly deliveries"
        subtitle="Each week, fresh food goes out on the day it is served. Dry stock rides along on a trip that happens on or before the first day it is eaten. A day is split into extra trips when the load is over the car."
        action={<MonthSwitcher year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />}
      />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <TextField label="Car capacity (kg)" value={capacity} disabled={!planner} onChange={(event) => setCapacity(event.target.value)} />
          <TextField label="Cost per trip (R)" value={cost} disabled={!planner} onChange={(event) => setCost(event.target.value)} />
          <Button
            variant="outlined"
            disabled={!planner}
            onClick={() => {
              const nextCapacity = Number(capacity);
              const nextCost = Number(cost);
              if (!(nextCapacity > 0) || Number.isNaN(nextCost)) return;
              updateSettings({ vehicleCapacityKg: nextCapacity, deliveryCostZar: nextCost });
            }}
          >
            Save car settings
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Capacity is a setting, currently {state.settings.vehicleCapacityKg} kg. Change it to the car you actually use. Litres are counted as kilograms for the load, and a box uses the pack weight on the menu.
        </Typography>
      </Paper>
      {saved?.status === "accepted" ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          The owner has accepted this month&apos;s plan. Dashboard delivery cost is {formatZar(saved.totalCost)}.
          {(saved.vehicleCapacityKg !== state.settings.vehicleCapacityKg || saved.deliveryCostZar !== state.settings.deliveryCostZar)
            ? " Settings have changed since then. Accept again to update the dashboard."
            : ""}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>This plan is not on the dashboard until the owner accepts it.</Alert>
      )}
      {live.notes.map((note) => (
        <Typography key={note} sx={{ mb: 1 }}>{note}</Typography>
      ))}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ my: 2 }}>
        {planner ? <Button variant="contained" onClick={() => savePlan(currentPlan("draft"))}>Save draft</Button> : null}
        {owner ? <Button variant="contained" color="secondary" onClick={() => savePlan(currentPlan("accepted"))}>Accept plan</Button> : null}
      </Stack>
      <TextField fullWidth multiline minRows={2} label="Note on this plan" value={comment} onChange={(event) => setComment(event.target.value)} sx={{ mb: 2 }} disabled={!planner && !owner} />
      {[...groups.entries()].map(([week, trips]) => (
        <Paper key={week} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Week of {formatWeekday(week)}</Typography>
          <Stack spacing={1.5}>
            {trips.map((trip) => {
              const ratio = trip.capacityKg > 0 ? Math.min(100, (trip.weightKg / trip.capacityKg) * 100) : 0;
              return (
                <Paper key={trip.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
                    <Typography sx={{ fontWeight: 700 }}>{trip.schoolName} · {formatWeekday(trip.date)} · {formatZar(trip.cost)}</Typography>
                    <Typography>{formatNumber(trip.weightKg, 1)} / {formatNumber(trip.capacityKg, 0)} kg</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={ratio} sx={{ my: 1, height: 8, borderRadius: 99 }} />
                  {trip.drops.map((drop) => (
                    <Typography key={`${trip.id}-${drop.itemId}`} variant="body2">
                      {drop.itemName}: {drop.packs} {drop.packs === 1 ? "pack" : "packs"}{drop.perishable ? " · fresh" : ""} — {drop.reason}
                    </Typography>
                  ))}
                </Paper>
              );
            })}
          </Stack>
        </Paper>
      ))}
      {live.trips.length === 0 ? <Alert severity="warning">Open the month&apos;s orders before planning deliveries.</Alert> : null}
    </>
  );
}
