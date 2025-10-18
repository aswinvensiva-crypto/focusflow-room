import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomName: "",
    capacity: "1",
    pricePerDay: "",
    status: "available",
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("rooms").select("*").order("room_number");

    if (error) {
      toast.error("Failed to fetch rooms");
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update({
            room_number: formData.roomNumber,
            room_name: formData.roomName,
            capacity: Number(formData.capacity),
            price_per_day: Number(formData.pricePerDay),
            status: formData.status,
          })
          .eq("id", editingRoom.id);

        if (error) throw error;
        toast.success("Room updated successfully!");
      } else {
        const { error } = await supabase.from("rooms").insert({
          room_number: formData.roomNumber,
          room_name: formData.roomName,
          capacity: Number(formData.capacity),
          price_per_day: Number(formData.pricePerDay),
          status: formData.status,
        });

        if (error) throw error;
        toast.success("Room created successfully!");
      }

      setOpen(false);
      resetForm();
      fetchRooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to save room");
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.room_number,
      roomName: room.room_name,
      capacity: room.capacity.toString(),
      pricePerDay: room.price_per_day.toString(),
      status: room.status,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    const { error } = await supabase.from("rooms").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete room. It may have existing bookings.");
    } else {
      toast.success("Room deleted successfully!");
      fetchRooms();
    }
  };

  const resetForm = () => {
    setFormData({
      roomNumber: "",
      roomName: "",
      capacity: "1",
      pricePerDay: "",
      status: "available",
    });
    setEditingRoom(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "maintenance":
        return "bg-yellow-500";
      case "unavailable":
        return "bg-red-500";
      default:
        return "bg-gray-500";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Rooms Management</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNumber: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name *</Label>
                <Input
                  id="roomName"
                  value={formData.roomName}
                  onChange={(e) =>
                    setFormData({ ...formData, roomName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerDay">Price Per Day (₹) *</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerDay: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingRoom ? "Update" : "Create"}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setOpen(false); resetForm(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room: any) => (
          <Card key={room.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{room.room_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">{room.room_name}</p>
                </div>
                <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Capacity: {room.capacity} person(s)</p>
                <p className="text-lg font-bold text-primary">₹{room.price_per_day}/day</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(room)}
                  className="flex-1"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(room.id)}
                  className="flex-1"
                >
                  <Trash2 className="mr-1 h-3 w-3 text-destructive" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
