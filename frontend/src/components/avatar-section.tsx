import type { Employee } from "@/models/employee-model";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Pencil, Eye, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { useState } from "react";
import axios from "axios";
import { useEmployees } from "@/hooks/useEmployees";

const options = [
  { value: "view", label: "See Image", icon: Eye, onClick: () => {} },
  {
    value: "upload",
    label: "Choose New Image",
    icon: Upload,
    onClick: () => {},
  },
  { value: "remove", label: "Remove Image", icon: Trash2, onClick: () => {} },
];

const AvatarSection = ({ employee }: { employee: Employee | null }) => {
  const isMobile = useIsMobile();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { refetch } = useEmployees();

  const handleUpload = async () => {
    if (!avatarFile) {
      toast.error("Please select an image file to upload.");
      return;
    }

    // Create FormData directly instead of using state
    const uploadFormData = new FormData();
    uploadFormData.append("avatar", avatarFile);
    uploadFormData.append("employeeId", employee?.employee_id || "");

    console.log("Uploading file:", {
      fileName: avatarFile.name,
      fileSize: avatarFile.size,
      fileType: avatarFile.type,
      employeeId: employee?.employee_id,
    });

    try {
      const response = await axios.post(
        `/employees/upload-avatar`,
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Avatar uploaded successfully.");
      setAvatarFile(null);

      // Optional: Update the employee data if you have a way to refresh it

      console.log("Upload response:", response.data);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload avatar.");
    } finally {
      refetch();
    }
  };

  if (isMobile) {
    return (
      <Drawer
        onClose={() => {
          setAvatarFile(null);
        }}
      >
        <DrawerTrigger asChild>
          <Button className="h-40 w-40 focus:border-primary focus:border-2 bg-card border border-foreground text-foreground flex items-center justify-center text-2xl rounded-full relative group cursor-pointer">
            {employee?.avatar_url ? (
              <img src={employee.avatar_url} alt="Employee Avatar" className="object-cover w-full h-full rounded-full" />
            ) : (
              <>
                {employee?.first_name.charAt(0)}
                {employee?.last_name.charAt(0)}
              </>
            )}
            <div className="absolute bg-card/95 transition duration-300 rounded-full w-full h-full flex justify-center items-center bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100">
              <Pencil />
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Avatar Options</DrawerTitle>
            <DrawerDescription>
              Choose an option to manage the employee's avatar.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-2 p-4">
            {options.map((option) => {
              if (option.value === "upload") {
                return (
                  <div key={option.value} className="flex flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 justify-start relative"
                      disabled={
                        !employee?.avatar_url && option.value !== "upload"
                      }
                    >
                      {option.icon && <option.icon className="mr-2" />}
                      {avatarFile ? "Image Selected" : option.label}

                      <input
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                          }
                        }}
                      />
                    </Button>

                    {avatarFile && (
                      <>
                        <Button className="flex-1" onClick={handleUpload}>
                          Upload
                        </Button>
                        <Button
                          size={"icon"}
                          variant="destructive"
                          onClick={() => setAvatarFile(null)}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                  </div>
                );
              }
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!employee?.avatar_url && option.value !== "upload"}
                >
                  {option.icon && <option.icon className="mr-2" />}
                  {option.label}
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Drawer
      onClose={() => {
        setAvatarFile(null);
      }}
    >
      <DrawerTrigger asChild>
        <Button className="h-40 w-40 focus:border-primary focus:border-2 bg-card border border-foreground text-foreground flex items-center justify-center text-2xl rounded-full relative group cursor-pointer">
          {employee?.avatar_url ? (
            <img src={employee.avatar_url} alt="Employee Avatar" className="w-39 h-39 object-cover object-center rounded-full absolute bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2" />
          ) : (
            <>
              {employee?.first_name.charAt(0)}
              {employee?.last_name.charAt(0)}
            </>
          )}
          <div className="absolute bg-card/95 transition duration-300 rounded-full w-full h-full flex justify-center items-center bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100">
            <Pencil />
          </div>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Avatar Options</DrawerTitle>
          <DrawerDescription>
            Choose an option to manage the employee's avatar.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 p-4">
          {options.map((option) => {
            if (option.value === "upload") {
              return (
                <div key={option.value} className="flex flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 justify-start relative"
                    disabled={
                      !employee?.avatar_url && option.value !== "upload"
                    }
                  >
                    {option.icon && <option.icon className="mr-2" />}
                    {avatarFile ? "Image Selected" : option.label}

                    <input
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                        }
                      }}
                    />
                  </Button>

                  {avatarFile && (
                    <>
                      <Button className="flex-1" onClick={handleUpload}>
                        Upload
                      </Button>
                      <Button
                        size={"icon"}
                        variant="destructive"
                        onClick={() => setAvatarFile(null)}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </div>
              );
            }
            return (
              <Button
                key={option.value}
                variant="outline"
                className="w-full justify-start"
                disabled={!employee?.avatar_url && option.value !== "upload"}
              >
                {option.icon && <option.icon className="mr-2" />}
                {option.label}
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AvatarSection;
