import { api, handleApiError } from "@/lib/api";
import { useEffect, useState } from "react";
import { User, Mail, Lock, Camera, Save, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "../auth/api";
import { toast } from "sonner";

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const passwordDataTyped = passwordData as PasswordFormData;

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const response = (await api.put("/auth/profile", profileData)).data.user;
      setUser(response);
      setProfileData({ name: response.name, email: response.email });
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!passwordDataTyped.currentPassword) newErrors.currentPassword = "Current password required";
    if (!passwordDataTyped.newPassword || passwordDataTyped.newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters";
    }
    if (passwordDataTyped.newPassword !== passwordDataTyped.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }
    setPasswordErrors({});

    setIsChangingPassword(true);
    try {
      await api.post("/auth/reset-password", passwordData);
      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500">Manage your account information</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }
            `}
          >
            <tab.icon className="h-4 w-4" strokeWidth={2} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-hover transition-colors">
                    <Camera className="h-4 w-4" strokeWidth={2} />
                    <input type="file" accept="image/*" className="sr-only" />
                  </label>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-slate-900">{user?.name}</h3>
                  <p className="text-slate-500">{user?.email}</p>
                  <Badge variant="gray" className="mt-2 capitalize">{user?.role?.toLowerCase()}</Badge>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Personal Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Your name"
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" strokeWidth={2} />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "security" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter current password"
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  error={passwordErrors.newPassword}
                  placeholder="Enter new password (min 6 chars)"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  error={passwordErrors.confirmPassword}
                  placeholder="Confirm new password"
                />
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <Button type="submit" isLoading={isChangingPassword}>
                    <Lock className="h-4 w-4 mr-2" strokeWidth={2} />
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="border-b border-red-200">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" strokeWidth={2} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <Button variant="danger" onClick={handleLogout}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}