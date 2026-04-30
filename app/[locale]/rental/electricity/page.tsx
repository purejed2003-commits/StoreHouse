"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CircularProgress, IconButton,
  TextField, Button, Snackbar, Alert, Divider, Chip, MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BoltIcon from "@mui/icons-material/Bolt";
import { useRouter } from "@/i18n/routing";
import { useLiff } from "@/contexts/LiffContext";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Unit = { id: string; name: string; type: string; rent_price: number; electricity_rate: number; tenant_name: string | null; is_occupied: boolean };
type LastReading = { current_reading: number; reading_month: string } | null;

export default function ElectricityPage() {
  const router = useRouter();
  const { profile } = useLiff();

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [lastReading, setLastReading] = useState<LastReading>(null);
  const [currentReading, setCurrentReading] = useState("");
  const [readingMonth, setReadingMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "warning" }>({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    supabase.from("units").select("*").eq("is_occupied", true).neq("electricity_rate", 0).order("sort_order")
      .then(({ data }) => { setUnits(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedUnit) { setLastReading(null); return; }
    supabase.from("meter_readings").select("current_reading, reading_month")
      .eq("unit_id", selectedUnit.id)
      .order("reading_month", { ascending: false })
      .limit(1)
      .then(({ data }) => setLastReading(data?.[0] || null));
  }, [selectedUnit]);

  const prevReading = lastReading?.current_reading ?? 0;
  const currNum = parseFloat(currentReading) || 0;
  const unitsUsed = Math.max(0, currNum - prevReading);
  const electricityCost = unitsUsed * (selectedUnit?.electricity_rate || 0);
  const rentAmount = selectedUnit?.rent_price || 0;
  const totalAmount = electricityCost + rentAmount;

  const handleSave = async () => {
    if (!selectedUnit) { setSnack({ open: true, msg: "กรุณาเลือกห้อง", severity: "error" }); return; }
    if (!currentReading || currNum <= prevReading) {
      setSnack({ open: true, msg: `เลขมิตเตอร์ต้องมากกว่าเดือนก่อน (${prevReading})`, severity: "error" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("meter_readings").upsert({
      unit_id: selectedUnit.id,
      unit_name: selectedUnit.name,
      reading_month: readingMonth,
      current_reading: currNum,
      previous_reading: prevReading,
      units_used: unitsUsed,
      electricity_rate: selectedUnit.electricity_rate,
      electricity_cost: electricityCost,
      rent_amount: rentAmount,
      total_amount: totalAmount,
      notes: notes.trim() || null,
      recorded_by: profile?.displayName || "ไม่ระบุ",
      is_paid: false,
    }, { onConflict: "unit_id,reading_month" });

    if (error) {
      setSnack({ open: true, msg: "เกิดข้อผิดพลาด: " + error.message, severity: "error" });
    } else {
      setSnack({ open: true, msg: `บันทึก ${selectedUnit.name} สำเร็จ! ยอด ฿${totalAmount.toLocaleString()}`, severity: "success" });
      setCurrentReading(""); setNotes(""); setSelectedUnit(null); setLastReading(null);
    }
    setSaving(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fffbeb", pb: 4 }}>
      {/* Header */}
      <Box sx={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", px: 2, pt: 4, pb: 3, borderRadius: "0 0 28px 28px", boxShadow: "0 4px 20px rgba(217,119,6,0.35)" }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => router.push("/")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)" }}><ArrowBackIcon /></IconButton>
          <Box>
            <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>⚡ บันทึกค่าไฟ</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
              เดือน {format(new Date(readingMonth + "-01"), "MMMM yyyy", { locale: th })}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* เลือกเดือน */}
        <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: "#374151", mb: 2 }}>เลือกเดือนที่บันทึก</Typography>
          <TextField
            fullWidth type="month" value={readingMonth}
            onChange={e => setReadingMonth(e.target.value)}
            InputProps={{ sx: { fontSize: "1.1rem", borderRadius: "12px" } }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Card>

        {/* เลือกห้อง */}
        <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: "#374151", mb: 2 }}>เลือกห้อง / บ้าน</Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" py={2}><CircularProgress size={28} sx={{ color: "#d97706" }} /></Box>
          ) : (
            <TextField
              select fullWidth value={selectedUnit?.id || ""}
              onChange={e => { const u = units.find(x => x.id === e.target.value) || null; setSelectedUnit(u); setCurrentReading(""); }}
              InputProps={{ sx: { fontSize: "1.1rem", borderRadius: "12px" } }}
              label="เลือกห้อง"
            >
              <MenuItem value="">-- เลือกห้อง --</MenuItem>
              {units.map(u => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} {u.tenant_name ? `(${u.tenant_name})` : ""} — {u.electricity_rate} บ./หน่วย
                </MenuItem>
              ))}
            </TextField>
          )}

          {selectedUnit && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "#fef3c7", borderRadius: "12px", border: "1px solid #fde68a" }}>
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#92400e" }}>
                📌 {selectedUnit.name} {selectedUnit.tenant_name ? `— ${selectedUnit.tenant_name}` : ""}
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "#b45309", mt: 0.5 }}>
                มิตเตอร์เดือนก่อน: <strong>{prevReading}</strong> หน่วย
                {lastReading ? ` (${lastReading.reading_month})` : " (ยังไม่มีข้อมูล — ใส่ 0)"}
              </Typography>
            </Box>
          )}
        </Card>

        {/* กรอกมิตเตอร์ */}
        {selectedUnit && (
          <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: "#374151", mb: 2 }}>เลขมิตเตอร์เดือนนี้</Typography>
            <TextField
              fullWidth type="number" label="เลขมิตเตอร์ปัจจุบัน" value={currentReading}
              onChange={e => setCurrentReading(e.target.value)}
              placeholder={`มากกว่า ${prevReading}`}
              InputProps={{ sx: { fontSize: "1.4rem", fontWeight: 700, borderRadius: "12px" } }}
              slotProps={{ htmlInput: { style: { textAlign: "center", fontSize: "1.8rem", fontWeight: 800 } } }}
            />

            {/* ผลการคำนวณ */}
            {currentReading && currNum > prevReading && (
              <Box sx={{ mt: 2.5, p: 2.5, bgcolor: "#f0fdf4", borderRadius: "16px", border: "2px solid #bbf7d0" }}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#166534", mb: 2 }}>📊 ผลการคำนวณ</Typography>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography sx={{ fontSize: "1rem", color: "#374151" }}>หน่วยที่ใช้</Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>{unitsUsed} หน่วย</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography sx={{ fontSize: "1rem", color: "#374151" }}>ค่าไฟ ({selectedUnit.electricity_rate} × {unitsUsed})</Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#d97706" }}>฿{electricityCost.toLocaleString()}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography sx={{ fontSize: "1rem", color: "#374151" }}>ค่าเช่า</Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#7c3aed" }}>฿{rentAmount.toLocaleString()}</Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#1f2937" }}>รวมทั้งหมด</Typography>
                  <Typography sx={{ fontSize: "1.8rem", fontWeight: 900, color: "#16a34a" }}>
                    ฿{totalAmount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}
          </Card>
        )}

        {/* หมายเหตุ */}
        {selectedUnit && (
          <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: "#374151", mb: 2 }}>หมายเหตุ (ถ้ามี)</Typography>
            <TextField fullWidth multiline rows={2} placeholder="เช่น ผู้เช่าขอผ่อน, ชำระเงินสดแล้ว" value={notes} onChange={e => setNotes(e.target.value)} InputProps={{ sx: { fontSize: "1rem", borderRadius: "12px" } }} />
          </Card>
        )}

        {/* Save */}
        {selectedUnit && (
          <Button
            fullWidth variant="contained" size="large" onClick={handleSave} disabled={saving || !currentReading || currNum <= prevReading}
            sx={{ py: 2.5, fontSize: "1.25rem", fontWeight: 800, borderRadius: "20px", bgcolor: "#d97706", boxShadow: "0 6px 24px rgba(217,119,6,0.4)", "&:hover": { bgcolor: "#b45309" }, "&:disabled": { bgcolor: "#d1d5db" } }}
          >
            {saving ? <Box display="flex" alignItems="center" gap={1.5}><CircularProgress size={22} sx={{ color: "white" }} />กำลังบันทึก...</Box>
              : <>⚡ บันทึกค่าไฟ — ฿{totalAmount.toLocaleString()}</>}
          </Button>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} sx={{ fontSize: "1rem", borderRadius: "12px", fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
