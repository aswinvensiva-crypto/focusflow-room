import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function NewBooking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    taxPercentage: "0",
    advancePaid: "0",
    notes: "",
    // New customer fields
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
  });

  useEffect(() => {
    fetchRoomsAndCustomers();
  }, []);

  const fetchRoomsAndCustomers = async () => {
    const [roomsResult, customersResult] = await Promise.all([
      supabase.from("rooms").select("*").eq("status", "available"),
      supabase.from("customers").select("*").order("name"),
    ]);

    if (roomsResult.data) setRooms(roomsResult.data);
    if (customersResult.data) setCustomers(customersResult.data);
  };

  const calculateTotal = () => {
    if (!formData.checkInDate || !formData.checkOutDate || !formData.roomId) {
      return { days: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, pendingAmount: 0 };
    }
    
    const days = differenceInDays(
      new Date(formData.checkOutDate),
      new Date(formData.checkInDate)
    );
    
    if (days <= 0) {
      return { days: 0, baseAmount: 0, taxAmount: 0, totalAmount: 0, pendingAmount: 0 };
    }
    
    const room = rooms.find((r: any) => r.id === formData.roomId);
    const baseAmount = days * (room?.price_per_day || 0);
    const taxAmount = baseAmount * (Number(formData.taxPercentage) / 100);
    const totalAmount = baseAmount + taxAmount;
    const pendingAmount = totalAmount - Number(formData.advancePaid);
    
    return { days, baseAmount, taxAmount, totalAmount, pendingAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let customerId = formData.customerId;

      // Create new customer if needed
      if (newCustomer) {
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: formData.customerName,
            phone: formData.customerPhone,
            email: formData.customerEmail,
            address: formData.customerAddress,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = customerData.id;
      }

      const { days, baseAmount, taxAmount, totalAmount, pendingAmount } = calculateTotal();

      const { error } = await supabase.from("bookings").insert({
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
        pending_amount: pendingAmount,
        notes: formData.notes,
      });

      if (error) throw error;

      toast.success("Booking created successfully!");
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
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newCustomer"
                  checked={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="newCustomer">New Customer</Label>
              </div>

              {newCustomer ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Address</Label>
                    <Input
                      id="customerAddress"
                      value={formData.customerAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, customerAddress: e.target.value })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customerId">Select Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customerId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                    <SelectValue placeholder="Select a room" />
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

              <div className="space-y-2">
                <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, taxPercentage: e.target.value })
                  }
                />
              </div>

              {formData.checkInDate && formData.checkOutDate && formData.roomId && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Days:</span>
                    <span className="font-medium">{calculateTotal().days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Base Amount:</span>
                    <span className="font-medium">₹{calculateTotal().baseAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Tax ({formData.taxPercentage}%):</span>
                    <span className="font-medium">₹{calculateTotal().taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-lg font-bold">₹{calculateTotal().totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="advancePaid">Advance Paid</Label>
                <Input
                  id="advancePaid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.advancePaid}
                  onChange={(e) =>
                    setFormData({ ...formData, advancePaid: e.target.value })
                  }
                />
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
                {loading ? "Creating..." : "Create Booking"}
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
