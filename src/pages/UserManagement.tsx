import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, UserPlus, X, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  blocked: boolean;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("staff");

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch users. You may not have admin access.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const assignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role as "admin" | "staff",
      });
      if (error) throw error;
      toast.success(`Role "${role}" assigned successfully`);
      fetchUsers();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("User already has this role");
      } else {
        toast.error("Failed to assign role");
      }
      console.error(error);
    } finally {
      setAssigning(null);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as "admin" | "staff");
      if (error) throw error;
      toast.success(`Role "${role}" removed successfully`);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to remove role");
      console.error(error);
    }
  };

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot block your own account");
      return;
    }
    try {
      if (currentlyBlocked) {
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("user_id", userId);
        if (error) throw error;
        toast.success("User access restored");
      } else {
        const { error } = await supabase
          .from("blocked_users")
          .insert({ user_id: userId, blocked_by: currentUser?.id });
        if (error) throw error;
        toast.success("User has been restricted");
      }
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to update user access");
      console.error(error);
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
        <h2 className="text-3xl font-bold">User Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Users & Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className={user.blocked ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        {user.roles.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        ) : (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === "admin" ? "default" : "secondary"}
                              className="flex items-center gap-1"
                            >
                              <Shield className="h-3 w-3" />
                              {role}
                              <button
                                onClick={() => removeRole(user.id, role)}
                                className="ml-1 hover:text-destructive transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.blocked ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <Ban className="h-3 w-3" />
                          Restricted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {assigning === user.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => assignRole(user.id, selectedRole)}>
                            Assign
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAssigning(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssigning(user.id);
                              setSelectedRole("staff");
                            }}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Role
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant={user.blocked ? "outline" : "destructive"}
                              onClick={() => toggleBlock(user.id, user.blocked)}
                            >
                              {user.blocked ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

