"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, TextField, Button, Card, CircularProgress,
  IconButton, Snackbar, Alert, Autocomplete,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useRouter } from "@/i18n/routing";
import { useLiff } from "@/contexts/LiffContext";
import { supabase, Item } from "@/lib/supabase";

export default function ReceivePage() {
  const router = useRouter();
  const { liff, profile } = useLiff();

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({
    open: false, msg: "", severity: "success",
  });

  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .order("name")
      .then(({ data }) => setItems(data || []));
  }, []);

  const handleScan = async () => {
    if (!liff) return;
    setScanning(true);
    try {
      const result = await liff.scanCodeV2();
      if (result?.value) {
        const found = items.find((i) => i.barcode === result.value);
        if (found) {
          setSelectedItem(found);
          setItemName(found.name);
          setUnit(found.unit);
        } else {
          setItemName(result.value);
        }
      }
    } catch {
      setSnack({ open: true, msg: "ไม่สามารถสแกนได้", severity: "error" });
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    const name = selectedItem?.name || itemName.trim();
    if (!name || quantity <= 0) {
      setSnack({ open: true, msg: "กรุณากรอกชื่อสินค้าและจำนวน", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      let itemId = selectedItem?.id;

      if (!itemId) {
        const { data: newItem, error: itemErr } = await supabase
          .from("items")
          .insert({ name, unit: unit || "ชิ้น", current_stock: 0 })
          .select()
          .single();
        if (itemErr) throw itemErr;
        itemId = newItem.id;
      }

      const { error: txErr } = await supabase.from("transactions").insert({
        item_id: itemId,
        item_name: name,
        type: "receive",
        quantity,
        notes: notes.trim() || null,
        line_user_id: profile?.userId || null,
        line_display_name: profile?.displayName || null,
        line_picture_url: profile?.pictureUrl || null,
      });
      if (txErr) throw txErr;

      const { error: stockErr } = await supabase.rpc("increment_stock", {
        p_item_id: itemId,
        p_quantity: quantity,
      });
      if (stockErr) {
        await supabase
          .from("items")
          .update({ current_stock: (selectedItem?.current_stock || 0) + quantity })
          .eq("id", itemId);
      }

      setSnack({ open: true, msg: `บันทึกรับของเข้า "${name}" ${quantity} ${unit || "ชิ้น"} สำเร็จ!`, severity: "success" });
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setSnack({ open: true, msg: "เกิดข้อผิดพลาด: " + err.message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0fdf4", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
          px: 2,
          pt: 4,
          pb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderRadius: "0 0 28px 28px",
          boxShadow: "0 4px 20px rgba(22,163,74,0.3)",
        }}
      >
        <IconButton onClick={() => router.push("/")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>
            📦 รับของเข้า
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
            บันทึกสินค้าที่เพิ่มเข้าคลัง
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 3, mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Scan Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={scanning ? <CircularProgress size={20} /> : <QrCodeScannerIcon />}
          onClick={handleScan}
          disabled={scanning || !liff}
          sx={{
            py: 2.5,
            fontSize: "1.15rem",
            fontWeight: 700,
            borderWidth: 2,
            borderColor: "#16a34a",
            color: "#16a34a",
            borderRadius: "16px",
            "&:hover": { borderWidth: 2, bgcolor: "#dcfce7" },
          }}
        >
          {scanning ? "กำลังสแกน..." : "สแกนบาร์โค้ด / QR"}
        </Button>

        {/* Item Name */}
        <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151", mb: 2 }}>
            ข้อมูลสินค้า
          </Typography>

          <Autocomplete<Item, false, false, true>
            options={items}
            getOptionLabel={(opt) => typeof opt === "string" ? opt : opt.name}
            value={selectedItem}
            onChange={(_, newVal) => {
              if (newVal && typeof newVal !== "string") {
                setSelectedItem(newVal);
                setItemName(newVal.name);
                setUnit(newVal.unit);
              } else {
                setSelectedItem(null);
              }
            }}
            freeSolo
            onInputChange={(_, val) => setItemName(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ชื่อสินค้า *"
                placeholder="เช่น น้ำตาล, แป้งสาลี, น้ำมันพืช"
                sx={{ mb: 2.5 }}
                InputProps={{
                  ...params.InputProps,
                  sx: { fontSize: "1.1rem", borderRadius: "12px" },
                }}
                InputLabelProps={{ sx: { fontSize: "1.05rem" } }}
              />
            )}
          />

          <TextField
            fullWidth
            label="หน่วย"
            placeholder="เช่น กก., ลิตร, ชิ้น, ถุง"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            sx={{ mb: 0 }}
            InputProps={{ sx: { fontSize: "1.1rem", borderRadius: "12px" } }}
            InputLabelProps={{ sx: { fontSize: "1.05rem" } }}
          />
        </Card>

        {/* Quantity */}
        <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151", mb: 2.5 }}>
            จำนวนที่รับเข้า
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" gap={3}>
            <IconButton
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              sx={{
                width: 60,
                height: 60,
                bgcolor: "#fee2e2",
                color: "#dc2626",
                fontSize: "1.5rem",
                "&:hover": { bgcolor: "#fecaca" },
              }}
            >
              <RemoveIcon sx={{ fontSize: "1.8rem" }} />
            </IconButton>

            <Box sx={{ textAlign: "center", minWidth: 100 }}>
              <Typography
                sx={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  color: "#16a34a",
                  lineHeight: 1,
                }}
              >
                {quantity}
              </Typography>
              <Typography sx={{ fontSize: "1rem", color: "#9ca3af", mt: 0.5 }}>
                {unit || "ชิ้น"}
              </Typography>
            </Box>

            <IconButton
              onClick={() => setQuantity((q) => q + 1)}
              sx={{
                width: 60,
                height: 60,
                bgcolor: "#dcfce7",
                color: "#16a34a",
                "&:hover": { bgcolor: "#bbf7d0" },
              }}
            >
              <AddIcon sx={{ fontSize: "1.8rem" }} />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            sx={{ mt: 2.5 }}
            slotProps={{ htmlInput: { min: 1, style: { textAlign: "center", fontSize: "1.2rem" } } }}
            InputProps={{ sx: { borderRadius: "12px" } }}
          />
        </Card>

        {/* Notes */}
        <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151", mb: 2 }}>
            หมายเหตุ (ถ้ามี)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="เช่น ซื้อจากตลาด, ล็อตใหม่, หมดอายุ 12/2026"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            InputProps={{ sx: { fontSize: "1.05rem", borderRadius: "12px" } }}
          />
        </Card>

        {/* Save Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={saving || !itemName.trim()}
          sx={{
            py: 2.5,
            fontSize: "1.3rem",
            fontWeight: 800,
            borderRadius: "20px",
            bgcolor: "#16a34a",
            boxShadow: "0 6px 24px rgba(22,163,74,0.4)",
            "&:hover": { bgcolor: "#15803d" },
            "&:disabled": { bgcolor: "#d1d5db", color: "#9ca3af" },
          }}
        >
          {saving ? (
            <Box display="flex" alignItems="center" gap={1.5}>
              <CircularProgress size={22} sx={{ color: "white" }} />
              กำลังบันทึก...
            </Box>
          ) : (
            "✅ บันทึกรับของเข้า"
          )}
        </Button>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ fontSize: "1rem", borderRadius: "12px", fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
