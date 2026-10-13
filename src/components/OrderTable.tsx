"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { WEEKDAY_ORDER, WEEKDAY_SHORT } from "@/lib/calendar";
import { formatNumber, formatZar } from "@/lib/format";
import type { OrderLineSnapshot } from "@/lib/types";

function dayCell(value: number) {
  return value > 0 ? value : "–";
}

export default function OrderTable({ lines }: { lines: OrderLineSnapshot[] }) {
  const food = lines.reduce((sum, line) => sum + line.lineCost, 0);
  const packs = lines.reduce((sum, line) => sum + line.packsToBuy, 0);

  return (
    <Box sx={{ overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Table size="small" sx={{ minWidth: 1280 }}>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Pack</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell align="right">Qty / learner</TableCell>
            <TableCell align="right">Learners</TableCell>
            {WEEKDAY_ORDER.map((day) => (
              <TableCell key={day} align="right">{WEEKDAY_SHORT[day]}</TableCell>
            ))}
            <TableCell align="right">Days</TableCell>
            <TableCell align="right">Required qty</TableCell>
            <TableCell align="right">Qty in unit</TableCell>
            <TableCell align="right">Packs</TableCell>
            <TableCell align="right">Cost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => {
            const bought = line.packsToBuy * line.unitSize;
            const gap = line.quantityInUnit - bought;
            return (
              <TableRow key={line.itemId} sx={{ bgcolor: line.perishable ? "rgba(142, 47, 47, 0.06)" : undefined }}>
                <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper", fontWeight: 600 }}>
                  {line.itemName}
                  {line.perishable ? <Chip size="small" label="Fresh" sx={{ ml: 1 }} /> : null}
                </TableCell>
                <TableCell>{formatNumber(line.unitSize, 1)} {line.unitOfMeasure}</TableCell>
                <TableCell align="right">{formatZar(line.price)}</TableCell>
                <TableCell>
                  {line.supplierName ?? "No price"}
                  {line.priceSource === "chosen" ? <Chip size="small" label="Chosen" sx={{ ml: 1 }} /> : null}
                  {line.priceSource === "cheapest" ? <Chip size="small" label="Cheapest" sx={{ ml: 1 }} /> : null}
                </TableCell>
                <TableCell align="right">{formatNumber(line.qtyPerLearner, 2)} {line.portionUnit}</TableCell>
                <TableCell align="right">{line.learnerCount}</TableCell>
                {WEEKDAY_ORDER.map((day) => (
                  <TableCell key={day} align="right">{dayCell(line.dayCounts[day])}</TableCell>
                ))}
                <TableCell align="right">{line.totalDays}</TableCell>
                <TableCell align="right">{formatNumber(line.requiredQty, 2)}</TableCell>
                <TableCell align="right">{formatNumber(line.quantityInUnit, 4)}</TableCell>
                <TableCell align="right">
                  {line.packsToBuy}
                  {Math.abs(gap) > 0.001 ? (
                    <Typography variant="caption" display="block" color={gap > 0 ? "error.main" : "text.secondary"}>
                      {gap > 0 ? `${formatNumber(gap, 2)} short` : `${formatNumber(Math.abs(gap), 2)} spare`}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell align="right">{formatZar(line.lineCost)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell colSpan={14} sx={{ fontWeight: 700 }}>Month total</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>{packs}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatZar(food)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
}
