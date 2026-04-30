"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Card, CircularProgress, IconButton, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "@/i18n/routing";
import { supabase } from "@/lib/supabase";

type Unit = {
  id: string; name: string; type: "room" | "house" | "parking";
  rent_price: number; electricity_rate: number; water_rate: number;
  tenant_name: string | null; tenant_phone: string | null;
  is_occupied: boolean; sort_order: number;
};

const typeLabel = { room: "ห้องพัก", house: "บ้านเช่า", parking: "ที่จอดรถ" };
const typeIcon  = { room: "🚪", house: "🏡", parking: "🚗" };
const typeColor = { room: "#7c3aed", house: "#16a34a", parking: "#0891b2" };

export default function RentalPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [editName, setEditName] = useState("");
  const [editTenant, setEditTenant] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRent, setEditRent] = useState(0);
  const [editRate, setEditRate] = useState(8);
  const [editWaterRate, setEditWaterRate] = useState(16);
  const [editOccupied, setEditOccupied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUnits(); }, []);

  const loadUnits = async () => {
    setLoading(true);
    const { data } = await supabase.from("units").select("*").order("sort_order");
    setUnits(data || []);
    setLoading(false);
  };

  const openEdit = (u: Unit) => {
    setEditUnit(u);
    setEditName(u.name);
    setEditTenant(u.tenant_name || "");
    setEditPhone(u.tenant_phone || "");
    setEditRent(u.rent_price);
    setEditRate(u.electricity_rate);
    setEditWaterRate(u.water_rate);
    setEditOccupied(u.is_occupied);
  };

  const handleSave = async () => {
    if (!editUnit) return;
    setSaving(true);
    await supabase.from("units").update({
      name: editName,
      tenant_name: editTenant || null,
      tenant_phone: editPhone || null,
      rent_price: editRent,
      electricity_rate: editRate,
      water_rate: editWaterRate,
      is_occupied: editOccupied,
    }).eq("id", editUnit.id);
    setSaving(false);
    setEditUnit(null);
    loadUnits();
  };

  const occupied = units.filter(u => u.is_occupied).length;
  const rooms    = units.filter(u => u.type === "room");
  const houses   = units.filter(u => u.type === "house");
  const parkings = units.filter(u => u.type === "parking");

  const renderGroup = (list: Unit[], label: string) => {
    if (list.length === 0) return null;
    return (
      <Box mb={3}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#64748b", mb: 1.5, ml: 0.5 }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {list.map((u) => (
            <Card
              key={u.id}
              onClick={() => openEdit(u)}
              sx={{
                borderRadius: "18px", p: 2.5, bgcolor: "white",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                borderLeft: `5px solid ${u.is_occupied ? typeColor[u.type] : "#cbd5e1"}`,
                cursor: "pointer", transition: "transform 0.15s",
                "&:active": { transform: "scale(0.98)" },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: u.is_occupied ? `${typeColor[u.type]}18` : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                    {typeIcon[u.type]}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#1f2937" }}>{u.name}</Typography>
                    <Typography sx={{ fontSize: "0.9rem", color: u.is_occupied ? "#374151" : "#94a3b8", fontWeight: u.is_occupied ? 600 : 400 }}>
                      {u.is_occupied ? (u.tenant_name || "มีผู้เช่า") : "ว่าง"}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Chip
                    label={u.is_occupied ? "มีผู้เช่า" : "ว่าง"}
                    size="small"
                    sx={{
                      bgcolor: u.is_occupied ? "#dcfce7" : "#f1f5f9",
                      color: u.is_occupied ? "#16a34a" : "#94a3b8",
                      fontWeight: 700, fontSize: "0.8rem", height: 24, mb: 0.75,
                    }}
                  />
                  <Typography sx={{ fontSize: "0.88rem", color: "#64748b", display: "block" }}>
                    ฿{u.rent_price.toLocaleString()}
                  </Typography>
                  {u.electricity_rate > 0 && (
                    <Typography sx={{ fontSize: "0.78rem", color: "#f59e0b" }}>
                      ⚡{u.electricity_rate} 💧{u.water_rate} บ./หน่วย
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#faf5ff", pb: 4 }}>
      {/* Header */}
      <Box sx={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", px: 2, pt: 4, pb: 3, borderRadius: "0 0 28px 28px", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={() => router.push("/")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)" }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>🏠 รายการห้อง/บ้าน</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>กดที่ห้องเพื่อแก้ไขข้อมูล</Typography>
          </Box>
        </Box>
        {!loading && (
          <Box display="flex" gap={1.5}>
            <Chip label={`ทั้งหมด ${units.length}`} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700 }} />
            <Chip label={`มีผู้เช่า ${occupied}`} sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700 }} />
            <Chip label={`ว่าง ${units.length - occupied}`} sx={{ bgcolor: "#f1f5f9", color: "#64748b", fontWeight: 700 }} />
          </Box>
        )}
      </Box>

      <Box sx={{ px: 3, mt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: "#7c3aed" }} size={40} /></Box>
        ) : (
          <>
            {renderGroup(rooms, "🚪 ห้องพัก")}
            {renderGroup(houses, "🏡 บ้านเช่า")}
            {renderGroup(parkings, "🚗 ที่จอดรถ")}
          </>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={!!editUnit} onClose={() => setEditUnit(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.2rem" }}>✏️ แก้ไข — {editUnit?.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
          <TextField label="ชื่อห้อง/บ้าน" value={editName} onChange={e => setEditName(e.target.value)} fullWidth InputProps={{ sx: { fontSize: "1.05rem" } }} />
          <TextField
            select label="สถานะ" value={editOccupied ? "occupied" : "empty"}
            onChange={e => setEditOccupied(e.target.value === "occupied")} fullWidth
          >
            <MenuItem value="occupied">มีผู้เช่า</MenuItem>
            <MenuItem value="empty">ว่าง</MenuItem>
          </TextField>
          <TextField label="ชื่อผู้เช่า" value={editTenant} onChange={e => setEditTenant(e.target.value)} fullWidth placeholder="ชื่อ-นามสกุล" InputProps={{ sx: { fontSize: "1.05rem" } }} />
          <TextField label="เบอร์โทร" value={editPhone} onChange={e => setEditPhone(e.target.value)} fullWidth placeholder="0812345678" InputProps={{ sx: { fontSize: "1.05rem" } }} />
          <TextField label="ค่าเช่า (บาท/เดือน)" type="number" value={editRent} onChange={e => setEditRent(Number(e.target.value))} fullWidth InputProps={{ sx: { fontSize: "1.05rem" } }} />
          <TextField label="ค่าไฟ (บาท/หน่วย)" type="number" value={editRate} onChange={e => setEditRate(Number(e.target.value))} fullWidth helperText="ห้อง = 8, บ้าน = 16, ที่จอดรถ = 0" InputProps={{ sx: { fontSize: "1.05rem" } }} />
          <TextField label="ค่าน้ำ (บาท/หน่วย)" type="number" value={editWaterRate} onChange={e => setEditWaterRate(Number(e.target.value))} fullWidth helperText="ห้อง/บ้าน = 16, ที่จอดรถ = 0" InputProps={{ sx: { fontSize: "1.05rem" } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEditUnit(null)} sx={{ fontSize: "1rem" }}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ fontSize: "1rem", bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" } }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
