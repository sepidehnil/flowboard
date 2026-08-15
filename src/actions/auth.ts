"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { seedDemoDataForUser } from "@/lib/services/demo-data";
import { toActionError } from "@/lib/services/auth-helpers";
import {
  forgotPasswordSchema,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validations";
import { compare } from "bcryptjs";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  error?: string;
  success?: string;
  name?: string;
  email?: string;
};

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists" };
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
      },
    });

    await seedDemoDataForUser(user.id, user.name);

    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    return { success: "Account created" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Could not sign you in after registration" };
    }
    // Next.js redirect throws; rethrow
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return toActionError(error);
  }
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    return { success: "Logged in" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return toActionError(error);
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  // Portfolio demo: do not reveal whether the email exists.
  return {
    success:
      "If an account exists for that email, password reset instructions would be sent. (Demo: configure an email provider to enable real resets.)",
  };
}

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const parsed = profileSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const email = parsed.data.email.toLowerCase();
    const conflict = await db.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
    });

    if (conflict) {
      return { error: "That email is already in use" };
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        email,
      },
      select: { id: true, name: true, email: true },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return {
      success: "Profile updated",
      name: updated.name,
      email: updated.email,
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function changePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const parsed = passwordChangeSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const valid = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return { error: "Current password is incorrect" };
    }

    const passwordHash = await hash(parsed.data.newPassword, 12);
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return { success: "Password updated" };
  } catch (error) {
    return toActionError(error);
  }
}
