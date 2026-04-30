"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Card, CircularProgress, IconButton, Chip, TextField, Button, Snackbar, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Reading = {
  id: string; unit_name: string; reading_month: string;
  previous_reading: number; current_reading: number; units_used: number;
  electricity_rate: number; electricity_cost: number;
  water_previous_reading: number; water_current_reading: number; water_units_used: number;
  water_rate: number; water_cost: number;
  rent_amount: number; total_amount: number;
  is_paid: boolean; paid_date: string | null; notes: string | null;
  recorded_by: string | null; created_at: string;
};

export default function RentalHistoryPage() {
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({ open: false, msg: "", severity: "success" });

  useEffect(() => { loadReadings(); }, [filterMonth]);

  const loadReadings = async () => {
    setLoading(true);
    const { data } = await supabase.from("meter_readings")
      .select("*").eq("reading_month", filterMonth)
      .order("unit_name");
    setReadings(data || []);
    setLoading(false);
  };

  const togglePaid = async (r: Reading) => {
    const newPaid = !r.is_paid;
    await supabase.from("meter_readings").update({
      is_paid: newPaid,
      paid_date: newPaid ? new Date().toISOString() : null,
    }).eq("id", r.id);
    setSnack({ open: true, msg: newPaid ? `${r.unit_name} — รับเงินแล้ว ✅` : `${r.unit_name} — ยังไม่ได้รับเงิน`, severity: "success" });
    loadReadings();
  };

  const totalAll    = readings.reduce((s, r) => s + r.total_amount, 0);
  const totalPaid   = readings.filter(r => r.is_paid).reduce((s, r) => s + r.total_amount, 0);
  const totalUnpaid = totalAll - totalPaid;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#ecfeff", pb: 4 }}>
      {/* Header */}
      <Box sx={{ background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", px: 2, pt: 4, pb: 3, borderRadius: "0 0 28px 28px", boxShadow: "0 4px 20px rgba(8,145,178,0.3)" }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={() => router.push("/")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)" }}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>📋 ประวัติค่าเช่า/ค่าไฟ/ค่าน้ำ</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>กดที่รายการเพื่อเปลี่ยนสถานะชำระ</Typography>
          </Box>
        </Box>

        {!loading && (
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Chip label={`รวม ฿${totalAll.toLocaleString()}`} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 800, fontSize: "0.9rem" }} />
            <Chip label={`✅ ได้แล้ว ฿${totalPaid.toLocaleString()}`} sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 800, fontSize: "0.9rem" }} />
            {totalUnpaid > 0 && <Chip label={`⏳ ค้าง ฿${totalUnpaid.toLocaleString()}`} sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontWeight: 800, fontSize: "0.9rem" }} />}
          </Box>
        )}
      </Box>

      <Box sx={{ px: 3, mt: 3 }}>
        <TextField
          fullWidth type="month" value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          sx={{ mb: 3, "& .MuiOutlinedInput-root": { bgcolor: "white", borderRadius: "16px", fontSize: "1.05rem" } }}
          label="เลือกเดือน"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: "#0891b2" }} size={40} /></Box>
        ) : readings.length === 0 ? (
          <Card sx={{ borderRadius: "20px", p: 5, textAlign: "center", bgcolor: "white", border: "2px dashed #e2e8f0" }}>
            <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>📭</Typography>
            <Typography sx={{ fontSize: "1.1rem", color: "#94a3b8", fontWeight: 600 }}>ยังไม่มีข้อมูลเดือนนี้</Typography>
            <Button onClick={() => router.push("/rental/electricity")} variant="outlined" sx={{ mt: 2, borderRadius: "12px", fontSize: "1rem" }}>
              ⚡ บันทึกค่าไฟ-ค่าน้ำ
            </Button>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {readings.map((r) => {
              const hasElec  = r.electricity_rate > 0;
              const hasWater = r.water_rate > 0;
              return (
                <Card
                  key={r.id}
                  onClick={() => togglePaid(r)}
                  sx={{
                    borderRadius: "18px", p: 3, bgcolor: "white",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    borderLeft: `5px solid ${r.is_paid ? "#16a34a" : "#f59e0b"}`,
                    cursor: "pointer", transition: "transform 0.15s",
                    "&:active": { transform: "scale(0.98)" },
                    opacity: r.is_paid ? 0.85 : 1,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: "#1f2937" }}>{r.unit_name}</Typography>
                      {hasElec && (
                        <Typography sx={{ fontSize: "0.85rem", color: "#64748b", mt: 0.25 }}>
                          ⚡ {r.previous_reading} → {r.current_reading} ({r.units_used} หน่วย)
                        </Typography>
                      )}
                      {hasWater && (
                        <Typography sx={{ fontSize: "0.85rem", color: "#64748b", mt: 0.1 }}>
                          💧 {r.water_previous_reading} → {r.water_current_reading} ({r.water_units_used} หน่วย)
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={r.is_paid ? "✅ รับแล้ว" : "⏳ ค้างชำระ"}
                      sx={{
                        bgcolor: r.is_paid ? "#dcfce7" : "#fef3c7",
                        color: r.is_paid ? "#16a34a" : "#d97706",
                        fontWeight: 800, fontSize: "0.85rem",
                      }}
                    />
                  </Box>

                  {/* รายละเอียด */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: "12px" }}>
                    {hasElec && (
                      <Box display="flex" justifyContent="space-between" mb={0.75}>
                        <Typography sx={{ fontSize: "0.95rem", color: "#64748b" }}>⚡ ค่าไฟ ({r.electricity_rate} × {r.units_used})</Typography>
                        <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#d97706" }}>฿{r.electricity_cost.toLocaleString()}</Typography>
                      </Box>
                    )}
                    {hasWater && (
                      <Box display="flex" justifyContent="space-between" mb={0.75}>
                        <Typography sx={{ fontSize: "0.95rem", color: "#64748b" }}>💧 ค่าน้ำ ({r.water_rate} × {r.water_units_used})</Typography>
                        <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#0891b2" }}>฿{r.water_cost.toLocaleString()}</Typography>
                      </Box>
                    )}
                    <Box display="flex" justifyContent="space-between" mb={0.75}>
                      <Typography sx={{ fontSize: "0.95rem", color: "#64748b" }}>🏠 ค่าเช่า</Typography>
                      <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#7c3aed" }}>฿{r.rent_amount.toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography sx={{ fontSize: "1.05rem", fontWeight: 800 }}>รวม</Typography>
                      <Typography sx={{ fontSize: "1.4rem", fontWeight: 900, color: r.is_paid ? "#16a34a" : "#1f2937" }}>
                        ฿{r.total_amount.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {r.notes && (
                    <Typography sx={{ fontSize: "0.85rem", color: "#94a3b8", mt: 1.5, fontStyle: "italic" }}>
                      "{r.notes}"
                    </Typography>
                  )}
                  {r.is_paid && r.paid_date && (
                    <Typography sx={{ fontSize: "0.8rem", color: "#16a34a", mt: 0.75, fontWeight: 600 }}>
                      ✅ รับเงินเมื่อ {format(new Date(r.paid_date), "d MMM HH:mm", { locale: th })}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1", mt: 0.5 }}>
                    บันทึกโดย {r.recorded_by || "ไม่ระบุ"} • {format(new Date(r.created_at), "d MMM HH:mm", { locale: th })}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} sx={{ fontSize: "1rem", borderRadius: "12px", fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
