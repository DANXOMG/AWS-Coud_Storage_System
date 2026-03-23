"use client";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast",
          success: "!bg-purple-900 !border-purple-700 !text-white",
          error: "!bg-red-950 !border-red-800 !text-white",
          warning: "!bg-yellow-950 !border-yellow-800 !text-yellow-100",
          info: "!bg-gray-900 !border-gray-700 !text-white",
          description: "!text-gray-300",
          actionButton: "!bg-purple-600 !text-white",
          cancelButton: "!bg-gray-700 !text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
