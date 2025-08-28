import type { Employee } from "@/models/employee-model";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Pencil, Eye, Upload, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  useSelectedEmployee,
  useSetSelectedEmployee,
  useUpdateEmployee,
  useFetchEmployees,
} from "@/store/employeeStore";
import Modal from "./modal";

interface AvatarSectionProps {
  employee?: Employee | null;
  onEmployeeUpdate?: (updatedEmployee: Employee) => void;
  setViewImageOpen: (open: boolean) => void;
}

const AvatarSection = ({
  employee: propEmployee,
  onEmployeeUpdate,
  setViewImageOpen,
}: AvatarSectionProps) => {
  const isMobile = useIsMobile();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Add drawer state control
  const [isDeleteImageOpen, setDeleteImageOpen] = useState(false); // State for delete confirmation modal

  const options = [
    {
      value: "view",
      label: "See Image",
      icon: Eye,
      onClick: () => {
        setViewImageOpen(true);
      },
    },
    {
      value: "upload",
      label: "Choose New Image",
      icon: Upload,
      onClick: () => {},
    },
    {
      value: "remove",
      label: "Remove Image",
      icon: Trash2,
      onClick: () => {
        setDeleteImageOpen(true);
      },
    },
  ];

  // Use Zustand store hooks
  const selectedEmployee = useSelectedEmployee();
  const setSelectedEmployee = useSetSelectedEmployee();
  const updateEmployee = useUpdateEmployee();
  const fetchEmployees = useFetchEmployees();

  // Use selectedEmployee from store, fallback to prop
  const displayedEmployee = selectedEmployee || propEmployee;

  // Set the employee in store if prop changes
  useEffect(() => {
    if (propEmployee && propEmployee !== selectedEmployee) {
      setSelectedEmployee(propEmployee);
    }
  }, [propEmployee, selectedEmployee, setSelectedEmployee]);

  const handleUpload = async () => {
    if (!avatarFile || !displayedEmployee) {
      toast.error("Please select an image file to upload.");
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("avatar", avatarFile);
    uploadFormData.append("employeeId", displayedEmployee.employee_id);

    try {
      setIsUploading(true);
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
      setIsDrawerOpen(false); // Close drawer after successful upload

      const updatedEmployeeData = response.data.data;
      const updatedEmployee = {
        ...displayedEmployee,
        ...updatedEmployeeData,
        avatar_url: `${updatedEmployeeData.avatar_url}?v=${Date.now()}`,
      };

      updateEmployee(updatedEmployee);
      onEmployeeUpdate?.(updatedEmployee);

      setTimeout(() => {
        fetchEmployees(true);
      }, 500);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB.");
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setAvatarFile(null); // Reset file selection when closing
  };

  const handleDeleteImage = async () => {
    try {
      setIsDeleting(true);
      handleDrawerClose();
      const result = await axios.delete(
        `employees/delete-avatar/${displayedEmployee?.employee_id}`
      );
      if (result.data.success) {
        toast.success("Avatar deleted successfully.");
        setDeleteImageOpen(false);
        // Refresh the employee data here similar to how handleUpload
        if (displayedEmployee) {
          const updatedEmployee = {
            ...displayedEmployee,
            avatar_url: null,
          };
          updateEmployee(updatedEmployee);
          onEmployeeUpdate?.(updatedEmployee);
        }

        setTimeout(() => {
          fetchEmployees(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("An error occurred while deleting the avatar.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isMobile) {
    return (
      <>
        <Modal
          open={isDeleteImageOpen}
          setOpen={setDeleteImageOpen}
          title="Remove Profile Image"
          description=""
        >
          <p>Are you sure you want to remove this profile image?</p>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteImageOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="ml-2"
              disabled={isDeleting}
              onClick={() => {
                handleDeleteImage();
              }}
            >
              Remove
            </Button>
          </div>
        </Modal>
        <Drawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          onClose={handleDrawerClose}
          dismissible={!isUploading}
        >
          <DrawerTrigger asChild>
            <Button
              className="h-40 w-40 focus:border-primary focus:border-2 bg-card border border-foreground text-foreground flex items-center justify-center text-2xl rounded-full relative group cursor-pointer"
              onClick={() => setIsDrawerOpen(true)}
              aria-label={`Change avatar for ${displayedEmployee?.first_name} ${displayedEmployee?.last_name}`}
            >
              {displayedEmployee?.avatar_url ? (
                <img
                  src={`${displayedEmployee.avatar_url}?v=${Date.now()}`}
                  alt="Employee Avatar"
                  className="w-39 h-39 object-cover object-center rounded-full absolute bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2"
                  onError={(e) => {
                    console.error("Image failed to load:", e.currentTarget.src);
                  }}
                />
              ) : (
                <>
                  {displayedEmployee?.first_name?.charAt(0)}
                  {displayedEmployee?.last_name?.charAt(0)}
                </>
              )}
              <div className="absolute bg-card/95 transition duration-300 rounded-full w-full h-full flex justify-center items-center bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100">
                <Pencil aria-hidden="true" />
              </div>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
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
                        disabled={isUploading}
                        aria-label={
                          avatarFile
                            ? `Selected: ${avatarFile.name}`
                            : option.label
                        }
                      >
                        {option.icon && (
                          <option.icon className="mr-2" aria-hidden="true" />
                        )}
                        {avatarFile ? `Image Selected ✔` : option.label}

                        <input
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={isUploading}
                          aria-label="Choose image file"
                        />
                      </Button>

                      {avatarFile && (
                        <>
                          <Button
                            className="flex-1"
                            onClick={handleUpload}
                            disabled={isUploading}
                            aria-label="Upload selected image"
                          >
                            {isUploading ? (
                              <>
                                <div
                                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"
                                  aria-hidden="true"
                                ></div>
                                Uploading
                              </>
                            ) : (
                              "Upload"
                            )}
                          </Button>
                          <Button
                            size={"icon"}
                            variant="destructive"
                            onClick={() => setAvatarFile(null)}
                            disabled={isUploading}
                            aria-label="Remove selected file"
                          >
                            <Trash2 aria-hidden="true" />
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
                    onClick={option.onClick}
                    disabled={
                      (!displayedEmployee?.avatar_url &&
                        option.value !== "upload") ||
                      isUploading ||
                      avatarFile !== null
                    }
                    aria-label={option.label}
                  >
                    {option.icon && (
                      <option.icon className="mr-2" aria-hidden="true" />
                    )}
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop version with same fixes
  return (
    <>
      <Modal
        open={isDeleteImageOpen}
        setOpen={setDeleteImageOpen}
        title="Remove Profile Image"
        description=""
      >
        <p>Are you sure you want to remove this profile image?</p>
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => setDeleteImageOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="ml-2"
            disabled={isDeleting}
            onClick={() => {
              handleDeleteImage();
            }}
          >
            {isDeleting ? (
              <>
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"
                  aria-hidden="true"
                ></div>
                Removing
              </>
            ) : (
              "Remove"
            )}
          </Button>
        </div>
      </Modal>
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onClose={handleDrawerClose}
        dismissible={!isUploading}
      >
        <DrawerTrigger asChild>
          <Button
            className="h-40 w-40 focus:border-primary focus:border-2 bg-card border border-foreground text-foreground flex items-center justify-center text-2xl rounded-full relative group cursor-pointer"
            onClick={() => setIsDrawerOpen(true)}
            aria-label={`Change avatar for ${displayedEmployee?.first_name} ${displayedEmployee?.last_name}`}
          >
            {displayedEmployee?.avatar_url ? (
              <img
                src={`${displayedEmployee.avatar_url}?v=${Date.now()}`}
                alt="Employee Avatar"
                className="w-39 h-39 object-cover object-center rounded-full absolute bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2"
                onError={(e) => {
                  console.error("Image failed to load:", e.currentTarget.src);
                }}
              />
            ) : (
              <>
                {displayedEmployee?.first_name?.charAt(0)}
                {displayedEmployee?.last_name?.charAt(0)}
              </>
            )}
            <div className="absolute bg-card/95 transition duration-300 rounded-full w-full h-full flex justify-center items-center bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100">
              <Pencil aria-hidden="true" />
            </div>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Avatar Options</DrawerTitle>
            <DrawerDescription>
              Choose an option to manage the employee's avatar.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-2 p-4">
            {/* Same content as mobile version */}
            {options.map((option) => {
              if (option.value === "upload") {
                return (
                  <div key={option.value} className="flex flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 justify-start relative"
                      disabled={isUploading}
                      aria-label={
                        avatarFile
                          ? `Selected: ${avatarFile.name}`
                          : option.label
                      }
                    >
                      {option.icon && (
                        <option.icon className="mr-2" aria-hidden="true" />
                      )}
                      {avatarFile ? (
                        <>
                          Image Selected
                          <Check className="text-green-500 w-4 h-4" />
                        </>
                      ) : (
                        option.label
                      )}

                      <input
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        aria-label="Choose image file"
                      />
                    </Button>

                    {avatarFile && (
                      <>
                        <Button
                          className="flex-1"
                          onClick={handleUpload}
                          disabled={isUploading}
                          aria-label="Upload selected image"
                        >
                          {isUploading ? (
                            <>
                              <div
                                className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"
                                aria-hidden="true"
                              ></div>
                              Uploading
                            </>
                          ) : (
                            "Upload"
                          )}
                        </Button>
                        <Button
                          size={"icon"}
                          variant="destructive"
                          onClick={() => setAvatarFile(null)}
                          disabled={isUploading}
                          aria-label="Remove selected file"
                        >
                          <Trash2 aria-hidden="true" />
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
                  onClick={option.onClick}
                  disabled={
                    (!displayedEmployee?.avatar_url &&
                      option.value !== "upload") ||
                    isUploading ||
                    avatarFile !== null
                  }
                  aria-label={option.label}
                >
                  {option.icon && (
                    <option.icon className="mr-2" aria-hidden="true" />
                  )}
                  {option.label}
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default AvatarSection;
