"use client";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

const DRAWER_WIDTH = 232;

const links = [
  { href: "/", label: "Dashboard", icon: <DashboardOutlinedIcon /> },
  { href: "/orders", label: "Orders", icon: <ReceiptLongOutlinedIcon /> },
  { href: "/menu", label: "Menu & portions", icon: <MenuBookOutlinedIcon /> },
  { href: "/schools", label: "Schools", icon: <SchoolOutlinedIcon /> },
  { href: "/calendar", label: "School calendar", icon: <CalendarMonthOutlinedIcon /> },
  { href: "/prices", label: "Prices", icon: <LocalOfferOutlinedIcon /> },
  { href: "/deliveries", label: "Deliveries", icon: <LocalShippingOutlinedIcon /> },
];

const roleLabel: Record<Role, string> = {
  owner: "Owner",
  capturer: "Price capturer",
  coordinator: "Coordinator",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, role, setRole } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box sx={{ pt: 1 }}>
      <Typography variant="overline" sx={{ px: 2, color: "text.secondary" }}>
        Working set
      </Typography>
      <List>
        {links.map((link) => {
          const selected = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={selected ? "page" : undefined}
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemButton selected={selected} component="div" role="presentation" tabIndex={-1}>
                <ListItemIcon sx={{ minWidth: 38, color: selected ? "primary.main" : "text.secondary" }}>
                  {link.icon}
                </ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </Link>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" } }} aria-label="Open navigation">
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 160 }}>
            <Typography variant="h6" component="div">Food parcels</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: -0.5 }}>
              KwaZulu-Natal school feeding
            </Typography>
          </Box>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={role}
            onChange={(_, value: Role | null) => value && setRole(value)}
            aria-label="Role"
            sx={{
              bgcolor: "rgba(255,255,255,0.12)",
              "& .MuiToggleButton-root": { color: "inherit", borderColor: "rgba(255,255,255,0.25)", px: 1.25 },
              "& .Mui-selected": { bgcolor: "#F7F3EA !important", color: "#1E4D3A !important" },
            }}
          >
            {(Object.keys(roleLabel) as Role[]).map((key) => (
              <ToggleButton key={key} value={key}>{roleLabel[key]}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", pt: 8 } }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", pt: 8, bgcolor: "background.paper" },
        }}
        open
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: "72px" }}>
        {ready ? children : (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }} spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Opening the working copy saved in this browser.</Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
