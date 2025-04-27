"use client";

import { loginUser, registerUser } from "@/actions/auth.action";
import { RegisterSchema } from "@/helpers/schemas";
import { RegisterFormType } from "@/helpers/types";
import { Button, Input } from "@heroui/react";
import { Formik } from "formik";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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
      <div className="flex flex-col items-center max-w-md w-full mx-auto">
        <div className="mb-8 text-center">
          <Image 
            src="/dealpig.svg" 
            alt="DealPig Logo" 
            width={316}
            height={90}
            className="mx-auto mb-4" 
            priority
          />
          <h1 className="text-2xl font-bold">Email Verification Required</h1>
          <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-md text-left">
            <p className="text-gray-700 mb-4">
              We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
            </p>
            <p className="text-gray-700">
              Once verified, you'll be able to log in to your new account.
            </p>
          </div>
          <div className="mt-6">
            <Button
              variant="flat"
              color="default"
              className="w-full"
              size="lg"
              onClick={() => router.push('/login')}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-md w-full mx-auto">
      <div className="mb-8 text-center">
        <Image 
          src="/dealpig.svg" 
          alt="DealPig Logo" 
          width={316}
          height={90}
          className="mx-auto mb-4" 
          priority
        />
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-gray-500 mt-2">Join DealPig to manage your real estate deals</p>
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
              />
            </div>

            {regError && (
              <div className="text-red-500 mb-4 text-center p-2 bg-red-50 rounded" role="alert">
                {regError}
              </div>
            )}

            <Button
              type="submit"
              variant="solid"
              color="primary"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              isDisabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Register"}
            </Button>
          </form>
        )}
      </Formik>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Login here
          </Link>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} DealPig - All rights reserved
        </p>
      </div>
    </div>
  );
};
