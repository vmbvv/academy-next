import "server-only";

import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "User",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}
