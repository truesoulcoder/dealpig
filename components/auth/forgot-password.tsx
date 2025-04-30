"use client";

import { useState } from 'react';
import { Formik } from "formik";
import * as Yup from 'yup';
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import Image from "next/image";
import { RequestPasswordResetFormType } from "@/helpers/types";
import { requestPasswordReset } from "@/actions/auth.action";

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
        // This shouldn't happen with our current implementation, but just in case
        setMessage(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      // For security, we still show a success message 
      setIsSubmitted(true);
      setMessage('If your email exists in our system, you will receive password reset instructions shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
          <h1 className="text-2xl font-bold">Check Your Email</h1>
        </div>
        
        <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-md text-center">
          <p className="text-gray-700 mb-4">
            {message}
          </p>
          <p className="text-gray-700">
            Please check your inbox and follow the instructions to reset your password.
          </p>
        </div>
        
        <div className="w-full">
          <Link href="/login">
            <Button
              variant="flat"
              color="default"
              className="w-full"
              size="lg"
            >
              Return to Login
            </Button>
          </Link>
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
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="text-gray-500 mt-2">Enter your email to receive a password reset link</p>
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
              />
            </div>

            {message && (
              <div className="text-red-500 mb-4 text-center p-2 bg-red-50 rounded" role="alert">
                {message}
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
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </Formik>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Remember your password?{" "}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Back to Login
          </Link>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} DealPig - All rights reserved
        </p>
      </div>
    </div>
  );
};