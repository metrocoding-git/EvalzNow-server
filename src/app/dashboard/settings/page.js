"use client"

import { redirect, useRouter } from 'next/navigation';

export default function Settings() {
    const router = useRouter();
    const handleLogout = () => {
        localStorage.removeItem("token");  // remove JWT
        localStorage.removeItem("user");   // remove user info
        sessionStorage.removeItem("activeClientId");
        router.push("/login");             // redirect to login page
      };
    return(
        <div>
            {/* Right side: logout button (3/12) */}
            <div className=" m-3">
                <button onClick={handleLogout} className="bg-gray-300 px-2 py-1 hover:bg-gray-400 rounded"> Logout</button>
            </div>
        </div>
    )
}