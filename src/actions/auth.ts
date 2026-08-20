"use server";

import { hash, compare } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
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

export type ActionResult = {
  error?: string;
  success?: string;
  name?: string;
  email?: string;
};

function signInFailed(url: unknown) {
  if (typeof url !== "string") return true;
  return url.includes("error=") || url.includes("CredentialsSignin");
}

async function signInWithPassword(email: string, password: string) {
  // Let Auth.js set the session cookie, then hard-navigate to dashboard.
  // Using redirect:false first avoids swallowing NEXT_REDIRECT inside useActionState.
  const url = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (signInFailed(url)) {
    return false;
  }

  // Prefer Auth.js callback URL when present; always land on dashboard.
  redirect("/dashboard");
}

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

    const ok = await signInWithPassword(email, parsed.data.password);
    if (!ok) {
      return {
        error:
          "Account created, but automatic sign-in failed. Please log in.",
      };
    }

    return { success: "Account created" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return {
        error:
          "Account created, but automatic sign-in failed. Please log in.",
      };
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

    const ok = await signInWithPassword(
      parsed.data.email.toLowerCase(),
      parsed.data.password,
    );
    if (!ok) {
      return { error: "Invalid email or password" };
    }

    return { success: "Logged in" };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
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
