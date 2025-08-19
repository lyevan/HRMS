import { MenuIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router";

const LandingNavbar = () => {
  const navigate = useNavigate();
  const features = [
    {
      title: "Home",
      description: "Explore our homepage",
      href: "",
    },
    {
      title: "About",
      description: "Learn more about our company",
      href: "",
    },
    {
      title: "Our Services",
      description: "Explore what we offer",
      href: "",
    },
    {
      title: "Pricing",
      description: "Choose a plan that suits you",
      href: "",
    },
    {
      title: "Testimonials",
      description: "Hear from our satisfied customers",
      href: "",
    },
    {
      title: "Contact Us",
      description: "Get help when needed",
      href: "",
    },
  ];

  return (
    <section className="py-4 sticky h-17 flex justify-center top-0 mb-4 z-99999 bg-background-accent">
      <div className="container">
        <nav className="flex items-center justify-between px-2 w-full">
          <a href="" className="flex items-center gap-2">
            <img
              src="https://shop.raceya.fit/wp-content/uploads/2020/11/logo-placeholder.jpg"
              className="max-h-8"
              alt="Shadcn UI Navbar"
            />
            <span className="text-lg text-primary-foreground font-semibold tracking-tighter">
              Company Name
            </span>
          </a>
          <NavigationMenu className="hidden lg:block">
            <NavigationMenuList>
              {features.map((feature, index) => (
                <NavigationMenuItem key={index} className="">
                  <NavigationMenuLink
                    href={feature.href}
                    className="hover:bg-primary-foreground/10 hover:text-primary-foreground focus:bg-primary-foreground/10 focus:text-primary-foreground text-primary-foreground"
                  >
                    {feature.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden items-center gap-4 lg:flex">
            <Button
              variant="outline"
              className="hover:bg-background cursor-pointer"
              onClick={() => navigate("/auth")}
            >
              Sign in
            </Button>
            <Button className="bg-accent hover:bg-accent/95 cursor-pointer text-accent-foreground">
              Book a Demo
            </Button>
          </div>
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Sign in
                </Button>
                <Button variant="outline" size="icon" className="bg-accent">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-screen overflow-auto">
              <div className="pt-20 flex flex-col p-4 gap-4">
                {features.map((feature, index) => (
                  <a key={index} href="#" className="font-medium">
                    {feature.title}
                  </a>
                ))}
                <div className="mt-6 flex flex-col gap-4">
                  <Button>Book a Demo</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </section>
  );
};

export default LandingNavbar;
