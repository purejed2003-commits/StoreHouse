"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CircularProgress, IconButton, Chip,
  Tabs, Tab, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "@/i18n/routing";
import { supabase, Transaction } from "@/lib/supabase";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "receive" | "withdraw">("all");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setTransactions(data || []);
    setLoading(false);
  };

  const filtered = transactions.filter((tx) => {
    if (tab === "all") return true;
    return tx.type === tab;
  });

  const groupByDate = (txs: Transaction[]) => {
    const groups: { date: string; items: Transaction[] }[] = [];
    txs.forEach((tx) => {
      const dateStr = format(new Date(tx.created_at), "d MMMM yyyy", { locale: th });
      const existing = groups.find((g) => g.date === dateStr);
      if (existing) existing.items.push(tx);
      else groups.push({ date: dateStr, items: [tx] });
    });
    return groups;
  };

  const grouped = groupByDate(filtered);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
          px: 2,
          pt: 4,
          pb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderRadius: "0 0 28px 28px",
          boxShadow: "0 4px 20px rgba(29,78,216,0.3)",
        }}
      >
        <IconButton onClick={() => router.push("/")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>
            📋 ประวัติรายการ
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
            รายการรับและเบิกของทั้งหมด
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 3, mt: 3 }}>
        <Card sx={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                fontSize: "1rem",
                fontWeight: 600,
                py: 1.75,
              },
              "& .Mui-selected": { color: "#1e40af" },
              "& .MuiTabs-indicator": { bgcolor: "#1e40af", height: 3 },
            }}
          >
            <Tab label="ทั้งหมด" value="all" />
            <Tab label="📦 รับเข้า" value="receive" />
            <Tab label="🛒 เบิกออก" value="withdraw" />
          </Tabs>
        </Card>
      </Box>

      {/* Content */}
      <Box sx={{ px: 3, mt: 3 }}>
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
              ยังไม่มีรายการ
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {grouped.map((group) => (
              <Box key={group.date}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#64748b",
                      bgcolor: "#e2e8f0",
                      px: 2,
                      py: 0.5,
                      borderRadius: "20px",
                    }}
                  >
                    {group.date}
                  </Typography>
                  <Chip
                    label={`${group.items.length} รายการ`}
                    size="small"
                    sx={{ fontSize: "0.8rem", bgcolor: "#f1f5f9", color: "#64748b" }}
                  />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {group.items.map((tx) => (
                    <Card
                      key={tx.id}
                      sx={{
                        borderRadius: "16px",
                        p: 2.5,
                        bgcolor: "white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        borderLeft: `4px solid ${tx.type === "receive" ? "#16a34a" : "#dc2626"}`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: "14px",
                          bgcolor: tx.type === "receive" ? "#dcfce7" : "#fee2e2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          flexShrink: 0,
                        }}
                      >
                        {tx.type === "receive" ? "📦" : "🛒"}
                      </Box>

                      <Box flex={1} minWidth={0}>
                        <Typography
                          sx={{
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            color: "#1f2937",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tx.item_name}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                          {tx.line_picture_url ? (
                            <Avatar src={tx.line_picture_url} sx={{ width: 18, height: 18 }} />
                          ) : (
                            <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
                              👤
                            </Box>
                          )}
                          <Typography sx={{ fontSize: "0.85rem", color: "#6b7280" }}>
                            {tx.line_display_name || "ไม่ระบุ"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                            • {format(new Date(tx.created_at), "HH:mm น.")}
                          </Typography>
                        </Box>

                        {tx.notes && (
                          <Typography
                            sx={{
                              fontSize: "0.85rem",
                              color: "#94a3b8",
                              mt: 0.5,
                              fontStyle: "italic",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            "{tx.notes}"
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "1.3rem",
                            fontWeight: 800,
                            color: tx.type === "receive" ? "#16a34a" : "#dc2626",
                            lineHeight: 1,
                          }}
                        >
                          {tx.type === "receive" ? "+" : "-"}{tx.quantity}
                        </Typography>
                        <Chip
                          label={tx.type === "receive" ? "รับเข้า" : "เบิกออก"}
                          size="small"
                          sx={{
                            bgcolor: tx.type === "receive" ? "#dcfce7" : "#fee2e2",
                            color: tx.type === "receive" ? "#16a34a" : "#dc2626",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            height: 20,
                            mt: 0.75,
                          }}
                        />
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
