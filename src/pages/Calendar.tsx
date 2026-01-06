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
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ROOM_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
];

export default function Calendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const roomCategories = [
    { value: "standard", label: "Standard" },
    { value: "deluxe", label: "Deluxe" },
    { value: "ultra_deluxe", label: "Ultra Deluxe" },
    { value: "suite", label: "Suite" },
    { value: "presidential", label: "Presidential" },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "standard": return "bg-muted text-muted-foreground";
      case "deluxe": return "bg-primary/20 text-primary";
      case "ultra_deluxe": return "bg-accent/20 text-accent";
      case "suite": return "bg-secondary/20 text-secondary-foreground";
      case "presidential": return "bg-gradient-to-r from-primary to-accent text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

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

      const [bookingsResult, roomsResult, allBookingsResult] = await Promise.all([
        query,
        supabase.from("rooms").select("*"),
        supabase.from("bookings").select("*, room:rooms(*)"),
      ]);

      if (bookingsResult.data) setBookings(bookingsResult.data);
      if (roomsResult.data) setRooms(roomsResult.data);
      if (allBookingsResult.data) setAllBookings(allBookingsResult.data);

      // Calculate monthly revenue data for the chart
      if (allBookingsResult.data && roomsResult.data) {
        const monthlyData = calculateMonthlyRevenueByRoom(allBookingsResult.data, roomsResult.data);
        setMonthlyRevenueData(monthlyData);
      }
    } catch (error: any) {
      toast.error("Failed to fetch calendar data");
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRevenueByRoom = (allBookings: any[], allRooms: any[]) => {
    const monthsMap = new Map<string, any>();

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = format(date, "MMM yyyy");
      const dataPoint: any = { month: format(date, "MMM") };
      allRooms.forEach((room) => {
        dataPoint[room.room_name] = 0;
      });
      monthsMap.set(monthKey, dataPoint);
    }

    // Aggregate revenue by room and month
    allBookings.forEach((booking: any) => {
      const bookingDate = new Date(booking.check_in_date);
      const monthKey = format(bookingDate, "MMM yyyy");
      const monthData = monthsMap.get(monthKey);
      if (monthData && booking.room) {
        monthData[booking.room.room_name] =
          (monthData[booking.room.room_name] || 0) + Number(booking.total_amount);
      }
    });

    return Array.from(monthsMap.values());
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

  const getAvailabilityByCategory = (date: Date) => {
    const categoryAvailability: Record<string, { total: number; available: number; booked: string[] }> = {};
    
    // Initialize categories
    roomCategories.forEach((cat) => {
      categoryAvailability[cat.value] = { total: 0, available: 0, booked: [] };
    });

    // Count rooms by category
    rooms.forEach((room: any) => {
      const category = room.room_category || "standard";
      if (categoryAvailability[category]) {
        categoryAvailability[category].total++;
        
        // Check if room is booked on this date
        const isBooked = allBookings.some((booking: any) => {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);
          checkIn.setHours(0, 0, 0, 0);
          checkOut.setHours(0, 0, 0, 0);
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          return booking.room_id === room.id && checkDate >= checkIn && checkDate <= checkOut;
        });

        if (isBooked) {
          categoryAvailability[category].booked.push(room.room_number);
        } else {
          categoryAvailability[category].available++;
        }
      }
    });

    return categoryAvailability;
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

      {/* Room Availability by Category */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Room Availability by Category</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {roomCategories.map((category) => {
              const availability = getAvailabilityByCategory(selectedDate)[category.value];
              if (availability.total === 0) return null;
              
              return (
                <Card key={category.value} className="border-l-4 border-l-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`${getCategoryColor(category.value)} text-xs`}>
                        {category.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">{availability.available}</span>
                      <span className="text-sm text-muted-foreground">/ {availability.total} rooms</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {availability.available === 0 ? (
                        <span className="text-destructive font-medium">Fully booked</span>
                      ) : availability.available === availability.total ? (
                        <span className="text-green-500 font-medium">All available</span>
                      ) : (
                        <span>{availability.booked.length} booked: {availability.booked.join(", ")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Room Revenue Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {rooms.map((room: any, index: number) => (
                  <Area
                    key={room.id}
                    type="monotone"
                    dataKey={room.room_name}
                    stackId="1"
                    stroke={ROOM_COLORS[index % ROOM_COLORS.length]}
                    fill={ROOM_COLORS[index % ROOM_COLORS.length]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
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
