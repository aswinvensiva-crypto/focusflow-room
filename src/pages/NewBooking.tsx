import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import BookingReceipt from "@/components/bookings/BookingReceipt";

export default function NewBooking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [formData, setFormData] = useState({
    customerId: "",
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    taxPercentage: "0",
    advancePaid: "0",
    notes: "",
    bookingStatus: "confirmed",
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
      supabase.from("rooms").select("*").eq("status", "available"),
      supabase.from("customers").select("*").order("name"),
    ]);

    if (roomsResult.error) toast.error(roomsResult.error.message);
    if (customersResult.error) toast.error(customersResult.error.message);

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

    const room = rooms.find((r) => String(r.id) === formData.roomId);
    const baseAmount = days * (room?.price_per_day || 0);
    const taxAmount = baseAmount * (Number(formData.taxPercentage) / 100);
    const totalAmount = baseAmount + taxAmount;
    const pendingAmount = totalAmount - Number(formData.advancePaid);

    return { days, baseAmount, taxAmount, totalAmount, pendingAmount };
  };

  const { days, baseAmount, taxAmount, totalAmount, pendingAmount } = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (days <= 0) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setLoading(true);

    try {
      let customerId = formData.customerId;

      if (newCustomer) {
        if (!formData.customerName || !formData.customerPhone) {
          toast.error("Customer name and phone are required");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("customers")
          .insert({
            name: formData.customerName,
            phone: formData.customerPhone,
            email: formData.customerEmail || null,
            address: formData.customerAddress || null,
          })
          .select()
          .single();

        if (error) throw error;
        customerId = data.id;
      }

      if (!customerId) {
        toast.error("Please select or create a customer");
        setLoading(false);
        return;
      }

      if (!formData.roomId) {
        toast.error("Please select a room");
        setLoading(false);
        return;
      }

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
        booking_status: formData.bookingStatus,
        notes: formData.notes || null,
      });

      if (error) throw error;

      // Get customer info for receipt
      let custName = formData.customerName;
      let custPhone = formData.customerPhone;
      if (!newCustomer) {
        const cust = customers.find((c) => String(c.id) === customerId);
        custName = cust?.name || "";
        custPhone = cust?.phone || "";
      }

      const room = rooms.find((r) => String(r.id) === formData.roomId);

      setReceiptData({
        customerName: custName,
        customerPhone: custPhone,
        roomNumber: room?.room_number || "",
        roomName: room?.room_name || "",
        roomCategory: room?.room_category || "",
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        totalDays: days,
        pricePerDay: room?.price_per_day || 0,
        baseAmount,
        taxPercentage: Number(formData.taxPercentage),
        taxAmount,
        totalAmount,
        advancePaid: Number(formData.advancePaid),
        pendingAmount,
        bookingStatus: formData.bookingStatus,
        notes: formData.notes,
        bookingId: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      setReceiptOpen(true);
      toast.success("Booking created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = rooms.find((r) => String(r.id) === formData.roomId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold">New Booking</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="newCustomer"
                checked={newCustomer}
                onCheckedChange={(checked) => setNewCustomer(checked as boolean)}
              />
              <Label htmlFor="newCustomer">New Customer</Label>
            </div>

            {newCustomer ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Customer Name"
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
                      placeholder="Phone Number"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="Email Address"
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
                      placeholder="Address"
                      value={formData.customerAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, customerAddress: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(v) => setFormData({ ...formData, customerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 && (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No customers found
                      </div>
                    )}
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} - {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Room *</Label>
              <Select
                value={formData.roomId}
                onValueChange={(v) => setFormData({ ...formData, roomId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.length === 0 && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No available rooms
                    </div>
                  )}
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.room_number} - {r.room_name} (₹{r.price_per_day}/day)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRoom && (
                <p className="text-sm text-muted-foreground">
                  Category: {selectedRoom.room_category} | Capacity: {selectedRoom.capacity} person(s)
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="bookingStatus">Booking Status</Label>
              <Select
                value={formData.bookingStatus}
                onValueChange={(v) => setFormData({ ...formData, bookingStatus: v })}
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
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, taxPercentage: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advancePaid">Advance Paid (₹)</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Days:</span>
                <span className="font-medium">{days} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Room Rate ({selectedRoom?.room_number || "N/A"}):
                </span>
                <span className="font-medium">₹{selectedRoom?.price_per_day || 0}/day</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Amount:</span>
                <span className="font-medium">₹{baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({formData.taxPercentage}%):</span>
                <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advance Paid:</span>
                <span className="font-medium text-green-600">₹{Number(formData.advancePaid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-destructive">Pending Amount:</span>
                <span className="font-bold text-destructive">₹{pendingAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Booking"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
