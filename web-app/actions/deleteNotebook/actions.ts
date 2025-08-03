"use server";

import { createClient } from "@/middlewares/supabase/server";

export async function deleteNotebook(notebookId: string) {
  try {
    const supabase = await createClient();

    const userData = await supabase.auth.getUser();
    const userEmail = userData.data.user?.email;

    if (!userEmail) {
      return { success: false, error: "User not authenticated" };
    }

    const response = await fetch(
      `${process.env.DEVELOPMENT_URL}/api/notebook?email=${encodeURIComponent(
        userEmail
      )}&notebookId=${encodeURIComponent(notebookId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error deleting notebook: ${response.statusText}`);
    }

    const result = await response.json();

    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting notebook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
