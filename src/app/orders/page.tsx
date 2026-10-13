"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Link from "next/link";
import { useState } from "react";
import { MonthSwitcher, PageHeader } from "@/components/PageHeader";
import { formatZar, thisMonth } from "@/lib/format";
import { sumFoodCost } from "@/lib/calc";
import { buildLines } from "@/lib/order";
import { can, useApp } from "@/lib/store";

export default function OrdersPage() {
  const { role, state, ensureOrders, closeOrder } = useApp();
  const initial = thisMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const orders = state.orders.filter((order) => order.year === year && order.month === month);

  return (
    <>
      <PageHeader
        title="Monthly orders"
        subtitle="An open order follows the menu, the school, and that month's learner days. Closing it freezes the sheet so later price changes do not rewrite the month."
        action={<MonthSwitcher year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />}
      />
      {!can(role, "orders") ? (
        <Alert severity="info" sx={{ mb: 2 }}>Viewing only. The owner opens and closes monthly orders.</Alert>
      ) : (
        <Button variant="contained" sx={{ mb: 2 }} onClick={() => ensureOrders(year, month)}>
          Open orders for every school
        </Button>
      )}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>School</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Food</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const school = state.schools.find((entry) => entry.id === order.schoolId);
              const cost = order.snapshot?.foodCost ?? (school ? sumFoodCost(buildLines(state, school, year, month)) : 0);
              return (
                <TableRow key={order.id}>
                  <TableCell>{order.snapshot?.schoolName ?? school?.name ?? "School"}</TableCell>
                  <TableCell><Chip size="small" label={order.status === "closed" ? "Closed" : "Open"} color={order.status === "closed" ? "success" : "default"} /></TableCell>
                  <TableCell align="right">{formatZar(cost)}</TableCell>
                  <TableCell align="right">
                    <Button component={Link} href={`/orders/${order.id}`} size="small">Open sheet</Button>
                    {can(role, "orders") && order.status === "open" ? (
                      <Button size="small" onClick={() => closeOrder(order.id)}>Close</Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No orders for this month.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
