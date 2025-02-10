// app/api/setFirebaseCustomClaims/route.ts
import { NextResponse, NextRequest } from "next/server";
import { admin } from "@/lib/firebaseAdmin"; // ensure the path is correct
import { getAuth as clerkGetAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  console.log("setFirebaseCustomClaims endpoint invoked");
  const { userId: clerkUserId } = clerkGetAuth(request);
  if (!clerkUserId) {
    console.log("Clerk session not detected in setFirebaseCustomClaims.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await admin.auth().setCustomUserClaims(clerkUserId, { clerkId: clerkUserId });
    console.log(`Custom claims set for user ${clerkUserId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
