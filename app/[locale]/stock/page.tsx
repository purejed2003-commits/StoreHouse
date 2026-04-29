"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CircularProgress, IconButton,
  TextField, InputAdornment, Chip, Switch, FormControlLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter } from "@/i18n/routing";
import { supabase, Item } from "@/lib/supabase";

export default function StockPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("name");
    setItems(data || []);
    setLoading(false);
  };

  const getStatus = (item: Item) => {
    const threshold = item.low_stock_threshold || 5;
    if (item.current_stock <= 0) return "out";
    if (item.current_stock <= threshold) return "low";
    return "ok";
  };

  const statusConfig = {
    out: { color: "#dc2626", bg: "#fee2e2", label: "หมดแล้ว", icon: "❌", order: 3 },
    low: { color: "#ea580c", bg: "#fff7ed", label: "ใกล้หมด", icon: "⚠️", order: 1 },
    ok:  { color: "#16a34a", bg: "#dcfce7", label: "มีของ",   icon: "✅", order: 2 },
  };

  const filtered = items
    .filter((item) => {
      if (!showOutOfStock && item.current_stock <= 0) return false;
      if (!search) return true;
      return (
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.category?.toLowerCase().includes(search.toLowerCase()))
      );
    })
    .sort((a, b) => statusConfig[getStatus(a)].order - statusConfig[getStatus(b)].order);

  const lowCount  = items.filter((i) => getStatus(i) === "low").length;
  const outCount  = items.filter((i) => getStatus(i) === "out").length;
  const okCount   = items.filter((i) => getStatus(i) === "ok").length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eff6ff", pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
          px: 2, pt: 4, pb: 3,
          borderRadius: "0 0 28px 28px",
          boxShadow: "0 4px 20px rgba(29,78,216,0.3)",
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton
            onClick={() => router.push("/")}
            sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>
              📊 สต๊อกสินค้า
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem" }}>
              ของที่มีในคลังตอนนี้
            </Typography>
          </Box>
        </Box>

        {/* Summary row */}
        {!loading && (
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Chip
              label={`✅ มีของ ${okCount}`}
              sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 800, fontSize: "0.95rem" }}
            />
            {lowCount > 0 && (
              <Chip
                label={`⚠️ ใกล้หมด ${lowCount}`}
                sx={{ bgcolor: "#fff7ed", color: "#ea580c", fontWeight: 800, fontSize: "0.95rem" }}
              />
            )}
            {outCount > 0 && (
              <Chip
                label={`❌ หมดแล้ว ${outCount}`}
                sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 800, fontSize: "0.95rem" }}
              />
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ px: 3, mt: 3 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": { bgcolor: "white", borderRadius: "16px", fontSize: "1.1rem" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af", fontSize: "1.5rem" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Toggle แสดงของหมด */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "white",
            borderRadius: "16px",
            px: 2.5,
            py: 1.5,
            mb: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 600, color: "#374151" }}>
            ❌ แสดงของที่หมดแล้ว
          </Typography>
          <Switch
            checked={showOutOfStock}
            onChange={(e) => setShowOutOfStock(e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: "#dc2626" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#dc2626" },
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: "#1e40af" }} size={48} />
          </Box>
        ) : filtered.length === 0 ? (
          <Card sx={{ borderRadius: "20px", p: 5, textAlign: "center", bgcolor: "white", border: "2px dashed #e2e8f0" }}>
            <Typography sx={{ fontSize: "3rem", mb: 1 }}>📭</Typography>
            <Typography sx={{ fontSize: "1.2rem", color: "#94a3b8", fontWeight: 600 }}>
              {search ? "ไม่พบสินค้าที่ค้นหา" : "ไม่มีสินค้าในคลัง"}
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map((item) => {
              const status = getStatus(item);
              const cfg = statusConfig[status];

              return (
                <Card
                  key={item.id}
                  sx={{
                    borderRadius: "20px",
                    p: 3,
                    bgcolor: "white",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    borderLeft: `6px solid ${cfg.color}`,
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    {/* Left: ชื่อ + หมวด */}
                    <Box flex={1} minWidth={0}>
                      <Typography
                        sx={{
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          color: "#1f2937",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </Typography>
                      {item.category && (
                        <Typography sx={{ fontSize: "0.9rem", color: "#94a3b8", mt: 0.25 }}>
                          {item.category}
                        </Typography>
                      )}
                      <Chip
                        label={`${cfg.icon} ${cfg.label}`}
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: cfg.bg,
                          color: cfg.color,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          height: 26,
                        }}
                      />
                    </Box>

                    {/* Right: จำนวน */}
                    <Box
                      sx={{
                        ml: 2,
                        flexShrink: 0,
                        textAlign: "center",
                        bgcolor: cfg.bg,
                        borderRadius: "16px",
                        px: 2.5,
                        py: 1.5,
                        minWidth: 72,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "2rem",
                          fontWeight: 900,
                          color: cfg.color,
                          lineHeight: 1,
                        }}
                      >
                        {item.current_stock}
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", color: cfg.color, fontWeight: 600, mt: 0.25 }}>
                        {item.unit}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
