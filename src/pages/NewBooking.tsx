import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function NewBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    taxPercentage: "0",
    advancePaid: "0",
    notes: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRoomsAndCustomers();
  }, [user]);

  const fetchRoomsAndCustomers = async () => {
    const [roomsResult, customersResult] = await Promise.all([
      supabase
        .from("rooms")
        .select("*")
        .eq("user_id", user!.id),

      supabase
        .from("customers")
        .select("*")
        .eq("user_id", user!.id)
        .order("name"),
    ]);

    if (roomsResult.error) toast.error(roomsResult.error.message);
    if (customersResult.error) toast.error(customersResult.error.message);

    if (roomsResult.data) setRooms(roomsResult.data);
    if (customersResult.data) setCustomers(customersResult.data);
  };

  const calculateTotal = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !formData.roomId) {
      return { days: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0 };
    }

    const days = differenceInDays(
      new Date(formData.checkOutDate),
      new Date(formData.checkInDate)
    );

    if (days <= 0) {
      return { days: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0 };
    }

    const room = rooms.find(
      (r) => String(r.id) === formData.roomId
    );

    const baseAmount = days * (room?.price_per_day || 0);
    const taxAmount = baseAmount * (Number(formData.taxPercentage) / 100);
    const totalAmount = baseAmount + taxAmount;

    return { days, baseAmount, taxAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let customerId = formData.customerId;

      if (newCustomer) {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            name: formData.customerName,
            phone: formData.customerPhone,
            email: formData.customerEmail,
            address: formData.customerAddress,
          })
          .select()
          .single();

        if (error) throw error;
        customerId = data.id;
      }

      const { days, baseAmount, taxAmount, totalAmount } = calculateTotal();

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        customer_id: customerId,
        room_id: formData.roomId,
        check_in_date: formData.checkInDate,
        check_out_date: formData.checkOutDate,
        total_days: days,
        base_amount: baseAmount,
        tax_percentage: Number(formData.taxPercentage),
        tax_amount: taxAmount,
        total_amount: totalAmount,
        advance_paid: Number(formData.advancePaid),
        pending_amount: totalAmount - Number(formData.advancePaid),
        notes: formData.notes,
      });

      if (error) throw error;

      toast.success("Booking created successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold">New Booking</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newCustomer}
                onChange={(e) => setNewCustomer(e.target.checked)}
              />
              <Label>New Customer</Label>
            </div>

            {newCustomer ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Phone"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Email"
                  value={formData.customerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, customerEmail: e.target.value })
                  }
                />
                <Input
                  placeholder="Address"
                  value={formData.customerAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, customerAddress: e.target.value })
                  }
                />
              </div>
            ) : (
              <Select
                value={formData.customerId}
                onValueChange={(v) =>
                  setFormData({ ...formData, customerId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} - {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* ✅ FIXED ROOM SELECT */}
            <Select
              value={formData.roomId}
              onValueChange={(v) =>
                setFormData({ ...formData, roomId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.length === 0 && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No rooms found
                  </div>
                )}
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    Room {r.room_number} – ₹{r.price_per_day}/day
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={formData.checkInDate}
                onChange={(e) =>
                  setFormData({ ...formData, checkInDate: e.target.value })
                }
                required
              />
              <Input
                type="date"
                value={formData.checkOutDate}
                onChange={(e) =>
                  setFormData({ ...formData, checkOutDate: e.target.value })
                }
                required
              />
            </div>

            <Input
              type="number"
              placeholder="Advance Paid"
              value={formData.advancePaid}
              onChange={(e) =>
                setFormData({ ...formData, advancePaid: e.target.value })
              }
            />

            <Textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Booking"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
