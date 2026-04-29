"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CircularProgress, IconButton,
  TextField, InputAdornment, Chip, LinearProgress,
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

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
  );

  const getStockStatus = (item: Item) => {
    const threshold = item.low_stock_threshold || 5;
    if (item.current_stock <= 0) return "out";
    if (item.current_stock <= threshold) return "low";
    return "ok";
  };

  const statusConfig = {
    out: { color: "#dc2626", bg: "#fee2e2", label: "หมดแล้ว", icon: "❌" },
    low: { color: "#ea580c", bg: "#fff7ed", label: "ใกล้หมด", icon: "⚠️" },
    ok: { color: "#16a34a", bg: "#dcfce7", label: "พอเพียง", icon: "✅" },
  };

  const outOfStock = filtered.filter((i) => getStockStatus(i) === "out").length;
  const lowStock = filtered.filter((i) => getStockStatus(i) === "low").length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eff6ff", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
          px: 2,
          pt: 4,
          pb: 3,
          borderRadius: "0 0 28px 28px",
          boxShadow: "0 4px 20px rgba(29,78,216,0.3)",
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={() => router.push("/")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>
              📊 สต๊อกสินค้า
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
              รายการสินค้าทั้งหมดในคลัง
            </Typography>
          </Box>
        </Box>

        {/* Summary chips */}
        {!loading && (
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Chip
              label={`ทั้งหมด ${filtered.length} รายการ`}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700, fontSize: "0.9rem" }}
            />
            {outOfStock > 0 && (
              <Chip
                label={`❌ หมด ${outOfStock}`}
                sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: "0.9rem" }}
              />
            )}
            {lowStock > 0 && (
              <Chip
                label={`⚠️ ใกล้หมด ${lowStock}`}
                sx={{ bgcolor: "#fff7ed", color: "#ea580c", fontWeight: 700, fontSize: "0.9rem" }}
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
            mb: 3,
            "& .MuiOutlinedInput-root": {
              bgcolor: "white",
              borderRadius: "16px",
              fontSize: "1.05rem",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af", fontSize: "1.4rem" }} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: "#1e40af" }} size={40} />
          </Box>
        ) : filtered.length === 0 ? (
          <Card
            sx={{
              borderRadius: "20px",
              p: 5,
              textAlign: "center",
              bgcolor: "white",
              border: "2px dashed #e2e8f0",
            }}
          >
            <Typography sx={{ fontSize: "3rem", mb: 2 }}>📭</Typography>
            <Typography sx={{ fontSize: "1.2rem", color: "#94a3b8", fontWeight: 600 }}>
              {search ? "ไม่พบสินค้าที่ค้นหา" : "ยังไม่มีสินค้าในคลัง"}
            </Typography>
            {!search && (
              <Typography sx={{ fontSize: "1rem", color: "#cbd5e1", mt: 1 }}>
                เริ่มบันทึกรับของเข้าเพื่อเพิ่มสินค้า
              </Typography>
            )}
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map((item) => {
              const status = getStockStatus(item);
              const cfg = statusConfig[status];
              const threshold = item.low_stock_threshold || 5;
              const maxVal = Math.max(item.current_stock, threshold * 3, 10);
              const pct = Math.min(100, (item.current_stock / maxVal) * 100);

              return (
                <Card
                  key={item.id}
                  onClick={() => router.push("/receive")}
                  sx={{
                    borderRadius: "20px",
                    p: 3,
                    bgcolor: "white",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    transition: "transform 0.15s",
                    "&:active": { transform: "scale(0.98)" },
                    borderLeft: `4px solid ${cfg.color}`,
                  }}
                >
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                    <Box flex={1} minWidth={0}>
                      <Typography
                        sx={{
                          fontSize: "1.15rem",
                          fontWeight: 700,
                          color: "#1f2937",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </Typography>
                      {item.category && (
                        <Typography sx={{ fontSize: "0.85rem", color: "#94a3b8", mt: 0.25 }}>
                          {item.category}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0, ml: 2 }}>
                      <Typography
                        sx={{
                          fontSize: "1.6rem",
                          fontWeight: 800,
                          color: cfg.color,
                          lineHeight: 1,
                        }}
                      >
                        {item.current_stock}
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                        {item.unit}
                      </Typography>
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "#f1f5f9",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: cfg.color,
                        borderRadius: 4,
                      },
                    }}
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Chip
                      label={`${cfg.icon} ${cfg.label}`}
                      size="small"
                      sx={{
                        bgcolor: cfg.bg,
                        color: cfg.color,
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        height: 24,
                      }}
                    />
                    {item.barcode && (
                      <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1", fontFamily: "monospace" }}>
                        {item.barcode}
                      </Typography>
                    )}
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
