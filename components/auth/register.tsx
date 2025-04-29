"use client";

import { loginUser, registerUser } from "@/actions/auth.action";
import { RegisterSchema } from "@/helpers/schemas";
import { RegisterFormType } from "@/helpers/types";
import { Button, Input } from "@heroui/react";
import { Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MatrixBackground } from "@/components/ui/MatrixBackground";
import { DealpigText as AnimatedDealpigText } from "@/components/icons/AnimatedDealpigText";
import { LetterFx } from "@/components/ui/LetterFx";

export const Register = () => {
  const router = useRouter();
  const [regError, setRegError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);

  const initialValues: RegisterFormType = {
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const handleRegister = useCallback(
    async (values: RegisterFormType) => {
      setIsLoading(true);
      setRegError(null);
      
      try {
        // Use our server action for registration
        const result = await registerUser(values);
        
        if (result?.success) {
          if (result.requiresEmailVerification) {
            // If email verification is required, show message
            setVerificationRequired(true);
          } else {
            // If auto-login is enabled, redirect to dashboard
            router.replace("/");
          }
        } else {
          setRegError(result?.message || "Registration failed. Please try again.");
        }
      } catch (error) {
        console.error("Registration error:", error);
        setRegError("An unexpected error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  if (verificationRequired) {
    return (
      <>
        <MatrixBackground />
        <div className="relative z-10 flex flex-col items-center max-w-md w-full mx-auto">
          <div className="mb-8 text-center">
            <AnimatedDealpigText width="316px" height="90px" className="mx-auto mb-4" />
            <h1 className="text-2xl font-mono text-green-400">Email Verification Required</h1>
            <div className="mt-6 p-4 border border-green-400 bg-black/50 rounded-none text-left">
              <p className="text-green-400 font-mono mb-4">
                We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
              </p>
              <p className="text-green-400/80 font-mono">
                Once verified, you'll be able to log in to your new account.
              </p>
            </div>
            <div className="mt-6">
              <Link href="/login">
                <Button
                  variant="flat"
                  className="w-full font-mono text-green-400 bg-black border border-green-400 rounded-none hover:bg-green-400 hover:text-black transition-colors duration-200"
                  size="lg"
                >
                  <LetterFx trigger="hover" speed="medium">
                    Return to Login
                  </LetterFx>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MatrixBackground />
      <div className="relative z-10 flex flex-col items-center max-w-md w-full mx-auto">
        <div className="mb-8 text-center">
          <AnimatedDealpigText width="316px" height="90px" className="mx-auto mb-4" />
          <h1 className="text-2xl font-mono text-green-400">Create your account</h1>
          <p className="text-green-400/80 font-mono mt-2">Join DealPig to manage your real estate deals</p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={RegisterSchema}
          onSubmit={handleRegister}>
          {({ values, errors, touched, handleChange, handleSubmit }) => (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full">
              <div className="flex flex-col gap-4 mb-4 w-full">
                <Input
                  variant="bordered"
                  label="Full Name"
                  value={values.full_name}
                  isInvalid={!!errors.full_name && !!touched.full_name}
                  errorMessage={errors.full_name}
                  onChange={handleChange("full_name")}
                  isDisabled={isLoading}
                  size="lg"
                  classNames={{
                    inputWrapper: "bg-black border-green-400 rounded-none",
                    input: "text-green-400 font-mono placeholder:text-green-400 placeholder:opacity-50",
                    label: "text-green-400 font-mono",
                  }}
                />
                <Input
                  variant="bordered"
                  label="Email"
                  type="email"
                  value={values.email}
                  isInvalid={!!errors.email && !!touched.email}
                  errorMessage={errors.email}
                  onChange={handleChange("email")}
                  isDisabled={isLoading}
                  autoComplete="email"
                  size="lg"
                  classNames={{
                    inputWrapper: "bg-black border-green-400 rounded-none",
                    input: "text-green-400 font-mono placeholder:text-green-400 placeholder:opacity-50",
                    label: "text-green-400 font-mono",
                  }}
                />
                <Input
                  variant="bordered"
                  label="Password"
                  type="password"
                  value={values.password}
                  isInvalid={!!errors.password && !!touched.password}
                  errorMessage={errors.password}
                  onChange={handleChange("password")}
                  isDisabled={isLoading}
                  autoComplete="new-password"
                  size="lg"
                  classNames={{
                    inputWrapper: "bg-black border-green-400 rounded-none",
                    input: "text-green-400 font-mono placeholder:text-green-400 placeholder:opacity-50",
                    label: "text-green-400 font-mono",
                  }}
                />
                <Input
                  variant="bordered"
                  label="Confirm Password"
                  type="password"
                  value={values.confirmPassword}
                  isInvalid={!!errors.confirmPassword && !!touched.confirmPassword}
                  errorMessage={errors.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  isDisabled={isLoading}
                  autoComplete="new-password"
                  size="lg"
                  classNames={{
                    inputWrapper: "bg-black border-green-400 rounded-none",
                    input: "text-green-400 font-mono placeholder:text-green-400 placeholder:opacity-50",
                    label: "text-green-400 font-mono",
                  }}
                />
              </div>

              {regError && (
                <div className="text-red-500 mb-4 text-center p-2 bg-red-950/50 rounded-none border border-red-500 font-mono" role="alert">
                  {regError}
                </div>
              )}

              <Button
                type="submit"
                variant="flat"
                className="w-full mt-2 font-mono text-green-400 bg-black border border-green-400 rounded-none hover:bg-green-400 hover:text-black transition-colors duration-200"
                size="lg"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                <LetterFx trigger="hover" speed="medium">
                  {isLoading ? "Creating Account..." : "Register"}
                </LetterFx>
              </Button>
            </form>
          )}
        </Formik>

        <div className="mt-6 text-center text-sm font-mono">
          <p className="text-green-400">
            Already have an account?{" "}
            <Link href="/login" className="text-green-300 hover:text-green-200 hover:underline">
              <LetterFx trigger="hover" speed="fast" className="inline-block">
                Login here
              </LetterFx>
            </Link>
          </p>
          <p className="mt-2 text-green-400/80">
            © {new Date().getFullYear()} DealPig - All rights reserved
          </p>
        </div>
      </div>
    </>
  );
};
