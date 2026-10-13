"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { formatDate, todayISO } from "@/lib/format";
import { can, useApp } from "@/lib/store";

const cylinders = [5, 9, 14, 19, 48];

export default function SchoolsPage() {
  const { role, state, addSchool, updateSchool, addGas } = useApp();
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState(state.schoolTypes[0]?.id ?? "");
  const [learners, setLearners] = useState("100");
  const owner = can(role, "schools");
  const gasEditor = can(role, "gas");

  return (
    <>
      <PageHeader
        title="Schools"
        subtitle="Each school has a type, a learner count, and a gas history. The latest cylinder delivery is what the dashboard shows."
      />
      {!owner ? <Alert severity="info" sx={{ mb: 2 }}>School details belong to the owner. The coordinator can record a gas delivery.</Alert> : null}
      <Stack spacing={2}>
        {state.schools.map((school) => {
          const latest = school.gasDeliveries.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
          return (
            <Paper key={school.id} sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 2 }}>
                <TextField label="School" defaultValue={school.name} disabled={!owner} onBlur={(event) => updateSchool(school.id, { name: event.target.value })} />
                <TextField select label="Type" value={school.schoolTypeId} disabled={!owner} onChange={(event) => updateSchool(school.id, { schoolTypeId: event.target.value })}>
                  {state.schoolTypes.map((type) => <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>)}
                </TextField>
                <TextField label="Learners" type="number" defaultValue={school.learnerCount} disabled={!owner} onBlur={(event) => updateSchool(school.id, { learnerCount: Number(event.target.value) })} />
              </Stack>
              <Typography variant="subtitle1">Gas</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {latest ? `Last delivery ${formatDate(latest.date)}, ${latest.cylinderSizeKg} kg cylinder.` : "No gas delivery recorded."}
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 1 }}>
                {school.gasDeliveries.slice().sort((a, b) => b.date.localeCompare(a.date)).map((delivery) => (
                  <Typography key={delivery.id} variant="body2">
                    {formatDate(delivery.date)} · {delivery.cylinderSizeKg} kg{delivery.notes ? ` · ${delivery.notes}` : ""}
                  </Typography>
                ))}
              </Stack>
              {gasEditor ? (
                <GasForm onSave={(delivery) => addGas(school.id, delivery)} />
              ) : null}
            </Paper>
          );
        })}
      </Stack>
      {owner ? (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Add a school</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} />
            <TextField select label="Type" value={typeId} onChange={(event) => setTypeId(event.target.value)}>
              {state.schoolTypes.map((type) => <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>)}
            </TextField>
            <TextField label="Learners" value={learners} onChange={(event) => setLearners(event.target.value)} />
            <Button variant="contained" onClick={() => {
              const count = Number(learners);
              if (!name.trim() || !typeId || Number.isNaN(count) || count < 0) return;
              addSchool({ name: name.trim(), schoolTypeId: typeId, learnerCount: count });
              setName("");
            }}>Add school</Button>
          </Stack>
        </Paper>
      ) : null}
    </>
  );
}

function GasForm({ onSave }: { onSave: (delivery: { date: string; cylinderSizeKg: number; notes: string }) => void }) {
  const [date, setDate] = useState(todayISO);
  const [size, setSize] = useState("19");
  const [notes, setNotes] = useState("");
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
      <TextField type="date" label="Delivered" value={date} onChange={(event) => setDate(event.target.value)} InputLabelProps={{ shrink: true }} />
      <TextField select label="Cylinder" value={size} onChange={(event) => setSize(event.target.value)}>
        {cylinders.map((cylinder) => <MenuItem key={cylinder} value={String(cylinder)}>{cylinder} kg</MenuItem>)}
      </TextField>
      <TextField label="Note" value={notes} onChange={(event) => setNotes(event.target.value)} />
      <Button variant="outlined" onClick={() => onSave({ date, cylinderSizeKg: Number(size), notes })}>Record delivery</Button>
    </Stack>
  );
}
