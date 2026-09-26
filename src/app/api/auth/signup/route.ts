import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser, findUserByEmail, UserRole } from "@/lib/db";
import { attachAuthCookie, hashPassword, signToken } from "@/lib/auth";

const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["INVENTORY_MANAGER", "WAREHOUSE_STAFF"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: firstError, details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, role, password } = parsed.data;

    // Check existing
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as UserRole,
      passwordHash,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    attachAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while registering." },
      { status: 500 }
    );
  }
}
