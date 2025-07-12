"use server";
import { createClient } from "@/middlewares/supabase/server";

export async function addNotebook(name: string) {
  const supabase = await createClient();

  const userData = await supabase.auth.getUser();
  const userEmail = userData.data.user?.email || "";

  try {
    const response = await fetch(
      process.env.DEVELOPMENT_URL + "/api/notebook/add/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: userEmail,
        }),
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error adding notebook:", error);
    return {
      success: false,
      status: 500,
      data: { error: "Failed to add notebook" },
    };
  }
}
