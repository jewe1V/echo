import { Toaster as Sonner, ToasterProps } from "src/app/components/ui/sonner.tsx";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#1A1A1A",
          color: "#E0E0E0",
          border: "1px solid #2A2A2A",
          borderRadius: "12px",
        },
        classNames: {
          success: "success-toast",
          error: "error-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
