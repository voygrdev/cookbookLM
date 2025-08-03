"use server"

import { createClient } from "@/middlewares/supabase/server";

export async function getUserNotebooks() {
  const supabase = await createClient();

  try {
    const userData = await supabase.auth.getUser();
    const userEmail = userData.data.user?.email || "";

    if (!userEmail) {
      return { success: false, error: "No user email found" };
    }

    const response = await fetch(
      `${process.env.DEVELOPMENT_URL}/api/notebook?email=${encodeURIComponent(userEmail)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching notebooks: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
