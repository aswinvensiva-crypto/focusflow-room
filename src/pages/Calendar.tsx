import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { toast } from "sonner";

export default function Calendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedRoom]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);

      let query = supabase
        .from("bookings")
        .select(`
          *,
          customer:customers(*),
          room:rooms(*)
        `)
        .gte("check_in_date", start.toISOString().split("T")[0])
        .lte("check_out_date", end.toISOString().split("T")[0]);

      if (selectedRoom !== "all") {
        query = query.eq("room_id", selectedRoom);
      }

      const [bookingsResult, roomsResult] = await Promise.all([
        query,
        supabase.from("rooms").select("*"),
      ]);

      if (bookingsResult.data) setBookings(bookingsResult.data);
      if (roomsResult.data) setRooms(roomsResult.data);
    } catch (error: any) {
      toast.error("Failed to fetch calendar data");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking: any) => {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      return day >= checkIn && day <= checkOut;
    });
  };

  const getRoomStats = () => {
    const days = getDaysInMonth();
    const roomStatsMap = new Map();

    rooms.forEach((room: any) => {
      let bookedDays = 0;
      let totalRevenue = 0;

      days.forEach((day) => {
        const dayBookings = bookings.filter((booking: any) => {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);
          return booking.room_id === room.id && day >= checkIn && day <= checkOut;
        });

        if (dayBookings.length > 0) {
          bookedDays++;
          dayBookings.forEach((booking: any) => {
            totalRevenue += Number(booking.total_amount) / booking.total_days;
          });
        }
      });

      roomStatsMap.set(room.id, { bookedDays, totalRevenue, room });
    });

    return Array.from(roomStatsMap.values());
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedMonth(newDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Monthly Calendar</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Previous
          </button>
          <span className="font-semibold min-w-[150px] text-center">
            {format(selectedMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Next
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Room Occupancy Statistics</CardTitle>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map((room: any) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.room_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getRoomStats().map(({ bookedDays, totalRevenue, room }: any) => (
              <Card key={room.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {room.room_number} - {room.room_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Booked:</span>
                    <span className="font-bold">{bookedDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-bold text-primary">
                      ₹{Math.round(totalRevenue).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Occupancy:</span>
                    <span className="font-bold">
                      {Math.round((bookedDays / getDaysInMonth().length) * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Occupancy View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm p-2">
                {day}
              </div>
            ))}
            {getDaysInMonth().map((day, index) => {
              const dayBookings = getBookingsForDay(day);
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-2 min-h-[100px] ${
                    dayBookings.length > 0 ? "bg-primary/10" : "bg-background"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.map((booking: any) => (
                      <Badge
                        key={booking.id}
                        variant="secondary"
                        className="text-xs w-full justify-start truncate"
                        title={`${booking.room.room_number} - ${booking.customer.name}`}
                      >
                        {booking.room.room_number}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
