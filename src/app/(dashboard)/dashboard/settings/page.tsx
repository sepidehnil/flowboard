import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsForms } from "@/components/settings/settings-forms";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  if (!dbUser) {
    redirect("/login");
  }

  return (
    <SettingsForms
      user={{
        name: dbUser.name,
        email: dbUser.email,
      }}
    />
  );
}

