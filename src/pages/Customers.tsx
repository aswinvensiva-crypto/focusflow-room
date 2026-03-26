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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Phone, Mail, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Fetch all customers when component mounts
  useEffect(() => {
    fetchCustomers();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
          .then(({ data }) => setIsAdmin((data?.length ?? 0) > 0));
      }
    });
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*, bookings(count)")
      .order("name");

    if (error) {
      toast.error("Failed to fetch customers");
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  // Create or Update Customer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(formData)
          .eq("id", editingCustomer.id);

        if (error) throw error;
        toast.success("Customer updated successfully!");
      } else {
        const { error } = await supabase.from("customers").insert(formData);

        if (error) throw error;
        toast.success("Customer created successfully!");
      }

      setOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save customer");
    }
  };

  // Edit existing customer
  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
    });
    setOpen(true);
  };

  // Delete customer — removes from DB + UI
  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this customer? This will also delete all their bookings."
      )
    )
      return;

    // Optimistically remove from UI
    const oldCustomers = customers;
    setCustomers((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete customer from database");
      // Restore UI if deletion failed
      setCustomers(oldCustomers);
    } else {
      toast.success("Customer deleted successfully!");
    }
  };

  // Reset the input form
  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setEditingCustomer(null);
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
          <h2 className="font-display text-4xl font-bold tracking-tight text-gradient">Customers</h2>
          <p className="text-muted-foreground mt-1">Manage your guest database</p>
        </div>
        {isAdmin && (
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="premium" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/30 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-gradient">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="premium">
                  {editingCustomer ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card className="stat-card">
        <CardHeader className="border-b border-border/30">
          <CardTitle className="font-display text-2xl">All Customers</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No customers found. Add your first customer to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 bg-muted/30">
                    <TableHead className="text-muted-foreground font-semibold">Name</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Contact</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Total Bookings</TableHead>
                    <TableHead className="text-right text-muted-foreground font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer: any) => (
                    <TableRow key={customer.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Phone className="h-3 w-3 text-primary" />
                            </div>
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center">
                                <Mail className="h-3 w-3 text-accent" />
                              </div>
                              {customer.email}
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center">
                                <MapPin className="h-3 w-3 text-success" />
                              </div>
                              {customer.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {customer.bookings?.[0]?.count || 0} bookings
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer.id)}
                            className="hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
