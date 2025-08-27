import type { Employee } from "@/models/employee-model";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Eye, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";

const handleAvatarClick = () => {
  toast.info("Avatar click functionality to be implemented");
};

const options = [
  { value: "view", label: "See Image", icon: Eye },
  { value: "upload", label: "Choose New Image", icon: Upload },
  { value: "remove", label: "Remove Image", icon: Trash2 },
];

const AvatarSection = ({ employee }: { employee: Employee | null }) => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="h-40 w-40 focus:border-primary focus:border-2 bg-card border border-foreground text-foreground flex items-center justify-center text-2xl rounded-full relative group cursor-pointer">
            {employee?.avatar_url ? (
              <img src={employee.avatar_url} alt="Employee Avatar" />
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
            {options.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="w-full justify-start"
                disabled={!employee?.avatar_url && option.value !== "upload"}
              >
                {option.icon && <option.icon className="mr-2" />}
                {option.label}
              </Button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="h-40 w-40 bg-card border border-foreground text-foreground flex items-center justify-center text-2xl rounded-full relative group cursor-pointer">
          {employee?.avatar_url ? (
            <img src={employee.avatar_url} alt="Employee Avatar" />
          ) : (
            <>
              {employee?.first_name.charAt(0)}
              {employee?.last_name.charAt(0)}
            </>
          )}
          <div className="absolute bg-card/95 transition duration-300 rounded-full w-full h-full flex justify-center items-center bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2 opacity-0 group-hover:opacity-100">
            <Pencil />
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={!employee?.avatar_url && option.value !== "upload"}
            onSelect={handleAvatarClick}
          >
            {option.icon && <option.icon className="mr-2" />}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarSection;
