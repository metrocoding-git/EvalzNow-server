"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStaffById } from "@/services/staffService";

const tabs = [
  { label: "Admin", path: "/dashboard/control-view/admin" },
  { label: "Staff", path: "/dashboard/control-view/staff" },
  { label: "Candidate", path: "/dashboard/control-view/candidate" },
  { label: "Unit", path: "/dashboard/control-view/unit" }
];

export default function ControlViewLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const loggedInUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user"))
      : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState();

  const isSuperAdmin = loggedInUser?.role === "super admin";
  const isAdmin = loggedInUser?.role === "admin";
  const isStaff = loggedInUser?.role === "staff";

  // Fetch staff data only if logged-in user is staff
  useEffect(() => {
    if (!isStaff) return;

    const fetchStaffById = async () => {
      try {
        setLoading(true);
        const data = await getStaffById(loggedInUser?.staffId);
        setStaff(data);
        console.log("Staff data:", data);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        setError("Failed to load staff data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffById();
  }, [loggedInUser?.staffId, isStaff]);

  // Determine visible tabs based on role / access level
  const visibleTabs = tabs.filter((tab) => {
    if (isSuperAdmin) {
      // Super admin sees all tabs
      return true;
    }

    if (isAdmin) {
      // Admin sees Staff, Candidate, Unit
      return tab.label !== "Admin";
    }

    if (isStaff) {
      // if (staff?.accessLevel === "Full Access") {
        // Staff Full Access sees Staff, Candidate, Unit
        return tab.label !== "Admin" && tab.label !== "Staff";
      // } else if (staff?.accessLevel === "Leaders Access") {
        // Staff Leaders Access sees only Candidate + Unit
      //   return tab.label === "Unit";
      // }
    }

    // Default: hide all tabs
    return false;
  });

  const currentTab =
    visibleTabs.find((tab) => pathname?.startsWith(tab.path))?.label ||
    visibleTabs[0]?.label;

  const [activeTab, setActiveTab] = useState(currentTab);

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
      router.replace("/login");
    }
  }, [router]);

  // Redirect to first visible tab if current path is invalid
  useEffect(() => {
    const isValidPath = visibleTabs.some((tab) =>
      pathname?.startsWith(tab.path)
    );
    if (!isValidPath && visibleTabs.length > 0) {
      router.replace(visibleTabs[0].path);
    }
  }, [pathname, visibleTabs, router]);

  return (
    <div className="w-full flex flex-col">
      <div className="h-full flex flex-col overflow-hidden m-0.5 border-1 border-gray-200">
        {/* Tab buttons */}
        <div className="flex space-x-0 border-b border-gray-200 bg-gray-50 mt-1.5">
          {visibleTabs.map((tab, index) => (
            <Link href={tab.path} key={index}>
              <span
                onClick={() => setActiveTab(tab.label)}
                className={
                  `relative px-5 py-2 text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer ` +
                  (activeTab === tab.label
                    ? "text-black bg-white border-t-2 border-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 border-t border-r border-b-transparent border-gray-300 hover:bg-white")
                }
              >
                {tab.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Active tab content */}
        <div className="flex-1 overflow-auto bg-white border border-t-0 border-gray-300 p-1">
          <div className="flex flex-col h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
