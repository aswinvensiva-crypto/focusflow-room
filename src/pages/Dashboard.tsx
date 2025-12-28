import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Building2, Users, Calendar, DollarSign, Receipt, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookingsTable } from "@/components/bookings/BookingsTable";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    monthlyExpenses: 0,
    profit: 0,
  });
  const [occupancy, setOccupancy] = useState({
    today: 0,
    yesterday: 0,
    totalRooms: 0,
    occupiedToday: 0,
    change: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchOccupancyData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch bookings with customer and room details
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          customer:customers(*),
          room:rooms(*)
        `)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      setBookings(bookingsData || []);

      // Fetch current month expenses
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", firstDayOfMonth)
        .lte("expense_date", lastDayOfMonth);

      if (expensesError) throw expensesError;

      const monthlyExpenses = expensesData?.reduce(
        (sum, e) => sum + Number(e.amount), 0
      ) || 0;

      // Calculate stats
      const totalBookings = bookingsData?.length || 0;
      const activeBookings = bookingsData?.filter(
        (b) => b.booking_status === "confirmed" || b.booking_status === "checked_in"
      ).length || 0;
      
      const totalRevenue = bookingsData?.reduce(
        (sum, b) => sum + Number(b.total_amount), 0
      ) || 0;
      
      const pendingPayments = bookingsData?.reduce(
        (sum, b) => sum + Number(b.pending_amount), 0
      ) || 0;

      const profit = totalRevenue - monthlyExpenses;

      setStats({
        totalBookings,
        activeBookings,
        totalRevenue,
        pendingPayments,
        monthlyExpenses,
        profit,
      });
    } catch (error: any) {
      toast.error("Failed to fetch dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupancyData = async () => {
    try {
      // Get all rooms
      const { data: rooms, error: roomsError } = await supabase
        .from("rooms")
        .select("id");
      
      if (roomsError) throw roomsError;

      const totalRooms = rooms?.length || 0;
      if (totalRooms === 0) {
        setOccupancy({ today: 0, yesterday: 0, totalRooms: 0, occupiedToday: 0, change: 0 });
        return;
      }

      // Get today's and yesterday's dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Get all bookings that overlap with today or yesterday
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("room_id, check_in_date, check_out_date")
        .lte("check_in_date", todayStr)
        .gte("check_out_date", yesterdayStr);

      if (bookingsError) throw bookingsError;

      // Calculate occupancy for today
      const occupiedTodaySet = new Set<string>();
      const occupiedYesterdaySet = new Set<string>();

      bookingsData?.forEach((booking) => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        if (today >= checkIn && today <= checkOut) {
          occupiedTodaySet.add(booking.room_id);
        }
        if (yesterday >= checkIn && yesterday <= checkOut) {
          occupiedYesterdaySet.add(booking.room_id);
        }
      });

      const occupiedToday = occupiedTodaySet.size;
      const occupiedYesterday = occupiedYesterdaySet.size;

      const todayPercent = Math.round((occupiedToday / totalRooms) * 100);
      const yesterdayPercent = Math.round((occupiedYesterday / totalRooms) * 100);
      const change = todayPercent - yesterdayPercent;

      setOccupancy({
        today: todayPercent,
        yesterday: yesterdayPercent,
        totalRooms,
        occupiedToday,
        change,
      });
    } catch (error: any) {
      console.error("Failed to fetch occupancy data", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back to le Hues management</p>
        </div>
        <Button onClick={() => navigate("/bookings/new")} variant="premium" size="lg">
          <Plus className="mr-2 h-5 w-5" />
          New Booking
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6 stagger-children">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Bookings</CardTitle>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{stats.activeBookings}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-gradient">₹{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-destructive">
              ₹{stats.pendingPayments.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-warning">
              ₹{stats.monthlyExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stats.profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <DollarSign className={`h-5 w-5 ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-display font-bold ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              ₹{stats.profit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Bar */}
      <Card className="stat-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="font-display text-xl">Today's Occupancy</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {occupancy.occupiedToday} of {occupancy.totalRooms} rooms occupied
            </p>
          </div>
          <div className="flex items-center gap-2">
            {occupancy.change > 0 ? (
              <div className="flex items-center gap-1 text-success bg-success/10 px-3 py-1.5 rounded-full">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{occupancy.change}%</span>
              </div>
            ) : occupancy.change < 0 ? (
              <div className="flex items-center gap-1 text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">{occupancy.change}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <Minus className="h-4 w-4" />
                <span className="text-sm font-medium">0%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">vs yesterday</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-display font-bold text-gradient">{occupancy.today}%</span>
            <span className="text-sm text-muted-foreground">Yesterday: {occupancy.yesterday}%</span>
          </div>
          <Progress value={occupancy.today} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="font-display text-2xl">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <BookingsTable bookings={bookings} onUpdate={fetchDashboardData} />
        </CardContent>
      </Card>
    </div>
  );
}
