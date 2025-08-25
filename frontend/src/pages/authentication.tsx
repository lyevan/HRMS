import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import LoginGraphics from "@/assets/login-graphics";
import { useUserSessionStore } from "@/store/userSessionStore";

export default function LoginPage() {
  const { isLoading } = useUserSessionStore();

  if (!isLoading) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2 2xl:grid-cols-3">
        <div className="flex flex-col gap-4 p-6 md:p-6 2xl:col-span-1">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Company
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs 2xl:max-w-lg">
              <div className="mb-6 flex flex-col gap-2">
                <p className="text-3xl font-normal 2xl:text-5xl mb-3">
                  Welcome back!
                </p>
                <h3 className="text-sm 2xl:text-lg font-[Nunito]">
                  Pick up right where you left off
                </h3>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="relative hidden lg:flex items-start justify-end 2xl:col-span-2">
          <LoginGraphics className="2xl:w-[990px] xl:w-[800px] lg:w-[600px] h-auto" />
        </div>
      </div>
    );
  }
}
