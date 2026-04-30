"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Card, CircularProgress, Avatar, Chip } from "@mui/material";
import { useRouter } from "@/i18n/routing";
import { useLiff } from "@/contexts/LiffContext";
import { supabase, Transaction } from "@/lib/supabase";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Mode = "stock" | "rental";

export default function HomePage() {
  const router = useRouter();
  const { profile, isLoading: liffLoading } = useLiff();
  const [mode, setMode] = useState<Mode>("stock");
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    setLoadingTx(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4);
    setRecentTx(data || []);
    setLoadingTx(false);
  };

  if (liffLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, bgcolor: "#f0fdf4" }}>
        <CircularProgress sx={{ color: "#16a34a" }} size={48} />
        <Typography sx={{ fontSize: "1.2rem", color: "#16a34a", fontWeight: 600 }}>กำลังเชื่อมต่อ LINE...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: mode === "stock" ? "#f0fdf4" : "#faf5ff", pb: "120px" }}>
      {/* Header */}
      <Box
        sx={{
          background: mode === "stock"
            ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
            : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          px: 3, pt: 5, pb: 3,
          borderRadius: "0 0 32px 32px",
          boxShadow: mode === "stock"
            ? "0 4px 20px rgba(22,163,74,0.3)"
            : "0 4px 20px rgba(124,58,237,0.3)",
          transition: "background 0.3s",
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
          {profile?.pictureUrl ? (
            <Avatar src={profile.pictureUrl} alt={profile.displayName} sx={{ width: 52, height: 52, border: "3px solid rgba(255,255,255,0.8)" }} />
          ) : (
            <Avatar sx={{ width: 52, height: 52, bgcolor: "rgba(255,255,255,0.3)", fontSize: "1.4rem" }}>👤</Avatar>
          )}
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>สวัสดี</Typography>
            <Typography sx={{ color: "white", fontSize: "1.25rem", fontWeight: 700 }}>
              {profile?.displayName || "คุณแม่"}
            </Typography>
          </Box>
        </Box>

        {/* Mode Selector */}
        <Box
          sx={{
            display: "flex",
            bgcolor: "rgba(0,0,0,0.2)",
            borderRadius: "20px",
            p: 0.75,
            gap: 0.75,
          }}
        >
          {[
            { key: "stock", label: "📦 สต๊อกของ" },
            { key: "rental", label: "🏠 ค่าเช่า" },
          ].map((m) => (
            <Box
              key={m.key}
              onClick={() => setMode(m.key as Mode)}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1.25,
                borderRadius: "14px",
                bgcolor: mode === m.key ? "rgba(255,255,255,0.95)" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: mode === m.key
                    ? (m.key === "stock" ? "#16a34a" : "#7c3aed")
                    : "rgba(255,255,255,0.75)",
                }}
              >
                {m.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Content by mode */}
      <Box sx={{ px: 3, mt: 3.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {mode === "stock" ? (
          <>
            <ActionCard
              emoji="📦" title="รับของเข้า" subtitle="บันทึกสินค้าที่เพิ่มเข้าคลัง"
              color1="#16a34a" color2="#22c55e" shadow="rgba(22,163,74,0.35)"
              onClick={() => router.push("/receive")}
            />
            <ActionCard
              emoji="🛒" title="เบิกของออก" subtitle="บันทึกสินค้าที่นำออกจากคลัง"
              color1="#dc2626" color2="#ef4444" shadow="rgba(220,38,38,0.35)"
              onClick={() => router.push("/withdraw")}
            />
            <ActionCard
              emoji="📊" title="ดูสต๊อกสินค้า" subtitle="ตรวจสอบของคงเหลือในคลัง"
              color1="#1e40af" color2="#2563eb" shadow="rgba(29,78,216,0.25)"
              onClick={() => router.push("/stock")}
            />

            {/* Recent stock transactions */}
            <Box mt={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151" }}>รายการล่าสุด</Typography>
                <Typography onClick={() => router.push("/history")} sx={{ fontSize: "0.95rem", color: "#16a34a", fontWeight: 600, cursor: "pointer" }}>
                  ดูทั้งหมด →
                </Typography>
              </Box>
              {loadingTx ? (
                <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} sx={{ color: "#16a34a" }} /></Box>
              ) : recentTx.length === 0 ? (
                <Card sx={{ borderRadius: "16px", p: 3, textAlign: "center", bgcolor: "white", border: "2px dashed #e2e8f0" }}>
                  <Typography sx={{ fontSize: "1rem", color: "#94a3b8" }}>ยังไม่มีรายการ</Typography>
                </Card>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {recentTx.map((tx) => (
                    <Card key={tx.id} sx={{ borderRadius: "14px", p: 2, bgcolor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: tx.type === "receive" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        {tx.type === "receive" ? "📦" : "🛒"}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography sx={{ fontSize: "1rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.item_name}</Typography>
                        <Typography sx={{ fontSize: "0.82rem", color: "#9ca3af" }}>
                          {format(new Date(tx.created_at), "d MMM HH:mm", { locale: th })}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: tx.type === "receive" ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                        {tx.type === "receive" ? "+" : "-"}{tx.quantity}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          </>
        ) : (
          <>
            <ActionCard
              emoji="🏠" title="รายการห้อง/บ้าน" subtitle="ดูสถานะผู้เช่าทั้งหมด"
              color1="#7c3aed" color2="#8b5cf6" shadow="rgba(124,58,237,0.35)"
              onClick={() => router.push("/rental")}
            />
            <ActionCard
              emoji="⚡" title="บันทึกค่าไฟ" subtitle="จดมิตเตอร์และคำนวณค่าไฟรายเดือน"
              color1="#d97706" color2="#f59e0b" shadow="rgba(217,119,6,0.35)"
              onClick={() => router.push("/rental/electricity")}
            />
            <ActionCard
              emoji="📋" title="ประวัติค่าเช่า/ค่าไฟ" subtitle="รายการเก็บเงินและสถานะการชำระ"
              color1="#0891b2" color2="#06b6d4" shadow="rgba(8,145,178,0.25)"
              onClick={() => router.push("/rental/history")}
            />
          </>
        )}
      </Box>

      {/* Bottom Nav */}
      <Box sx={{ position: "fixed", bottom: 0, left: 0, right: 0, bgcolor: "white", borderTop: "1px solid #e2e8f0", display: "flex", py: 1.5, px: 1, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        {[
          { icon: "🏠", label: "หน้าหลัก", path: "/" },
          { icon: "📦", label: "รับของ",   path: "/receive" },
          { icon: "🛒", label: "เบิกของ",  path: "/withdraw" },
          { icon: "⚡", label: "ค่าไฟ",    path: "/rental/electricity" },
          { icon: "📊", label: "สต๊อก",    path: "/stock" },
        ].map((nav) => (
          <Box
            key={nav.path}
            onClick={() => router.push(nav.path as any)}
            sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.4, cursor: "pointer", py: 0.5, borderRadius: "10px" }}
          >
            <Typography sx={{ fontSize: "1.3rem", lineHeight: 1 }}>{nav.icon}</Typography>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 500, color: "#9ca3af" }}>{nav.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ActionCard({ emoji, title, subtitle, color1, color2, shadow, onClick }: {
  emoji: string; title: string; subtitle: string;
  color1: string; color2: string; shadow: string;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
        borderRadius: "22px", p: 3.5, cursor: "pointer",
        boxShadow: `0 8px 28px ${shadow}`,
        transition: "transform 0.15s",
        "&:active": { transform: "scale(0.97)" },
        display: "flex", alignItems: "center", gap: 2.5,
      }}
    >
      <Box sx={{ width: 64, height: 64, bgcolor: "rgba(255,255,255,0.22)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }}>
        {emoji}
      </Box>
      <Box>
        <Typography sx={{ color: "white", fontSize: "1.55rem", fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: "0.92rem", mt: 0.4 }}>{subtitle}</Typography>
      </Box>
    </Card>
  );
}
