import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { provisionStaffAccount } from "@/lib/provision";
import { getEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const env = getEnv();

    const authHeaderSecret = request.headers.get("x-provisioning-secret");
    const isAuthorizedBySecret =
      Boolean(env.STAFF_PROVISIONING_SECRET) &&
      authHeaderSecret === env.STAFF_PROVISIONING_SECRET;

    const isAuthorizedByCoachSession = session?.role === "coach";

    if (!isAuthorizedBySecret && !isAuthorizedByCoachSession) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Staff provisioning requires coach authorization or a valid provisioning secret",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    const staffUser = await provisionStaffAccount({
      name,
      email,
      password,
      role,
      provisioningSecret: env.STAFF_PROVISIONING_SECRET,
    });

    return NextResponse.json({ user: staffUser }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Staff provisioning failed";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

