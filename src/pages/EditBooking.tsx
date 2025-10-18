import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

export default function EditBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    roomId: "",
    roomNumber: "",
    checkInDate: "",
    checkOutDate: "",
    totalAmount: "0",
    advancePaid: "0",
    bookingStatus: "",
    notes: "",
  });

  useEffect(() => {
    fetchBooking();
    fetchRooms();
  }, [id]);

  const fetchRooms = async () => {
    const { data } = await supabase.from("rooms").select("*");
    if (data) setRooms(data);
  };

  const fetchBooking = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        customer:customers(*),
        room:rooms(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to fetch booking");
      navigate("/");
      return;
    }

    setFormData({
      customerName: data.customer.name,
      customerPhone: data.customer.phone,
      roomId: data.room_id,
      roomNumber: data.room.room_number,
      checkInDate: data.check_in_date,
      checkOutDate: data.check_out_date,
      totalAmount: data.total_amount.toString(),
      advancePaid: data.advance_paid.toString(),
      bookingStatus: data.booking_status,
      notes: data.notes || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const days = differenceInDays(
        new Date(formData.checkOutDate),
        new Date(formData.checkInDate)
      );

      const { error } = await supabase
        .from("bookings")
        .update({
          room_id: formData.roomId,
          check_in_date: formData.checkInDate,
          check_out_date: formData.checkOutDate,
          total_days: days,
          total_amount: Number(formData.totalAmount),
          advance_paid: Number(formData.advancePaid),
          booking_status: formData.bookingStatus,
          notes: formData.notes,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Booking updated successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
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
        <h2 className="text-3xl font-bold">Edit Booking</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input value={formData.customerName} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Customer Phone</Label>
                  <Input value={formData.customerPhone} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">Select Room *</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, roomId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room: any) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.room_number} - {room.room_name} (₹{room.price_per_day}/day)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="checkInDate">Check-in Date *</Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) =>
                      setFormData({ ...formData, checkInDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOutDate">Check-out Date *</Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOutDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advancePaid">Advance Paid *</Label>
                  <Input
                    id="advancePaid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.advancePaid}
                    onChange={(e) =>
                      setFormData({ ...formData, advancePaid: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg font-bold">
                  Pending Amount: ₹
                  {(
                    Number(formData.totalAmount) - Number(formData.advancePaid)
                  ).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingStatus">Booking Status *</Label>
                <Select
                  value={formData.bookingStatus}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bookingStatus: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Booking"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
