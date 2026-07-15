import React, { useState, useEffect } from "react";
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
  const [expanded, setExpanded] = useState({
    standard: true,
    curveLabel: false,
    lineAttribute: false,
    symbolAttribute: false,
  });

  const [selectedLineType, setSelectedLineType] = useState("positive");

  const [positiveVisibility, setPositiveVisibility] = useState(
    properties.positiveVisibility ?? true
  );
  const [negativeVisibility, setNegativeVisibility] = useState(
    properties.negativeVisibility ?? true
  );

  const [layer, setLayer] = useState(properties.layer ?? 1);
  const [showLabel, setShowLabel] = useState(properties.showLabel ?? false);
  const [labelType, setLabelType] = useState(properties.labelType ?? "X Type");

  // line style & thickness (separate)
  const [positiveLineStyle, setPositiveLineStyle] = useState(
    properties.positiveLineStyle || "solid"
  );
  const [negativeLineStyle, setNegativeLineStyle] = useState(
    properties.negativeLineStyle || "solid"
  );
  const [positiveLineThickness, setPositiveLineThickness] = useState(
    properties.positiveLineThickness || 2
  );
  const [negativeLineThickness, setNegativeLineThickness] = useState(
    properties.negativeLineThickness || 2
  );

  // colors (separate)
  const [lineColor, setLineColor] = useState(
    selectedLineType === "positive"
      ? properties.positiveLineColor || "#10b981"
      : properties.negativeLineColor || "#ef4444"
  );

  // symbol props (shared)
  const [symbolStyle, setSymbolStyle] = useState(properties.symbolStyle || "circle");
  const [symbolColor, setSymbolColor] = useState(properties.symbolColor || "#2185d0");
  const [symbolFrequency, setSymbolFrequency] = useState(properties.symbolFrequency || 1);
  const [symbolScaleSize, setSymbolScaleSize] = useState(properties.symbolScaleSize || 1);
  const [shadeArea, setShadeArea] = useState(properties.shadeArea || "#ffffff");

  useEffect(() => {
    // switch visible color/style/thickness when type changes
    const newColor =
      selectedLineType === "positive"
        ? properties.positiveLineColor || "#10b981"
        : properties.negativeLineColor || "#ef4444";
    setLineColor(newColor);
  }, [selectedLineType, properties.positiveLineColor, properties.negativeLineColor]);

  const toggleExpand = (section) =>
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  const updateParent = (newProps) => {
    onChange &&
      onChange({
        ...properties,
        positiveVisibility,
        negativeVisibility,
        layer,
        showLabel,
        labelType,
        positiveLineStyle,
        negativeLineStyle,
        positiveLineThickness,
        negativeLineThickness,
        symbolStyle,
        symbolColor,
        symbolFrequency,
        symbolScaleSize,
        shadeArea,
        ...newProps,
      });
  };

  // line color handler
  const handleLineColorChange = (color) => {
    setLineColor(color);
    if (selectedLineType === "positive") {
      updateParent({ positiveLineColor: color });
    } else {
      updateParent({ negativeLineColor: color });
    }
  };

  // line style handler
  const handleLineStyleChange = (value) => {
    if (selectedLineType === "positive") {
      setPositiveLineStyle(value);
      updateParent({ positiveLineStyle: value });
    } else {
      setNegativeLineStyle(value);
      updateParent({ negativeLineStyle: value });
    }
  };

  // line thickness handler
  const handleLineThicknessChange = (value) => {
    const num = Number(value);
    if (selectedLineType === "positive") {
      setPositiveLineThickness(num);
      updateParent({ positiveLineThickness: num });
    } else {
      setNegativeLineThickness(num);
      updateParent({ negativeLineThickness: num });
    }
  };

  return (
    <div className="w-full space-y-6 text-gray-700 text-xs p-1 pt-1 pb-2 border border-gray-300 bg-white mb-10 rounded-lg">
      {/* --- STANDARD --- */}
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
            <label className="block font-semibold mb-1">Select Type</label>
            <select
              value={selectedLineType}
              onChange={(e) => setSelectedLineType(e.target.value)}
              className="border rounded px-2 py-1 w-40"
            >
              <option value="positive">Positive PP IDs</option>
              <option value="negative">Negative PP IDs</option>
            </select>

            <label className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                checked={
                  selectedLineType === "positive"
                    ? positiveVisibility
                    : negativeVisibility
                }
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (selectedLineType === "positive") {
                    setPositiveVisibility(checked);
                    updateParent({ positiveVisibility: checked });
                  } else {
                    setNegativeVisibility(checked);
                    updateParent({ negativeVisibility: checked });
                  }
                }}
              />
              <span>
                Visibility (
                {selectedLineType === "positive" ? "Positive" : "Negative"})
              </span>
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
          </div>
        )}
      </div>

      {/* --- LINE ATTRIBUTES --- */}
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
              onChange={(e) => setSelectedLineType(e.target.value)}
              className="w-full border rounded px-2 py-1 mb-3"
            >
              <option value="positive">Positive PP IDs</option>
              <option value="negative">Negative PP IDs</option>
            </select>

            {/* style */}
            <label className="block font-semibold mb-1">Line Style</label>
            <select
              value={
                selectedLineType === "positive"
                  ? positiveLineStyle
                  : negativeLineStyle
              }
              onChange={(e) => handleLineStyleChange(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              {lineStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>

            {/* color */}
            <label className="block font-semibold mb-1 mt-3">
              Line Color (
              {selectedLineType === "positive" ? "Positive" : "Negative"})
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={lineColor}
                onChange={(e) => handleLineColorChange(e.target.value)}
                className="w-16 h-8 p-0 border rounded cursor-pointer"
              />
            </div>

            {/* thickness */}
            <label className="block font-semibold mb-1 mt-3">
              Line Thickness
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={
                selectedLineType === "positive"
                  ? positiveLineThickness
                  : negativeLineThickness
              }
              onChange={(e) => handleLineThicknessChange(e.target.value)}
              className="w-20 border rounded px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* Symbol Attribute */}
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
