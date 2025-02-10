// app/api/firebase-token/route.ts
import { NextResponse, NextRequest } from "next/server";
import { admin } from "@/lib/firebaseAdmin"; // ensure this path is correct
import { getAuth as clerkGetAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  console.log("firebase-token endpoint invoked");
  const { userId: clerkUserId } = clerkGetAuth(request);
  if (!clerkUserId) {
    console.log("Clerk session not detected in API request.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const firebaseToken = await admin.auth().createCustomToken(clerkUserId);
    console.log("Custom token created for Clerk user:");
    return NextResponse.json({ firebaseToken, firebaseUid: clerkUserId });
  } catch (error) {
    console.error("Error generating Firebase token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
