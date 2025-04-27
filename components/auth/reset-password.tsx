"use client";

import { useState } from 'react';
import { Formik } from "formik";
import * as Yup from 'yup';
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import Image from "next/image";
import { ResetPasswordFormType } from "@/helpers/types";
import { resetPassword } from "@/actions/auth.action";
import { useRouter } from "next/navigation";

// Validation schema with password strength requirements
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
      'Password must include uppercase, lowercase, number, and special character'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export const ResetPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialValues: ResetPasswordFormType = {
    password: "",
    confirmPassword: "",
  };

  const handleResetPassword = async (values: ResetPasswordFormType) => {
    setIsLoading(true);
    setErrorMessage(null);
    setMessage(null);
    
    try {
      const result = await resetPassword(values.password);
      
      if (result.success) {
        setResetSuccess(true);
        setMessage(result.message || 'Your password has been successfully reset.');
      } else {
        setErrorMessage(result.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorMessage('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
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
          <h1 className="text-2xl font-bold">Password Reset Complete</h1>
        </div>
        
        <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-md text-center">
          <p className="text-gray-700 mb-4">
            {message}
          </p>
          <p className="text-gray-700">
            You can now log in with your new password.
          </p>
        </div>
        
        <div className="w-full">
          <Link href="/login">
            <Button
              color="primary"
              className="w-full"
              size="lg"
            >
              Go to Login
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
        <h1 className="text-2xl font-bold">Create New Password</h1>
        <p className="text-gray-500 mt-2">Enter a new secure password for your account</p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={ResetPasswordSchema}
        onSubmit={handleResetPassword}>
        {({ values, errors, touched, handleChange, handleSubmit }) => (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full">
            <div className="flex flex-col gap-4 mb-4 w-full">
              <Input
                variant="bordered"
                label="New Password"
                type="password"
                value={values.password}
                isInvalid={!!errors.password && !!touched.password}
                errorMessage={errors.password}
                onChange={handleChange("password")}
                isDisabled={isLoading}
                size="lg"
                autoComplete="new-password"
              />
              <Input
                variant="bordered"
                label="Confirm New Password"
                type="password"
                value={values.confirmPassword}
                isInvalid={!!errors.confirmPassword && !!touched.confirmPassword}
                errorMessage={errors.confirmPassword}
                onChange={handleChange("confirmPassword")}
                isDisabled={isLoading}
                size="lg"
                autoComplete="new-password"
              />
            </div>

            {errorMessage && (
              <div className="text-red-500 mb-4 text-center p-2 bg-red-50 rounded" role="alert">
                {errorMessage}
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
              {isLoading ? "Updating Password..." : "Reset Password"}
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