"use client";

import { loginUser, loginWithGoogle } from "@/actions/auth.action";
import { LoginSchema } from "@/helpers/schemas";
import { LoginFormType } from "@/helpers/types";
import { Button, Input } from "@heroui/react";
import { Formik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { DealpigText as AnimatedDealpigText } from "@/components/icons/AnimatedDealpigText";
import { MatrixBackground } from "@/components/ui/MatrixBackground";
import { Background } from "@/components/ui/Background";
import { LetterFx } from "@/components/ui/LetterFx";

export const Login = () => {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
          // The cookie is now set in the loginUser action
          router.replace("/");
        } else {
          setAuthError(result?.message || "Invalid credentials. Please check your email and password.");
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

  const handleGoogleLogin = useCallback(async () => {
    console.log('🚀 Starting Google login process...');
    setIsGoogleLoading(true);
    setAuthError(null);
    
    try {
      console.log('📡 Calling loginWithGoogle action...');
      const result = await loginWithGoogle();
      console.log('📥 Received result from loginWithGoogle:', result);
      
      if (result?.redirectUrl) {
        console.log('✅ Got redirect URL:', result.redirectUrl);
        // Redirect to Google OAuth consent screen
        window.location.href = result.redirectUrl;
      } else if (result?.error) {
        console.error('❌ Login error:', result.error);
        setAuthError(result.error);
      } else {
        console.error('❌ Unexpected result format:', result);
        setAuthError('Unexpected response from authentication service');
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setAuthError("Failed to initiate Google login. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  }, []);

  return (
    <>
      {/* Matrix Background */}
      <MatrixBackground />
      
      {/* Illumination mask */}
      <Background
        mask={{
          cursor: true,
          radius: 300 // Adjust this value to change the size of the illuminated area
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          zIndex: 1
        }}
      />

      {/* Login Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full mx-auto">
        <div className="mb-8 text-center">
          <AnimatedDealpigText width="316px" height="90px" className="mx-auto mb-4" />
          <p className="text-green-400 font-mono mt-2">Log in to access your campaigns</p>
        </div>

        {/* Google Login Button */}
        <div className="w-full mb-6">
          <Button
            type="button"
            variant="flat"
            className="w-full flex items-center justify-center gap-3 font-mono text-green-400 bg-black border border-green-400 rounded-none hover:bg-green-400 hover:text-black transition-colors duration-200"
            size="lg"
            onClick={handleGoogleLogin}
            isLoading={isGoogleLoading}
            isDisabled={isLoading || isGoogleLoading}
            startContent={
              !isGoogleLoading && (
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v3.6h5.41c-0.52,2.37-2.35,4.1-5.41,4.1c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.49,0,2.85,0.55,3.89,1.45 l2.91-2.91C17.16,3.54,14.71,2.5,12,2.5c-5.24,0-9.5,4.26-9.5,9.5s4.26,9.5,9.5,9.5c5.49,0,9.11-3.86,9.11-9.29 c0-0.62-0.05-1.21-0.16-1.79L21.35,11.1z" fill="#4285F4" />
                    <path d="M12,16c-1.93,0-3.5-1.57-3.5-3.5S10.07,9,12,9c0.95,0,1.81,0.38,2.44,1l2.08-2.08C15.19,6.68,13.7,6,12,6 c-3.59,0-6.5,2.91-6.5,6.5S8.41,19,12,19s6.5-2.91,6.5-6.5v-1.25H12V16z" fill="#34A853" />
                    <path d="M7.5,13.5c0-0.73,0.22-1.42,0.59-2L5.59,9C4.91,10.18,4.5,11.54,4.5,13c0,1.46,0.41,2.82,1.09,4l2.5-2.5 C7.72,14.92,7.5,14.23,7.5,13.5z" fill="#FBBC05" />
                    <path d="M12,4c1.93,0,3.68,0.78,4.95,2.05L19.53,3.4C17.56,1.56,14.93,0.5,12,0.5C7.86,0.5,4.27,2.9,2.58,6.42l2.5,2.5 C5.87,6.22,8.69,4,12,4z" fill="#EA4335" />
                  </g>
                </svg>
              )
            }
          >
            <span className={`font-medium ${isGoogleLoading ? 'opacity-0' : ''} font-mono`}>Continue with Google</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center mb-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="px-4 text-gray-500 text-sm font-medium">or continue with email</span>
          <div className="flex-grow border-t border-gray-200"></div>
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
                  autoComplete="current-password"
                  size="lg"
                  classNames={{
                    inputWrapper: "bg-black border-green-400 rounded-none",
                    input: "text-green-400 font-mono placeholder:text-green-400 placeholder:opacity-50",
                    label: "text-green-400 font-mono",
                  }}
                />
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {authError && (
                <div className="text-red-500 mb-4 text-center p-2 bg-red-50 rounded" role="alert">
                  {authError}
                </div>
              )}

              <Button
                type="submit"
                variant="solid"
                className="w-full mt-2 font-mono text-green-400 bg-black border border-green-400 rounded-none hover:bg-green-400 hover:text-black transition-colors duration-200"
                size="lg"
                isLoading={isLoading}
                isDisabled={isLoading || isGoogleLoading}
              >{isLoading ? "Logging in..." : "Login"}</Button>
            </form>
          )}
        </Formik>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary-600 font-medium hover:underline">
                Register here
              </Link>
            </p>
          <p className="mt-2">
            © {new Date().getFullYear()} DealPig - All rights reserved
          </p>
        </div>
      </div>
    </>
  );
};
