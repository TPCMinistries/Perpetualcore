import { z } from "zod";

export const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    organizationName: z.string().optional(),
    betaCode: z.string().optional(),
    avatarFile: z.any().optional(),
  })
  .refine(
    (data) => {
      // If no beta code, organization name is required
      if (!data.betaCode || data.betaCode.trim() === "") {
        return data.organizationName && data.organizationName.length >= 2;
      }
      // If beta code exists, organization name is not required
      return true;
    },
    {
      message: "Organization name is required when no beta code is provided",
      path: ["organizationName"],
    }
  );

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
