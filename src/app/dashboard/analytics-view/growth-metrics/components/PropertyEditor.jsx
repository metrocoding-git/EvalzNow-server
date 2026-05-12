import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const lineStyles = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
  { label: "Dash-Dot", value: "dashdot" },
];

const symbolStyles = [
  { label: "Circle", value: "circle" },
  { label: "Square", value: "square" },
  { label: "Triangle", value: "triangle" },
  { label: "Diamond", value: "diamond" },
];

export default function PropertyEditor({ properties, onChange }) {
  // Expand/collapse state for sections
  const [expanded, setExpanded] = useState({
    standard: true,
    curveLabel: false,
    lineAttribute: false,
    symbolAttribute: false,
  });

  const [selectedLineType, setSelectedLineType] = useState("positive");

  // Controlled states for all inputs, initialized from props or defaults
  const [visibility, setVisibility] = useState(properties.visibility ?? true);
  const [layer, setLayer] = useState(properties.layer ?? 1);
  const [reference, setReference] = useState(properties.reference ?? false);

  const [showLabel, setShowLabel] = useState(properties.showLabel ?? false);
  const [labelType, setLabelType] = useState(properties.labelType ?? "X Type");
  const [showLabelPrefix, setShowLabelPrefix] = useState(properties.showLabelPrefix ?? false);
  const [labelPrefix, setLabelPrefix] = useState(properties.labelPrefix ?? "X File name");
  const [showLabelSuffix, setShowLabelSuffix] = useState(properties.showLabelSuffix ?? false);
  const [labelSuffix, setLabelSuffix] = useState(properties.labelSuffix ?? "Y subcase");

  const [lineStyle, setLineStyle] = useState(properties.lineStyle || "solid");
  const [lineColor, setLineColor] = useState(properties.lineColor || "#2185d0");
  const [lineThickness, setLineThickness] = useState(properties.lineThickness || 2);

  const [symbolStyle, setSymbolStyle] = useState(properties.symbolStyle || "circle");
  const [symbolColor, setSymbolColor] = useState(properties.symbolColor || "#2185d0");
  const [symbolFrequency, setSymbolFrequency] = useState(properties.symbolFrequency || 1);
  const [symbolScaleSize, setSymbolScaleSize] = useState(properties.symbolScaleSize || 1);

  const [shadeArea, setShadeArea] = useState(properties.shadeArea || "#ffffff");

  // Update line color when selectedLineType changes
  React.useEffect(() => {
    const newColor = selectedLineType === "positive" 
      ? properties.positiveLineColor || "#10b981" 
      : properties.negativeLineColor || "#ef4444";
    setLineColor(newColor);
  }, [selectedLineType, properties.positiveLineColor, properties.negativeLineColor]);

  // Helper: update parent on any change
  const updateParent = (newProps) => {
    onChange &&
      onChange({
        visibility,
        layer,
        reference,

        showLabel,
        labelType,
        showLabelPrefix,
        labelPrefix,
        showLabelSuffix,
        labelSuffix,

        lineStyle,
        lineColor,
        lineThickness,

        symbolStyle,
        symbolColor,
        symbolFrequency,
        symbolScaleSize,

        shadeArea,

        positiveLineColor: properties.positiveLineColor || "#10b981",
        negativeLineColor: properties.negativeLineColor || "#ef4444",

        ...newProps,
      });
  };

  // When each input changes, update local state and notify parent
  // To keep it DRY, define handlers inline
  // Handle line color change based on selected line type
  const handleLineColorChange = (color) => {
    setLineColor(color);
    if (selectedLineType === "positive") {
      updateParent({ positiveLineColor: color });
    } else {
      updateParent({ negativeLineColor: color });
    }
  };

  // Handle line type selection change
  const handleLineTypeChange = (type) => {
    setSelectedLineType(type);
    // Update the color picker to show the current color for the selected type
    const currentColor = type === "positive" 
      ? properties.positiveLineColor || "#10b981" 
      : properties.negativeLineColor || "#ef4444";
    setLineColor(currentColor);
  };

  const toggleExpand = (section) =>
    setExpanded((e) => ({ ...e, [section]: !e[section] }));

  return (
    <div className="w-full space-y-6 text-gray-700 text-xs p-1 pt-1 pb-2 border-1 border-gray-300 bg-white mb-10">
      {/* Standard Section */}
      <div>
        <button
          onClick={() => toggleExpand("standard")}
          className="flex items-center w-full font-semibold mb-2 cursor-pointer"
          type="button"
        >
          {expanded.standard ? (
            <ChevronDown className="w-5 h-5 mr-2" />
          ) : (
            <ChevronRight className="w-5 h-5 mr-2" />
          )}
          Standard
        </button>
        {expanded.standard && (
          <div className="space-y-3 pl-7">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={visibility}
                onChange={(e) => {
                  setVisibility(e.target.checked);
                  updateParent({ visibility: e.target.checked });
                }}
              />
              <span>Visibility</span>
            </label>

            <label className="flex items-center space-x-2">
              <span>Layer:</span>
              <input
                type="number"
                min={0}
                value={layer}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLayer(val);
                  updateParent({ layer: val });
                }}
                className="border rounded px-2 py-1 w-20"
              />
            </label>

            {/* <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reference}
                onChange={(e) => {
                  setReference(e.target.checked);
                  updateParent({ reference: e.target.checked });
                }}
              />
              <span>Reference</span>
            </label> */}
          </div>
        )}
      </div>

      {/* Curve Label Section */}
      <div>
        <button
          onClick={() => toggleExpand("curveLabel")}
          className="flex items-center w-full font-semibold mb-2 cursor-pointer"
          type="button"
        >
          {expanded.curveLabel ? (
            <ChevronDown className="w-5 h-5 mr-2" />
          ) : (
            <ChevronRight className="w-5 h-5 mr-2" />
          )}
          Curve Labelling
        </button>
        {expanded.curveLabel && (
          <div className="space-y-3 pl-7">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showLabel}
                onChange={(e) => {
                  setShowLabel(e.target.checked);
                  updateParent({ showLabel: e.target.checked });
                }}
              />
              <span>Show Label</span>
            </label>

            <label className="flex items-center space-x-2">
              <span>Label:</span>
              <select
                value={labelType}
                onChange={(e) => {
                  setLabelType(e.target.value);
                  updateParent({ labelType: e.target.value });
                }}
                className="border rounded px-2 py-1"
              >
                <option value="X Type">X Type</option>
                <option value="Y Type">Y Type</option>
              </select>
            </label>

            {/* <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showLabelPrefix}
                onChange={(e) => {
                  setShowLabelPrefix(e.target.checked);
                  updateParent({ showLabelPrefix: e.target.checked });
                }}
              />
              <span>Show Label Prefix</span>
            </label> */}

            {/* {showLabelPrefix && (
              <label className="flex items-center space-x-2 pl-6">
                <span>Label Prefix:</span>
                <input
                  type="text"
                  value={labelPrefix}
                  onChange={(e) => {
                    setLabelPrefix(e.target.value);
                    updateParent({ labelPrefix: e.target.value });
                  }}
                  className="border rounded px-2 py-1 w-full max-w-xs"
                />
              </label>
            )} */}

            {/* <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showLabelSuffix}
                onChange={(e) => {
                  setShowLabelSuffix(e.target.checked);
                  updateParent({ showLabelSuffix: e.target.checked });
                }}
              />
              <span>Show Label Suffix</span>
            </label> */}

            {/* {showLabelSuffix && (
              <label className="flex items-center space-x-2 pl-6">
                <span>Label Suffix:</span>
                <input
                  type="text"
                  value={labelSuffix}
                  onChange={(e) => {
                    setLabelSuffix(e.target.value);
                    updateParent({ labelSuffix: e.target.value });
                  }}
                  className="border rounded px-2 py-1 w-full max-w-xs"
                />
              </label>
            )} */}
          </div>
        )}
      </div>

      {/* Line Attribute Section */}
      <div>
        <button
          onClick={() => toggleExpand("lineAttribute")}
          className="flex items-center w-full font-semibold mb-2 cursor-pointer"
          type="button"
        >
          {expanded.lineAttribute ? (
            <ChevronDown className="w-5 h-5 mr-2" />
          ) : (
            <ChevronRight className="w-5 h-5 mr-2" />
          )}
          Line Attribute
        </button>
        {expanded.lineAttribute && (
          <div className="space-y-3 pl-7">
            <label className="block font-semibold mb-1">Line Type</label>
            <select
              value={selectedLineType}
              onChange={(e) => handleLineTypeChange(e.target.value)}
              className="w-full border rounded px-2 py-1 mb-3"
            >
              <option value="positive">Positive PP IDs</option>
              <option value="negative">Negative PP IDs</option>
            </select>

            <label className="block font-semibold mb-1">Line Style</label>
            <select
              value={lineStyle}
              onChange={(e) => {
                setLineStyle(e.target.value);
                updateParent({ lineStyle: e.target.value });
              }}
              className="w-full border rounded px-2 py-1"
            >
              {lineStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>

            <label className="block font-semibold mb-1 mt-3">
              Line Color ({selectedLineType === "positive" ? "Positive" : "Negative"})
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={lineColor}
                onChange={(e) => handleLineColorChange(e.target.value)}
                className="w-16 h-8 p-0 border rounded cursor-pointer"
              />
              <span className="text-xs text-gray-600">
                {selectedLineType === "positive" ? "Positive" : "Negative"} Line
              </span>
            </div>

            {/* <label className="block font-semibold mb-1 mt-3">Line Color</label>
            <input
              type="color"
              value={lineColor}
              onChange={(e) => {
                setLineColor(e.target.value);
                updateParent({ lineColor: e.target.value });
              }}
              className="w-16 h-8 p-0 border rounded cursor-pointer"
            /> */}

            <label className="block font-semibold mb-1 mt-3">Line Thickness</label>
            <input
              type="number"
              min={1}
              max={10}
              value={lineThickness}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLineThickness(val);
                updateParent({ lineThickness: val });
              }}
              className="w-20 border rounded px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* Symbol Attribute Section */}
      <div>
        <button
          onClick={() => toggleExpand("symbolAttribute")}
          className="flex items-center w-full font-semibold mb-2 cursor-pointer"
          type="button"
        >
          {expanded.symbolAttribute ? (
            <ChevronDown className="w-5 h-5 mr-2" />
          ) : (
            <ChevronRight className="w-5 h-5 mr-2" />
          )}
          Symbol Attribute
        </button>
        {expanded.symbolAttribute && (
          <div className="space-y-3 pl-7">
            <label className="block font-semibold mb-1">Symbol Style</label>
            <select
              value={symbolStyle}
              onChange={(e) => {
                setSymbolStyle(e.target.value);
                updateParent({ symbolStyle: e.target.value });
              }}
              className="w-full border rounded px-2 py-1"
            >
              {symbolStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>

            <label className="block font-semibold mb-1 mt-3">Symbol Color</label>
            <input
              type="color"
              value={symbolColor}
              onChange={(e) => {
                setSymbolColor(e.target.value);
                updateParent({ symbolColor: e.target.value });
              }}
              className="w-16 h-8 p-0 border rounded cursor-pointer"
            />

            <label className="block font-semibold mb-1 mt-3">Symbol Frequency</label>
            <input
              type="number"
              min={1}
              max={10}
              value={symbolFrequency}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSymbolFrequency(val);
                updateParent({ symbolFrequency: val });
              }}
              className="w-20 border rounded px-2 py-1"
            />

            <label className="block font-semibold mb-1 mt-3">Symbol Scale Size</label>
            <input
              type="number"
              min={1}
              max={10}
              step={0.1}
              value={symbolScaleSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSymbolScaleSize(val);
                updateParent({ symbolScaleSize: val });
              }}
              className="w-20 border rounded px-2 py-1"
            />

            <label className="block font-semibold mb-1 mt-3">Shade Area</label>
            <input
              type="color"
              value={shadeArea}
              onChange={(e) => {
                setShadeArea(e.target.value);
                updateParent({ shadeArea: e.target.value });
              }}
              className="w-16 h-8 p-0 border rounded cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}