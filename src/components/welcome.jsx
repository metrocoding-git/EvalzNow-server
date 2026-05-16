"use client"

import Image from 'next/image';
import { useRouter } from 'next/navigation';
const loadingImg = "/images/welcome-image.jpg";

export default function Welcome() {
    const router = useRouter();

    const handleContinue = () => {
        router.push("/dashboard/control-view");
    };
    // const loggedInUser =
    // typeof window !== "undefined"
    //   ? JSON.parse(localStorage.getItem("user"))
    //   : null;

    // const isSuperAdmin = loggedInUser?.role === "super admin";
    // const isAdmin = loggedInUser?.role === "admin";
    // const isStaff = loggedInUser?.role === "staff";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Centered Image */}
      <div className="flex flex-1 flex-col justify-center items-center">
        <div className="relative w-[60vh] h-[50vh] mb-6">
          <Image
            src={loadingImg}
            alt="Loading background"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-2">
          EVALZNOW<span className="text-4xl"><sup>®</sup></span>
        </h1>

        {/* Subtext */}
        <p className="text-2xl text-gray-600 text-center mb-8">
          Human Capital Assessment Software <br /> Education & Industry
        </p>

        {/* Continue Button */}
        <button onClick={handleContinue} className="px-6 py-2 border-2 border-red-600 rounded-md transition-colors duration-200">
          Continue
        </button>
      </div>

      {/* Footer Section */}
      <div className="px-6 py-4 mt-auto text-left text-gray-600 text-sm">
        <p className="font-bold text-lg">2025</p>
        <p>Copyright 2025 Ricky Butler. All Rights Reserved</p>
      </div>
    </div>
  );
}
