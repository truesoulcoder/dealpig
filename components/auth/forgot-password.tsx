"use client";

import { useState, useEffect } from 'react';
import { Formik } from "formik";
import * as Yup from 'yup';
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { RequestPasswordResetFormType } from "@/helpers/types";
import { requestPasswordReset } from "@/actions/auth.action";
import { MatrixBackground } from "@/components/ui/MatrixBackground";
import { DealpigText as AnimatedDealpigText } from "@/components/icons/AnimatedDealpigText";
import { LetterFx } from "@/components/ui/LetterFx";

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

export const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [visibleTexts, setVisibleTexts] = useState({
    title: false,
    subtitle: false,
    footer: false
  });

  useEffect(() => {
    // Sequence of text reveals with delays
    const timers = [
      setTimeout(() => setVisibleTexts(prev => ({ ...prev, title: true })), 2000),
      setTimeout(() => setVisibleTexts(prev => ({ ...prev, subtitle: true })), 3000),
      setTimeout(() => setVisibleTexts(prev => ({ ...prev, footer: true })), 4000)
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const initialValues: RequestPasswordResetFormType = {
    email: "",
  };

  const handleRequestReset = async (values: RequestPasswordResetFormType) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await requestPasswordReset(values.email);
      
      if (result.success) {
        setIsSubmitted(true);
        setMessage(result.message);
      } else {
        setMessage(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      setIsSubmitted(true);
      setMessage('If your email exists in our system, you will receive password reset instructions shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <MatrixBackground />
        <div className="relative z-10 flex flex-col items-center max-w-md w-full mx-auto">
          <div className="mb-8 text-center">
            <AnimatedDealpigText width="316px" height="90px" className="mx-auto mb-4" />
            <LetterFx trigger="instant" speed="fast" className="text-green-400 font-mono text-2xl">
              Check Your Email
            </LetterFx>
          </div>
          
          <div className="p-4 mb-6 bg-black/50 border border-green-400 rounded-none w-full">
            <LetterFx trigger="instant" speed="fast" className="text-green-400 font-mono mb-4">
              {message}
            </LetterFx>
            <LetterFx trigger="instant" speed="fast" className="text-green-400/80 font-mono">
              Please check your inbox and follow the instructions to reset your password.
            </LetterFx>
          </div>
          
          <div className="w-full">
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
      </>
    );
  }

  return (
    <>
      <MatrixBackground />
      <div className="relative z-10 flex flex-col items-center max-w-md w-full mx-auto">
        <div className="mb-8 text-center">
          <AnimatedDealpigText width="316px" height="90px" className="mx-auto mb-4" />
          {visibleTexts.title && (
            <LetterFx trigger="instant" speed="fast" className="text-green-400 font-mono text-2xl">
              Reset Your Password
            </LetterFx>
          )}
          {visibleTexts.subtitle && (
            <LetterFx trigger="instant" speed="fast" className="text-green-400/80 font-mono mt-2">
              Enter your email to receive a password reset link
            </LetterFx>
          )}
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleRequestReset}>
          {({ values, errors, touched, handleChange, handleSubmit }) => (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full">
              <div className="flex flex-col gap-4 mb-6 w-full">
                <Input
                  variant="bordered"
                  label="Email"
                  type="email"
                  value={values.email}
                  isInvalid={!!errors.email && !!touched.email}
                  errorMessage={errors.email}
                  onChange={handleChange("email")}
                  isDisabled={isLoading}
                  size="lg"
                  autoComplete="email"
                  classNames={{
                    inputWrapper: "bg-black border-green-400 rounded-none",
                    input: "text-green-400 font-mono placeholder:text-green-400 placeholder:opacity-50",
                    label: "text-green-400 font-mono",
                  }}
                />
              </div>

              {message && (
                <div className="text-red-500 mb-4 text-center p-2 bg-red-950/50 rounded-none border border-red-500 font-mono" role="alert">
                  {message}
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
                  {isLoading ? "Sending Link..." : "Send Reset Link"}
                </LetterFx>
              </Button>
            </form>
          )}
        </Formik>

        <div className="mt-6 text-center text-sm font-mono">
          {visibleTexts.footer && (
            <>
              <p className="text-green-400">
                <LetterFx trigger="instant" speed="fast">
                  Remember your password?{" "}
                  <Link href="/login" className="text-green-300 hover:text-green-200 hover:underline">
                    <LetterFx trigger="hover" speed="fast" className="inline-block">
                      Back to Login
                    </LetterFx>
                  </Link>
                </LetterFx>
              </p>
              <p className="mt-2">
                <LetterFx trigger="instant" speed="fast" className="text-green-400/80">
                  © {new Date().getFullYear()} DealPig - All rights reserved
                </LetterFx>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};