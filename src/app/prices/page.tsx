"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { latestCapturePerSupplier, pricePerBaseUnit, resolvePrice } from "@/lib/calc";
import { formatDate, formatNumber, formatZar, todayISO } from "@/lib/format";
import { can, useApp } from "@/lib/store";
import type { PurchaseUom } from "@/lib/types";

export default function PricesPage() {
  const { role, state, addSupplier, updateSupplier, addPrice, reuseSupplierPrices, choosePrice } = useApp();
  const editable = can(role, "prices");
  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id ?? "");
  const [newSupplier, setNewSupplier] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [itemId, setItemId] = useState(state.items[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [unitSize, setUnitSize] = useState(String(state.items[0]?.unitSize ?? 1));
  const [contents, setContents] = useState(state.items[0]?.contentsPerPack != null ? String(state.items[0].contentsPerPack) : "");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const selectedItem = state.items.find((item) => item.id === itemId);
  const supplier = state.suppliers.find((entry) => entry.id === supplierId);

  return (
    <>
      <PageHeader
        title="Supplier prices"
        subtitle="Capture the price, the pack size, and how much is inside that pack when it is not obvious from the unit. A box of fruit needs the number of fruit in the box. The date is today."
      />
      {!editable ? <Alert severity="info" sx={{ mb: 2 }}>Viewing only. The price capturer records quotes.</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Capture a price · {formatDate(todayISO())}</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
          <TextField select label="Supplier" value={supplierId} disabled={!editable} onChange={(event) => setSupplierId(event.target.value)}>
            {state.suppliers.map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.name}</MenuItem>)}
          </TextField>
          <TextField select label="Item" value={itemId} disabled={!editable} onChange={(event) => {
            setItemId(event.target.value);
            const item = state.items.find((entry) => entry.id === event.target.value);
            if (item) {
              setUnitSize(String(item.unitSize));
              setContents(item.contentsPerPack != null ? String(item.contentsPerPack) : "");
            }
          }}>
            {state.items.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
          </TextField>
          <TextField label="Price (R)" value={price} disabled={!editable} onChange={(event) => setPrice(event.target.value)} />
          <TextField label="Pack size" value={unitSize} disabled={!editable} onChange={(event) => setUnitSize(event.target.value)} />
          <TextField
            label={selectedItem?.unitOfMeasure === "box" ? "Pieces in the pack" : "Amount in the pack"}
            value={contents}
            disabled={!editable}
            placeholder="From pack size"
            onChange={(event) => setContents(event.target.value)}
          />
          <TextField label="Note" value={notes} disabled={!editable} onChange={(event) => setNotes(event.target.value)} />
          <Button
            variant="contained"
            disabled={!editable}
            onClick={() => {
              const amount = Number(price);
              const size = Number(unitSize);
              const contentsValue = contents.trim() === "" ? null : Number(contents);
              if (!supplierId || !itemId || Number.isNaN(amount) || !(size > 0) || (contentsValue != null && Number.isNaN(contentsValue))) return;
              addPrice({
                supplierId,
                itemId,
                price: amount,
                unitSize: size,
                unitOfMeasure: selectedItem?.unitOfMeasure ?? "kg",
                contentsPerPack: contentsValue,
                notes: notes.trim(),
              });
              setPrice("");
              setNotes("");
              setNotice("Price captured for today.");
            }}
          >
            Save price
          </Button>
        </Stack>
        {editable ? (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 2 }}>
            <TextField label="New supplier" value={newSupplier} onChange={(event) => setNewSupplier(event.target.value)} />
            <TextField label="Supplier note" value={supplierNotes} onChange={(event) => setSupplierNotes(event.target.value)} />
            <Button variant="outlined" onClick={() => {
              if (!newSupplier.trim()) return;
              const id = addSupplier(newSupplier, supplierNotes.trim());
              setSupplierId(id);
              setNewSupplier("");
              setSupplierNotes("");
            }}>Add supplier</Button>
            <Button onClick={() => setNotice(`Reused ${reuseSupplierPrices(supplierId)} prices for today.`)} disabled={!supplierId}>
              Reuse this supplier&apos;s prices
            </Button>
          </Stack>
        ) : null}
        {supplier && editable ? (
          <TextField
            key={supplier.id}
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            label={`Notes for ${supplier.name}`}
            defaultValue={supplier.notes}
            onBlur={(event) => updateSupplier(supplier.id, { notes: event.target.value })}
          />
        ) : supplier ? (
          <Typography sx={{ mt: 2 }}>{supplier.notes}</Typography>
        ) : null}
      </Paper>
      <Stack spacing={2}>
        {state.items.map((item) => {
          const quotes = latestCapturePerSupplier(state.prices, item.id);
          const resolved = resolvePrice(state.prices, state.priceChoices, item.id);
          return (
            <Paper key={item.id} sx={{ p: 2 }}>
              <Typography variant="h6">{item.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Using {resolved.capture ? `${resolved.capture ? state.suppliers.find((entry) => entry.id === resolved.capture?.supplierId)?.name : ""} · ${formatZar(resolved.capture.price)} for ${formatNumber(resolved.capture.unitSize, 2)} ${resolved.capture.unitOfMeasure}` : "no price"} ({resolved.source}).
              </Typography>
              <Stack spacing={1}>
                {quotes.map((quote) => {
                  const name = state.suppliers.find((entry) => entry.id === quote.supplierId)?.name ?? "Supplier";
                  const active = resolved.capture?.id === quote.id;
                  return (
                    <Stack key={quote.id} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
                      <BoxLine name={name} quote={quote} />
                      <Stack direction="row" spacing={1} alignItems="center">
                        {active ? <Chip size="small" color="primary" label={resolved.source === "chosen" ? "Chosen" : "Cheapest"} /> : null}
                        {editable ? (
                          <Button size="small" disabled={active && resolved.source === "chosen"} onClick={() => choosePrice(item.id, quote.id)}>
                            Use this price
                          </Button>
                        ) : null}
                      </Stack>
                    </Stack>
                  );
                })}
                {quotes.length === 0 ? <Typography color="text.secondary">No quote yet.</Typography> : null}
                {editable && state.priceChoices[item.id] ? (
                  <Button size="small" onClick={() => choosePrice(item.id, null)}>Return to the cheapest price</Button>
                ) : null}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}

function BoxLine({
  name,
  quote,
}: {
  name: string;
  quote: { price: number; unitSize: number; unitOfMeasure: PurchaseUom; contentsPerPack: number | null; capturedOn: string; notes: string };
}) {
  return (
    <div>
      <Typography>
        {name} · {formatZar(quote.price)} / {formatNumber(quote.unitSize, 2)} {quote.unitOfMeasure} · {formatZar(pricePerBaseUnit(quote))} per {quote.unitOfMeasure}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatDate(quote.capturedOn)}
        {quote.contentsPerPack != null ? ` · ${formatNumber(quote.contentsPerPack, 2)} inside` : ""}
        {quote.notes ? ` · ${quote.notes}` : ""}
      </Typography>
    </div>
  );
}
