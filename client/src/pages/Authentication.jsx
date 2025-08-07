import React from "react";
import LoginForm from "../components/LoginForm";
import ThemeSwitcher from "../components/ThemeSwitcher";

const Authentication = () => {
  return (
    <div className="relative w-full h-full justify-center items-center flex flex-col">
      <LoginForm />
      <div className="absolute bottom-4 left-4">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Authentication;
