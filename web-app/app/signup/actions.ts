"use server";

import { signupSchema } from "@/schema/signupSchema";

import { createClient } from "@/middlewares/supabase/server";


export const signupUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  
  const newUserValidation = signupSchema.safeParse({
    email,
    password,
  });

  if (!newUserValidation.success) {
    return {
      error: true,
      message: newUserValidation.error.issues[0]?.message ?? "An error occured",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      error: true,
      message: error.message,
    };
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      error: true,
      message: "Email already in use",
    };
  }

  return {
    success: true,
    message: "Check your email for the confirmation link",
  };
};
