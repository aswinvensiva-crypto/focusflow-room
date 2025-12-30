import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  total_days: number;
  base_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  advance_paid: number;
  pending_amount: number;
  payment_status: string;
  booking_status: string;
  customer: { name: string; phone: string };
  room: { room_number: string; room_name: string };
}

interface BookingsTableProps {
  bookings: Booking[];
  onUpdate: () => void;
}

export function BookingsTable({ bookings, onUpdate }: BookingsTableProps) {
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete booking");
    } else {
      toast.success("Booking deleted successfully");
      onUpdate();
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500";
      case "checked_in":
        return "bg-green-500";
      case "checked_out":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No bookings found. Create your first booking to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Advance</TableHead>
            <TableHead>Pending</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{booking.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.customer.phone}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{booking.room.room_number}</p>
                  <p className="text-sm text-muted-foreground">{booking.room.room_name}</p>
                </div>
              </TableCell>
              <TableCell>{format(new Date(booking.check_in_date), "MMM dd, yyyy")}</TableCell>
              <TableCell>{format(new Date(booking.check_out_date), "MMM dd, yyyy")}</TableCell>
              <TableCell>{booking.total_days}</TableCell>
              <TableCell>₹{Number(booking.base_amount).toLocaleString()}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>₹{Number(booking.tax_amount).toLocaleString()}</div>
                  <div className="text-muted-foreground">({booking.tax_percentage}%)</div>
                </div>
              </TableCell>
              <TableCell className="font-medium">₹{Number(booking.total_amount).toLocaleString()}</TableCell>
              <TableCell>₹{Number(booking.advance_paid).toLocaleString()}</TableCell>
              <TableCell className="text-destructive font-medium">
                ₹{Number(booking.pending_amount).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge className={getPaymentStatusColor(booking.payment_status)}>
                  {booking.payment_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getBookingStatusColor(booking.booking_status)}>
                  {booking.booking_status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(booking.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
