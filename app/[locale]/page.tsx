"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Card, CircularProgress, Avatar, Chip } from "@mui/material";
import { useRouter } from "@/i18n/routing";
import { useLiff } from "@/contexts/LiffContext";
import { supabase, Transaction } from "@/lib/supabase";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export default function HomePage() {
  const router = useRouter();
  const { profile, isLoading: liffLoading } = useLiff();
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
      .limit(5);
    setRecentTx(data || []);
    setLoadingTx(false);
  };

  if (liffLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          bgcolor: "#f0fdf4",
        }}
      >
        <CircularProgress sx={{ color: "#16a34a" }} size={48} />
        <Typography sx={{ fontSize: "1.2rem", color: "#16a34a", fontWeight: 600 }}>
          กำลังเชื่อมต่อ LINE...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f0fdf4",
        pb: "120px",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
          px: 3,
          pt: 5,
          pb: 4,
          borderRadius: "0 0 32px 32px",
          boxShadow: "0 4px 20px rgba(22,163,74,0.3)",
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          {profile?.pictureUrl ? (
            <Avatar
              src={profile.pictureUrl}
              alt={profile.displayName}
              sx={{ width: 56, height: 56, border: "3px solid rgba(255,255,255,0.8)" }}
            />
          ) : (
            <Avatar sx={{ width: 56, height: 56, bgcolor: "rgba(255,255,255,0.3)", fontSize: "1.5rem" }}>
              👤
            </Avatar>
          )}
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem" }}>
              สวัสดี
            </Typography>
            <Typography sx={{ color: "white", fontSize: "1.3rem", fontWeight: 700 }}>
              {profile?.displayName || "คุณแม่"}
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{
            color: "white",
            fontSize: "1.6rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          🏪 คลังสินค้า
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "1rem", mt: 0.5 }}>
          ระบบจัดการสต๊อก ใช้งานง่าย
        </Typography>
      </Box>

      {/* Main Buttons */}
      <Box sx={{ px: 3, mt: 4, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* รับของเข้า */}
        <Card
          onClick={() => router.push("/receive")}
          sx={{
            background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
            borderRadius: "24px",
            p: 4,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(22,163,74,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
            "&:active": {
              transform: "scale(0.97)",
              boxShadow: "0 4px 16px rgba(22,163,74,0.25)",
            },
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              bgcolor: "rgba(255,255,255,0.25)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.2rem",
              flexShrink: 0,
            }}
          >
            📦
          </Box>
          <Box>
            <Typography
              sx={{
                color: "white",
                fontSize: "1.7rem",
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              รับของเข้า
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "1rem",
                mt: 0.5,
              }}
            >
              บันทึกสินค้าที่เพิ่มเข้าคลัง
            </Typography>
          </Box>
        </Card>

        {/* เบิกของออก */}
        <Card
          onClick={() => router.push("/withdraw")}
          sx={{
            background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
            borderRadius: "24px",
            p: 4,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(220,38,38,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
            "&:active": {
              transform: "scale(0.97)",
              boxShadow: "0 4px 16px rgba(220,38,38,0.25)",
            },
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              bgcolor: "rgba(255,255,255,0.25)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.2rem",
              flexShrink: 0,
            }}
          >
            🛒
          </Box>
          <Box>
            <Typography
              sx={{
                color: "white",
                fontSize: "1.7rem",
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              เบิกของออก
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "1rem",
                mt: 0.5,
              }}
            >
              บันทึกสินค้าที่นำออกจากคลัง
            </Typography>
          </Box>
        </Card>

        {/* ดูสต๊อก */}
        <Card
          onClick={() => router.push("/stock")}
          sx={{
            bgcolor: "white",
            borderRadius: "24px",
            p: 3.5,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            border: "2px solid #e2e8f0",
            transition: "transform 0.15s",
            "&:active": { transform: "scale(0.97)" },
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              bgcolor: "#eff6ff",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              flexShrink: 0,
            }}
          >
            📊
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e40af" }}>
              ดูสต๊อกสินค้า
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "#64748b", mt: 0.25 }}>
              ตรวจสอบของคงเหลือในคลัง
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* Recent Transactions */}
      <Box sx={{ px: 3, mt: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography sx={{ fontSize: "1.2rem", fontWeight: 700, color: "#374151" }}>
            รายการล่าสุด
          </Typography>
          <Typography
            onClick={() => router.push("/history")}
            sx={{
              fontSize: "1rem",
              color: "#16a34a",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ดูทั้งหมด →
          </Typography>
        </Box>

        {loadingTx ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={32} sx={{ color: "#16a34a" }} />
          </Box>
        ) : recentTx.length === 0 ? (
          <Card
            sx={{
              borderRadius: "16px",
              p: 4,
              textAlign: "center",
              bgcolor: "white",
              border: "2px dashed #e2e8f0",
            }}
          >
            <Typography sx={{ fontSize: "2rem", mb: 1 }}>📋</Typography>
            <Typography sx={{ fontSize: "1.1rem", color: "#94a3b8", fontWeight: 500 }}>
              ยังไม่มีรายการ
            </Typography>
            <Typography sx={{ fontSize: "0.95rem", color: "#cbd5e1", mt: 0.5 }}>
              เริ่มบันทึกรับหรือเบิกของได้เลย
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentTx.map((tx) => (
              <Card
                key={tx.id}
                sx={{
                  borderRadius: "16px",
                  p: 2.5,
                  bgcolor: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    bgcolor: tx.type === "receive" ? "#dcfce7" : "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
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
                  <Typography sx={{ fontSize: "0.9rem", color: "#6b7280", mt: 0.25 }}>
                    {tx.line_display_name || "ไม่ระบุชื่อ"} •{" "}
                    {format(new Date(tx.created_at), "d MMM HH:mm", { locale: th })}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color: tx.type === "receive" ? "#16a34a" : "#dc2626",
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
                      fontSize: "0.75rem",
                      height: 22,
                      mt: 0.5,
                    }}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Bottom Nav */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "white",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          py: 1.5,
          px: 2,
          gap: 1,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {[
          { icon: "🏠", label: "หน้าหลัก", path: "/" },
          { icon: "📦", label: "รับของ", path: "/receive" },
          { icon: "🛒", label: "เบิกของ", path: "/withdraw" },
          { icon: "📊", label: "สต๊อก", path: "/stock" },
          { icon: "📋", label: "ประวัติ", path: "/history" },
        ].map((nav) => (
          <Box
            key={nav.path}
            onClick={() => router.push(nav.path as any)}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
              py: 0.5,
              borderRadius: "12px",
              bgcolor: nav.path === "/" ? "#f0fdf4" : "transparent",
              transition: "background 0.15s",
            }}
          >
            <Typography sx={{ fontSize: "1.4rem", lineHeight: 1 }}>{nav.icon}</Typography>
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: nav.path === "/" ? 700 : 500,
                color: nav.path === "/" ? "#16a34a" : "#9ca3af",
              }}
            >
              {nav.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
