"use client";

import { usePathname, useRouter } from "next/navigation";

export default function BottomRibbon({  activeButton, formStatus }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Simple function to determine active tab from URL
  const getActiveTabFromPath = () => {
    if (pathname.includes('/analytics-view/data-reports')) return 'Data Reports';
    if (pathname.includes('/analytics-view/data-extractions')) return 'Data Extractions';
    if (pathname.includes('/analytics-view/global-analytics')) return 'Global Analytics';
    if (pathname.includes('/analytics-view')) return 'Analytics View';
    if (pathname.includes('/setup-view')) return 'Setup View';
    return 'Control View'; // default
  };

  const activeTab = getActiveTabFromPath();
  console.log("active tab:", activeTab);

  const handleLogout = () => {
    localStorage.removeItem("token");  // remove JWT
    localStorage.removeItem("user");   // remove user info
    router.push("/login");             // redirect to login page
  };

  return (
    <div className="w-full bg-gray-200 shadow-sm text-sm font-medium border border-black mt-1 p-2 grid grid-cols-12 items-center">
      {/* Left side: formStatus + activeTab (9/12) */}
      <div className="col-span-9 flex space-x-4 justify-between">
        <p className="text-sm text-gray-700">{formStatus || "Ready..."}</p>
        <p className="text-sm text-gray-700">{activeTab}</p>
      </div>

      {/* Right side: logout button (3/12) */}
      {/* <div className="col-span-3 flex justify-end mr-3">
        <button onClick={handleLogout} className="bg-gray-300 px-2 py-1 hover:bg-gray-400 rounded"> Logout</button>
      </div> */}
    </div>
  );
}
