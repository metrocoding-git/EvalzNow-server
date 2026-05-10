"use client";

import IconButton from "./IconButton";
import SettingsButton from "./SettingsButton";
import SubIconButton from "./SubIconButton";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

const ribbonItems = [
  {
    path: "/icons/Control_View.png",
    label: "Control View",
    link: "/dashboard/control-view",
  },
  {
    path: "/icons/Setup_View.png",
    label: "Setup View",
    link: "/dashboard/setup-view",
  },
  {
    path: "/icons/Analytics_View.png",
    label: "Analytics View",
    link: "/dashboard/analytics-view",
  },
];

// Categorized analytics items
const analyticCategories = [
  {
    name: "Preliminaries",
    items: [
      {
        path: "/icons/Scoring_Trends.png",
        label: "Scoring Trends",
        link: "/dashboard/analytics-view/scoring-trends",
        type: false,
      },
      {
        path: "/icons/Tabulation_Tables.png",
        label: "Tabulation Tables",
        link: "/dashboard/analytics-view/tabulation-tables",
        type: false,
      },
    ],
  },
  {
    name: "Essentials",
    items: [
      {
        path: "/icons/Proficiency_Metrics.png",
        label: "Proficiency Metrics",
        link: "/dashboard/analytics-view/proficiency-metrics",
        type: false,
      },
      {
        path: "/icons/Growth_Metrics.png",
        label: "Growth Metrics",
        link: "/dashboard/analytics-view/growth-metrics",
        type: false,
      },
      {
        path: "/icons/Hybrid_Metrics.png",
        label: "Hybrid Metrics",
        link: "/dashboard/analytics-view/hybrid-metrics",
        type: false,
      },
    ],
  },
  {
    name: "Formatives",
    items: [
      {
        path: "/icons/Unit_Distributions.png",
        label: "Unit Distributions",
        link: "/dashboard/analytics-view/unit-distributions",
        type: false,
      },
      {
        path: "/icons/Auxiliary_Resultants.png",
        label: "Auxiliary Resultants",
        link: "/dashboard/analytics-view/auxiliary-resultants",
        type: false,
      },
      {
        path: "/icons/Neuroscience_Tools.png",
        label: "Neuroscience Tools",
        link: "/dashboard/analytics-view/neuroscience-tools",
        type: false,
      },
      {
        path: "/icons/Global_Analytics.png",
        label: "Global Analytics",
        link: "/dashboard/analytics-view/global-analytics",
        type: true,
      },
    ],
  },
  {
    name: "Outputs",
    items: [
      {
        path: "/icons/Data_Extractions.png",
        label: "Data Extractions",
        link: "/dashboard/analytics-view/data-extractions",
        type: true,
      },
      {
        path: "/icons/Data_Reports.png",
        label: "Data Reports",
        link: "/dashboard/analytics-view/data-reports",
        type: true,
      },
      {
        component: SettingsButton, // use the React component directly
        label: "Settings",
        link: "/dashboard/settings",
        type: true,
        color: "blue",
      }
    ],
  },
];

export default function RibbonPanel() {
  const router = useRouter();
  const pathname = usePathname();

  const { activeTab, activeButton } = useMemo(() => {
    // Check if current path matches any analytics item
    for (const category of analyticCategories) {
      const matchedAnalytic = category.items.find((item) =>
        pathname.startsWith(item.link)
      );
      if (matchedAnalytic)
        return { activeTab: "Analytics View", activeButton: matchedAnalytic.label };
    }

    // Check if current path matches any ribbon item
    const matchedRibbon = ribbonItems.find((item) =>
      pathname.startsWith(item.link)
    );
    if (matchedRibbon)
      return { activeTab: matchedRibbon.label, activeButton: matchedRibbon.label };

    return { activeTab: "Control View", activeButton: "Control View" };
  }, [pathname]);

  // Check if we should show category names and dividers
  const showCategories = activeTab === "Analytics View";

  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 px-1 py-2 flex my-1">
      
      {/* Main ribbon items with category name below */}
      <div className="flex ">
        <div className="flex flex-col items-center mx-1">
          <div className="flex gap-1">
            {ribbonItems
              .filter((tool) => tool.label === "Control View" || tool.label === "Setup View" || tool.label === "Analytics View")
              .map((tool, i) => (
                <IconButton
                  key={i}
                  icon={tool.path}
                  label={tool.label}
                  onClick={() => router.push(tool.link)}
                  active={activeTab === tool.label}
                  link={tool.link}
                />
              ))}
          </div>
          
          {/* Common label for both */}
          <div className="text-xs text-gray-500 font-medium text-center pt-3">
            Home
          </div>
        </div>

        {/* Keep other ribbon items (like Analytics View) outside */}
        {/* {ribbonItems
          .filter((tool) => tool.label === "Analytics View")
          .map((tool, i) => (
            <IconButton
              key={i}
              icon={tool.path}
              label={tool.label}
              onClick={() => router.push(tool.link)}
              active={activeTab === tool.label}
              link={tool.link}
            />
        ))} */}
      </div>
      

      {/* Analytics sub-items with categories */}
            {/* Analytics sub-items with categories */}
            <div className="flex items-start ml-1">
        {analyticCategories.map((category, categoryIndex) => {
          const visibleItems = category.items.filter(
            (item) =>
              activeTab === "Analytics View" ||
              (category.name === "Outputs" && item.type) ||
              item.label === "Global Analytics" // always show this one
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={categoryIndex} className="flex items-center">
              {/* Divider between Analytics View and the first category (Scoring Trends) */}
              {categoryIndex === 0 && activeTab === "Analytics View" && (
                <div className="h-14 w-[2px] bg-gray-300 mx-2 mb-4"></div>
              )}

              {/* Divider between subsequent categories */}
              {categoryIndex > 0 && (
                <div className="h-14 w-[2px] bg-gray-300 mx-1 mb-4"></div>
              )}

              {/* Category container */}
              <div className="flex flex-col items-center mx-2">
                <div className="flex gap-2 mb-1">
                  {visibleItems.map((item, i) => (
                    <div key={i} className="flex items-center">
                      {/* Extra divider only for the first Outputs item */}
                      {category.name === "Outputs" && i === 0 && (
                        <div className="h-14 bg-gray-300 mr-1"></div>
                      )}

                      {item.component ? (
                        <item.component
                          icon={item.path}
                          label={item.label}
                          onClick={() => item.link && router.push(item.link)}
                          active={activeButton === item.label} />
                      ) : (
                        <SubIconButton
                          icon={item.path}
                          label={item.label}
                          onClick={() => item.link && router.push(item.link)}
                          active={activeButton === item.label}
                          
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Category label */}
                <div className="text-xs text-gray-500 font-medium text-center w-full pt-2">
                  {category.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>



    </div>
  );
}