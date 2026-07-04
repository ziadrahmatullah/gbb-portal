import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, User, Mail } from "lucide-react";
import { useAuthStore } from "@/domains/auth";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function Field({ label, required, hint, error, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Password input with show/hide toggle
function PasswordInput({ value, onChange, placeholder, error, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(error && "border-destructive")}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ChangePassword() {
  const { user, loading, changePassword } = useAuthStore();

  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.old_password) {
      newErrors.old_password = "Current password is required";
    }

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "Password must be at least 6 characters";
    }

    if (!formData.confirm_new_password) {
      newErrors.confirm_new_password = "Please confirm your new password";
    } else if (formData.new_password !== formData.confirm_new_password) {
      newErrors.confirm_new_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await changePassword(formData.old_password, formData.new_password);
      // Reset form on success
      setFormData({
        old_password: "",
        new_password: "",
        confirm_new_password: "",
      });
      setErrors({});
    } catch (err) {
      if (err.message.includes("old password") || err.message.includes("current password")) {
        setErrors({ old_password: err.message });
      } else {
        setErrors({ new_password: err.message });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 text-primary h-10 w-10 flex items-center justify-center font-bold">
                {user?.full_name
                  ? user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "US"}
              </div>
              <div>
                <p className="font-medium">{user?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Current Password"
              required
              hint="Enter your current password"
              error={errors.old_password}
            >
              <PasswordInput
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                placeholder="Enter current password"
                error={errors.old_password}
                required
              />
            </Field>

            <Field
              label="New Password"
              required
              hint="Must be at least 6 characters long"
              error={errors.new_password}
            >
              <PasswordInput
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter new password"
                error={errors.new_password}
                required
              />
            </Field>

            <Field
              label="Confirm New Password"
              required
              hint="Re-enter your new password"
              error={errors.confirm_new_password}
            >
              <PasswordInput
                name="confirm_new_password"
                value={formData.confirm_new_password}
                onChange={handleChange}
                placeholder="Confirm new password"
                error={errors.confirm_new_password}
                required
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    old_password: "",
                    new_password: "",
                    confirm_new_password: "",
                  });
                  setErrors({});
                }}
                disabled={loading}
              >
                Reset
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
