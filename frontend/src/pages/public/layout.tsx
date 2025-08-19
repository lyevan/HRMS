import LandingNavbar from "@/components/navbars/landing-navbar";
const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {/* <nav>Nav bar here</nav>
      <header>
        <h1>Welcome to the HRMS</h1>
      </header> */}
      <LandingNavbar />
      <main className="container mx-auto px-4">{children}</main>
    </div>
  );
};

export default LandingLayout;
