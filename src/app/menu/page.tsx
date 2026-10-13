"use client";

import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { WEEKDAY_ORDER, WEEKDAY_SHORT } from "@/lib/calendar";
import { can, useApp } from "@/lib/store";
import type { PortionUnit, PurchaseUom, Weekday } from "@/lib/types";

const units: PortionUnit[] = ["g", "ml", "each"];
const purchaseUnits: PurchaseUom[] = ["kg", "L", "box"];

export default function MenuPage() {
  const { role, state, updateItem, addItem, upsertPortion, addSchoolType } = useApp();
  const [typeId, setTypeId] = useState(state.schoolTypes[0]?.id ?? "");
  const [typeName, setTypeName] = useState("");
  const [itemName, setItemName] = useState("");
  const editable = can(role, "menu");

  return (
    <>
      <PageHeader
        title="Menu and portions"
        subtitle="The menu is the same for every school. Portion sizes belong to the school type. Fresh items are delivered on the day they are eaten."
      />
      {!editable ? <Alert severity="info" sx={{ mb: 2 }}>Viewing only. The owner captures the menu and portions.</Alert> : null}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Eaten on</TableCell>
              <TableCell>Fresh</TableCell>
              <TableCell>Pack size</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Pack weight (kg)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <ToggleButtonGroup
                    size="small"
                    value={item.consumptionDays}
                    onChange={(_, days: Weekday[]) => {
                      if (editable) updateItem(item.id, { consumptionDays: days });
                    }}
                  >
                    {WEEKDAY_ORDER.map((day) => (
                      <ToggleButton key={day} value={day} disabled={!editable}>
                        {WEEKDAY_SHORT[day]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </TableCell>
                <TableCell>
                  <Switch checked={item.perishable} disabled={!editable} onChange={(event) => updateItem(item.id, { perishable: event.target.checked })} />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    defaultValue={item.unitSize}
                    disabled={!editable}
                    onBlur={(event) => updateItem(item.id, { unitSize: Number(event.target.value) })}
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField select size="small" value={item.unitOfMeasure} disabled={!editable} onChange={(event) => updateItem(item.id, { unitOfMeasure: event.target.value as PurchaseUom })}>
                    {purchaseUnits.map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    defaultValue={item.packWeightKg}
                    disabled={!editable}
                    onBlur={(event) => updateItem(item.id, { packWeightKg: Number(event.target.value) })}
                    sx={{ width: 90 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {editable ? (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <TextField size="small" label="New item" value={itemName} onChange={(event) => setItemName(event.target.value)} />
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => {
                if (!itemName.trim()) return;
                addItem({
                  name: itemName.trim(),
                  unitSize: 1,
                  unitOfMeasure: "kg",
                  packWeightKg: 1,
                  perishable: false,
                  consumptionDays: ["mon"],
                });
                setItemName("");
              }}
            >
              Add item
            </Button>
          </Stack>
        ) : null}
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Tabs value={typeId} onChange={(_, value) => setTypeId(value)}>
            {state.schoolTypes.map((type) => <Tab key={type.id} value={type.id} label={type.name} />)}
          </Tabs>
          {editable ? (
            <Stack direction="row" spacing={1}>
              <TextField size="small" label="New school type" value={typeName} onChange={(event) => setTypeName(event.target.value)} />
              <Button onClick={() => {
                if (!typeName.trim()) return;
                addSchoolType(typeName);
                setTypeName("");
              }}>Add type</Button>
            </Stack>
          ) : null}
        </Stack>
        <Table size="small" sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Qty per learner</TableCell>
              <TableCell>Unit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.items.map((item) => {
              const portion = state.portions.find((entry) => entry.schoolTypeId === typeId && entry.itemId === item.id);
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      key={`${typeId}-${item.id}-${portion?.qtyPerLearner ?? "empty"}`}
                      defaultValue={portion?.qtyPerLearner ?? ""}
                      placeholder="Not set"
                      disabled={!editable}
                      onBlur={(event) => {
                        const qty = Number(event.target.value);
                        if (!event.target.value || Number.isNaN(qty)) return;
                        upsertPortion(typeId, item.id, qty, portion?.unit ?? "g");
                      }}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={portion?.unit ?? "g"}
                      disabled={!editable}
                      onChange={(event) => upsertPortion(typeId, item.id, portion?.qtyPerLearner ?? 0, event.target.value as PortionUnit)}
                    >
                      {units.map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
                    </TextField>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
