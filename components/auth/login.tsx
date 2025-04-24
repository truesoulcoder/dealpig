"use client";

import { createAuthCookie, loginUser } from "@/actions/auth.action";
import { LoginSchema } from "@/helpers/schemas";
import { LoginFormType } from "@/helpers/types";
import { Button, Input } from "@heroui/react";
import { Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export const Login = () => {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initialValues: LoginFormType = {
    email: "",
    password: "",
  };

  const handleLogin = useCallback(
    async (values: LoginFormType) => {
      setIsLoading(true);
      setAuthError(null);
      
      try {
        // Call loginUser action to authenticate
        const result = await loginUser(values);
        
        if (result?.success) {
          await createAuthCookie();
          router.replace("/");
        } else {
          setAuthError("Invalid credentials. Please check your email and password.");
        }
      } catch (error) {
        console.error("Login error:", error);
        setAuthError("Unexpected server error. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <div className="flex flex-col items-center max-w-md w-full mx-auto">
      <div className="mb-8 text-center">
        <img 
          src="/logo.png" 
          alt="DealPig Logo" 
          className="h-16 mx-auto mb-4" 
        />
        <h1 className="text-2xl font-bold">Welcome to DealPig</h1>
        <p className="text-gray-500 mt-2">Log in to access your campaigns</p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}>
        {({ values, errors, touched, handleChange, handleSubmit, status }) => (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full">
            <div className="flex flex-col gap-4 mb-4 w-full">
              <Input
                variant="bordered"
                label="Email"
                type="email"
                value={values.email}
                isInvalid={!!errors.email && !!touched.email}
                errorMessage={errors.email}
                onChange={handleChange("email")}
                isDisabled={isLoading}
                autoComplete="username"
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
                autoComplete="current-password"
                size="lg"
              />
            </div>

            {authError && (
              <div className="text-red-500 mb-4 text-center p-2 bg-red-50 rounded" role="alert">
                {authError}
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
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        )}
      </Formik>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Don't have an account?{" "}
          <Link href="/register" className="text-primary-600 font-medium hover:underline">
            Register here
          </Link>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} DealPig - All rights reserved
        </p>
      </div>
    </div>
  );
};
