import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Printer } from "lucide-react";

interface BookingReceiptProps {
  open: boolean;
  onClose: () => void;
  data: {
    customerName: string;
    customerPhone: string;
    roomNumber: string;
    roomName: string;
    roomCategory: string;
    checkInDate: string;
    checkOutDate: string;
    totalDays: number;
    pricePerDay: number;
    baseAmount: number;
    taxPercentage: number;
    taxAmount: number;
    totalAmount: number;
    advancePaid: number;
    pendingAmount: number;
    bookingStatus: string;
    notes: string;
    bookingId: string;
    createdAt: string;
  };
}

export default function BookingReceipt({ open, onClose, data }: BookingReceiptProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("booking-receipt-content");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Booking Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { font-size: 20px; margin: 0; }
        .header p { color: #666; font-size: 12px; margin: 4px 0; }
        .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .row.total { font-weight: bold; font-size: 16px; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
        .section-title { font-weight: bold; font-size: 14px; margin: 16px 0 8px; color: #333; }
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #999; }
      </style></head><body>
        ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const fmtDate = (d: string) => {
    try { return format(new Date(d), "dd MMM yyyy"); } catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Booking Receipt</DialogTitle>
        </DialogHeader>

        <div id="booking-receipt-content" className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">Booking ID: {data.bookingId.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(data.createdAt)}</p>
          </div>

          <Separator className="border-dashed" />

          <div>
            <p className="text-sm font-semibold mb-2">Guest Details</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{data.customerName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{data.customerPhone}</span></div>
            </div>
          </div>

          <Separator className="border-dashed" />

          <div>
            <p className="text-sm font-semibold mb-2">Room Details</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="font-medium">{data.roomNumber} - {data.roomName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium">{data.roomCategory}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="font-medium">{fmtDate(data.checkInDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span className="font-medium">{fmtDate(data.checkOutDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{data.totalDays} night(s)</span></div>
            </div>
          </div>

          <Separator className="border-dashed" />

          <div>
            <p className="text-sm font-semibold mb-2">Payment Summary</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span>₹{data.pricePerDay.toLocaleString()}/night</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Base Amount</span><span>₹{data.baseAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax ({data.taxPercentage}%)</span><span>₹{data.taxAmount.toLocaleString()}</span></div>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span><span className="text-primary">₹{data.totalAmount.toLocaleString()}</span>
            </div>
            <div className="space-y-1 text-sm mt-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Advance Paid</span><span className="text-green-600 font-medium">₹{data.advancePaid.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="text-destructive font-medium">₹{data.pendingAmount.toLocaleString()}</span></div>
            </div>
          </div>

          <Separator className="border-dashed" />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{data.bookingStatus.replace("_", " ")}</span>
          </div>

          {data.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes: </span>
              <span>{data.notes}</span>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-4">Thank you for your booking!</p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button onClick={onClose} className="flex-1">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
