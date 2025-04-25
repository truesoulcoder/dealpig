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

  const initialValues: RegisterFormType = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const handleRegister = useCallback(
    async (values: RegisterFormType) => {
      setIsLoading(true);
      setRegError(null);
      
      try {
        // Call registerUser to create the user account
        const registrationResult = await registerUser(values.email, values.password, values.name);
        
        if (registrationResult?.success) {
          // If registration is successful, automatically log the user in
          const loginResult = await loginUser({
            email: values.email,
            password: values.password
          });
          
          if (loginResult?.success) {
            // Redirect to dashboard
            router.replace("/");
          } else {
            // If login fails after successful registration, redirect to login page
            router.replace("/login");
          }
        } else {
          setRegError(registrationResult?.message || "Registration failed. Please try again.");
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
                value={values.name}
                isInvalid={!!errors.name && !!touched.name}
                errorMessage={errors.name}
                onChange={handleChange("name")}
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
