import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env.local");

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const configured = Boolean(url && key && url.startsWith("https://") && key.length > 20);

  return NextResponse.json({
    configured,
    url: configured ? url : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { supabaseUrl, supabaseAnonKey } = await req.json();

    if (!supabaseUrl || !supabaseUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Invalid Supabase Project URL. It should start with https://...supabase.co" },
        { status: 400 }
      );
    }

    if (!supabaseAnonKey || supabaseAnonKey.trim().length < 20) {
      return NextResponse.json(
        { error: "Invalid Supabase Anon Key. Please check your project API keys." },
        { status: 400 }
      );
    }

    const cleanUrl = supabaseUrl.trim().replace(/\/$/, "");
    const cleanKey = supabaseAnonKey.trim();

    // Verify connection by contacting Supabase Auth
    try {
      const client = createClient(cleanUrl, cleanKey);
      await client.auth.getSession();
    } catch (testErr: any) {
      return NextResponse.json(
        { error: `Could not connect to Supabase: ${testErr.message}` },
        { status: 401 }
      );
    }

    // Persist to .env.local
    let envContent = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";

    const updates: Record<string, string> = {
      NEXT_PUBLIC_SUPABASE_URL: cleanUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: cleanKey,
    };

    for (const [k, val] of Object.entries(updates)) {
      const regex = new RegExp(`^${k}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${k}=${val}`);
      } else {
        envContent += `\n${k}=${val}`;
      }
    }

    fs.writeFileSync(ENV_PATH, envContent.trim() + "\n", "utf8");

    return NextResponse.json({
      success: true,
      message: "Supabase connected successfully! Real OTP emails will now be sent directly by Supabase to your Gmail.",
      url: cleanUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to configure Supabase." },
      { status: 500 }
    );
  }
}
