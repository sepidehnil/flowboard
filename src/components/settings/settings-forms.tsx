"use client";

import { useActionState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import {
  changePasswordAction,
  updateProfileAction,
  type ActionResult,
} from "@/actions/auth";
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeInput,
  type ProfileInput,
} from "@/lib/validations";
import { useActionToast } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initial: ActionResult = {};

export function SettingsForms({
  user,
}: {
  user: { name: string; email: string };
}) {
  const { theme, setTheme } = useTheme();
  const { update } = useSession();
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initial,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    initial,
  );

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: { name: user.name, email: user.email },
  });

  const passwordForm = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const syncSessionAfterProfile = useCallback(async () => {
    const name = profileState.name ?? profileForm.getValues("name");
    const email = profileState.email ?? profileForm.getValues("email");
    await update({ name, email });
  }, [profileState.name, profileState.email, profileForm, update]);

  useActionToast(profileState, syncSessionAfterProfile);
  useActionToast(passwordState, () => passwordForm.reset());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Manage your profile, security, and appearance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Preference is stored in your browser and respects system setting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="theme">Theme</Label>
          <Select
            id="theme"
            value={theme ?? "system"}
            onChange={(e) => setTheme(e.target.value)}
            className="max-w-xs"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update how your name appears across FlowBoard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="max-w-lg space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...profileForm.register("name")} />
              {profileForm.formState.errors.name ? (
                <p className="mt-1 text-xs text-danger">
                  {profileForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...profileForm.register("email")} />
              {profileForm.formState.errors.email ? (
                <p className="mt-1 text-xs text-danger">
                  {profileForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Savingâ€¦" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Use a strong password unique to this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="max-w-lg space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                {...passwordForm.register("currentPassword")}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                {...passwordForm.register("newPassword")}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                {...passwordForm.register("confirmPassword")}
              />
            </div>
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "Updatingâ€¦" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
