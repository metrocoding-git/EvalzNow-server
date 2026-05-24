import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsButton({ active }) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");  // remove JWT
        localStorage.removeItem("user");   // remove user info
        router.push("/login");             // redirect to login page
    };

  return (
    <button onClick={() => router.push("/dashboard/settings")} className={
        `group flex flex-col gap-1 justify-center items-center h-18 w-19 p-1 rounded-md cursor-pointer shadow-md hover:shadow-md 
        hover:bg-gray-200 transition-all duration-200 ease-in-out ${active ? "bg-gray-200" : ""} `}>
      <Settings className="h-8 w-8 object-contain transition-transform group-hover:scale-110 text-[#1223d0]" />
      <p className="mt-1 text-xs text-gray-700 font-thin group-hover:text-gray-800 text-center hover:font-bold">Settings</p>
    </button>
  );
}
