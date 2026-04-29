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

export default function WithdrawPage() {
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
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "warning" }>({
    open: false, msg: "", severity: "success",
  });

  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .gt("current_stock", 0)
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
          setSnack({ open: true, msg: "ไม่พบสินค้านี้ในคลัง", severity: "warning" });
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

    if (selectedItem && selectedItem.current_stock < quantity) {
      setSnack({
        open: true,
        msg: `สต๊อกไม่พอ! มีเหลืออยู่ ${selectedItem.current_stock} ${selectedItem.unit}`,
        severity: "warning",
      });
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
        type: "withdraw",
        quantity,
        notes: notes.trim() || null,
        line_user_id: profile?.userId || null,
        line_display_name: profile?.displayName || null,
        line_picture_url: profile?.pictureUrl || null,
      });
      if (txErr) throw txErr;

      const { error: stockErr } = await supabase.rpc("decrement_stock", {
        p_item_id: itemId,
        p_quantity: quantity,
      });
      if (stockErr && selectedItem) {
        await supabase
          .from("items")
          .update({ current_stock: Math.max(0, selectedItem.current_stock - quantity) })
          .eq("id", itemId);
      }

      setSnack({ open: true, msg: `บันทึกเบิก "${name}" ${quantity} ${unit || "ชิ้น"} สำเร็จ!`, severity: "success" });
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setSnack({ open: true, msg: "เกิดข้อผิดพลาด: " + err.message, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#fff5f5", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
          px: 2,
          pt: 4,
          pb: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderRadius: "0 0 28px 28px",
          boxShadow: "0 4px 20px rgba(220,38,38,0.3)",
        }}
      >
        <IconButton onClick={() => router.push("/")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography sx={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>
            🛒 เบิกของออก
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
            บันทึกสินค้าที่นำออกจากคลัง
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
            borderColor: "#dc2626",
            color: "#dc2626",
            borderRadius: "16px",
            "&:hover": { borderWidth: 2, bgcolor: "#fee2e2" },
          }}
        >
          {scanning ? "กำลังสแกน..." : "สแกนบาร์โค้ด / QR"}
        </Button>

        {/* Item Name */}
        <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151", mb: 2 }}>
            ข้อมูลสินค้า
          </Typography>

          <Autocomplete
            options={items}
            getOptionLabel={(opt) => typeof opt === "string" ? opt : `${opt.name} (คงเหลือ: ${opt.current_stock} ${opt.unit})`}
            value={selectedItem}
            onChange={(_, newVal) => {
              if (newVal && typeof newVal !== "string") {
                setSelectedItem(newVal);
                setItemName(newVal.name);
                setUnit(newVal.unit);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="ชื่อสินค้า *"
                placeholder="พิมพ์หรือเลือกสินค้าจากคลัง"
                sx={{ mb: 2.5 }}
                InputProps={{
                  ...params.InputProps,
                  sx: { fontSize: "1.1rem", borderRadius: "12px" },
                }}
                InputLabelProps={{ sx: { fontSize: "1.05rem" } }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>{option.name}</Typography>
                  <Typography sx={{ fontSize: "0.85rem", color: option.current_stock <= (option.low_stock_threshold || 5) ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                    คงเหลือ: {option.current_stock} {option.unit}
                    {option.current_stock <= (option.low_stock_threshold || 5) && " ⚠️ ใกล้หมด"}
                  </Typography>
                </Box>
              </li>
            )}
          />

          {selectedItem && (
            <Box
              sx={{
                p: 2,
                bgcolor: selectedItem.current_stock <= (selectedItem.low_stock_threshold || 5) ? "#fff7ed" : "#f0fdf4",
                borderRadius: "12px",
                border: `1px solid ${selectedItem.current_stock <= (selectedItem.low_stock_threshold || 5) ? "#fed7aa" : "#bbf7d0"}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: selectedItem.current_stock <= (selectedItem.low_stock_threshold || 5) ? "#ea580c" : "#16a34a",
                }}
              >
                📦 สต๊อกปัจจุบัน: {selectedItem.current_stock} {selectedItem.unit}
                {selectedItem.current_stock <= (selectedItem.low_stock_threshold || 5) && " ⚠️"}
              </Typography>
            </Box>
          )}
        </Card>

        {/* Quantity */}
        <Card sx={{ borderRadius: "20px", p: 3, bgcolor: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151", mb: 2.5 }}>
            จำนวนที่เบิกออก
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" gap={3}>
            <IconButton
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              sx={{
                width: 60,
                height: 60,
                bgcolor: "#fee2e2",
                color: "#dc2626",
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
                  color: "#dc2626",
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
                bgcolor: "#fee2e2",
                color: "#dc2626",
                "&:hover": { bgcolor: "#fecaca" },
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
            placeholder="เช่น ส่งลูกค้า, ใช้ทำอาหาร, โอนให้สาขาอื่น"
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
            bgcolor: "#dc2626",
            boxShadow: "0 6px 24px rgba(220,38,38,0.4)",
            "&:hover": { bgcolor: "#b91c1c" },
            "&:disabled": { bgcolor: "#d1d5db", color: "#9ca3af" },
          }}
        >
          {saving ? (
            <Box display="flex" alignItems="center" gap={1.5}>
              <CircularProgress size={22} sx={{ color: "white" }} />
              กำลังบันทึก...
            </Box>
          ) : (
            "✅ บันทึกเบิกของออก"
          )}
        </Button>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
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
