"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Tabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "Upload", href: "/upload" },
    { label: "Tracks", href: "/tracks" },
    { label: "Visualization", href: "/visualization" },
    { label: "Ai Insight", href: "/ai-insight" },
  ];

  return (
    <div className="flex space-x-4 border-b pb-2 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-t-md font-medium ${
              isActive
                ? "bg-white border border-b-0 border-gray-300 text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
