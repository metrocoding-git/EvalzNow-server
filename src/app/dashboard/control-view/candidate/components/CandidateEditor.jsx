"use client";
import React, { useState, useEffect } from "react";
import { Edit3, X, Plus, Edit, Trash2 } from "lucide-react";
import { updateCandidate } from "@/services/candidateService";
import { getAllEthinicities } from "@/services/ethinictyService";
import { getAllIncomes } from "@/services/incomeService";
import { useFormStatus } from "@/context/FormStatusContext";

const genderOptions = ["Female", "Male", "Non-Disclosed", "Other"];
const religionOptions = [
  "African Diaspora Religions",
  "Agnosticism",
  "Atheism",
  "Buddhism",
  "Christianity",
  "Confucianism",
  "Druze",
  "Gnosticism",
  "Hinduism",
  "Indigenous American Religions",
  "Islam",
  "Jainism",
  "Judaism",
  "Non-disclosed",
  "Other",
  "Rastafarianism",
  "Shinto",
  "Sikhism",
  "Strictly Spiritual",
  "Traditional African Religions",
  "Zoroastrianism",
];
const maritalStatusOptions = [
  "Married",
  "Non-disclosed",
  "Other",
  "Separated",
  "Single",
];
const jobTypeOptions = [
  "Contractor",
  "Employee",
  "Non-disclosed",
  "Other",
  "Student",
  "Trainee",
  "Trainer",
];

const nationalityOptions = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
  "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Non-disclosed"
];

const ethnicityOptions = [
  "Non-Disclosed",
  "Asian",
  "Black",
  "Hispanic",
  "White",
  "Mixed",
  "Other",
];
const incomeOptions = [
  "Non-Disclosed",
  "< $20k",
  "$20k-$50k",
  "$50k-$100k",
  "> $100k",
];

const irregularityOptions = ["Disability", "Special Needs", "Other"];

const initialFormState = {
  "Last Name": "",
  "First Name": "",
  "Candidate ID": "",
  "Special ID No.": "",
  "Date of Birth": "",
  "Start Date": "",
  Nationality: "",
  Gender: "",
  Ethnicity: "",
  Income: "",
  Religion: "",
  "Marital Status": "",
  "Job Type": "",
  Disability: false,
  "Special Needs": false,
  Other: false,
  Comments: "",
};

const CandidateEditor = ({ candidate, showForm, onSave, ethnicities = [], incomes = [] }) => {
  const [form, setForm] = useState(initialFormState);
  const [rows, setRows] = useState([
    { id: "", type: "", comment: "" }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // const [ethnicities, setEthnicities] = useState([]);
  // const [incomes, setIncomes] = useState([]);
  
  const [loading, setLoading] = useState(false);

  const { setFormStatus } = useFormStatus();

  // Fetch all candidates on mount
  // useEffect(() => {
  //   const fetchEthnicity = async () => {
  //     try {
  //       setLoading(true);
  //       const data = await getAllEthinicities();
  //       // keep objects instead of just names
  //       setEthnicities(Array.isArray(data) ? data : []);
  //     } catch (err) {
  //       console.error("Failed to fetch ethnicities:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchEthnicity();
  // }, []);


  // Fetch all candidates on mount
  // useEffect(() => {
  //   const fetchIncome = async () => {
  //     try {
  //       setLoading(true);
  //       const data = await getAllIncomes();
  //       // keep objects instead of just names
  //       setIncomes(Array.isArray(data) ? data : []);
  //     } catch (err) {
  //       console.error("Failed to fetch incomes:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchIncome();
  // }, []);


  useEffect(() => {
    if (candidate) {
      setForm({
        "Last Name": candidate.lastName || "",
        "First Name": candidate.firstName || "",
        "Candidate ID": candidate.candidateId || "",
        
        "Special ID No.": candidate.specialIdNo || "",
        "Date of Birth": candidate.dateOfBirth || "",
        "Start Date": candidate.startDate || "",
        Nationality: candidate.nationality || "",
        Gender: candidate.gender || "",
        Ethnicity: candidate.ethnicity || "",
        Income: candidate.income || "",
        Religion: candidate.religion || "",
        "Marital Status": candidate.maritalStatus || "",
        "Job Type": candidate.jobType || "",
        Disability: candidate.disability || false,
        "Special Needs": candidate.specialNeeds || false,
        Other: candidate.other || false,
        Comments: candidate.comments || "",
      });

      setRows(
        Array.isArray(candidate.irregularities) && candidate.irregularities.length > 0
          ? candidate.irregularities.map(ir => ({
              id: ir.id || "",
              type: ir.type || "",
              comment: ir.comments || ""
            }))
          : []
      );
      
    }
  }, [candidate]);

  const handleChange = (label, value) => {
    setForm((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { id: "", type: "", comment: "" }]);
  };


  if (!showForm || !candidate) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center bg-gray-100 px-4 py-2 text-sm border-b border-gray-300 gap-2 text-gray-800 font-semibold flex-shrink-0">
          <Edit className="w-5 h-5" />
          Entity Editor
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
       
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // Build updated candidate object from form state
    const updatedCandidate = {
      id: form["Candidate ID"],
      lastName: form["Last Name"],
      firstName: form["First Name"],
      specialIdNo: form["Special ID No."],
      dob: form["Date of Birth"],
      startDate: form["Start Date"],
      nationality: form.Nationality,
      gender: form.Gender,
      ethnicity: form.Ethnicity,
      income: form.Income,
      religion: form.Religion,
      maritalStatus: form["Marital Status"],
      jobType: form["Job Type"],
      disability: form.Disability,
      specialNeeds: form["Special Needs"],
      other: form.Other,
      comments: form.Comments,
      
    };
  
    if (typeof onSave === "function") {
      onSave(updatedCandidate);
      console.log(updatedCandidate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus("Processing...");
    setError(null);
  
    try {
      const updatedData = {
        candidateId: form["Candidate ID"],
        lastName: form["Last Name"],
        firstName: form["First Name"],
        specialIdNo: form["Special ID No."],
        dateOfBirth: form["Date of Birth"],
        startDate: form["Start Date"],
        nationality: form.Nationality,
        gender: form.Gender,
        ethnicity: form.Ethnicity,
        income: form.Income,
        religion: form.Religion,
        maritalStatus: form["Marital Status"],
        jobType: form["Job Type"],
        irregularities: rows
          .filter(r => r.type)
          .map((r, idx) => ({
            type: r.type,
            sequenceNumber: idx + 1,
            comments: r.comment
          }))
      };
  
      const updatedCandidate = await updateCandidate(candidate.id, updatedData);
      
      if (typeof onSave === "function") {
        onSave(updatedCandidate);
      }
  
      if (typeof onClose === "function") {
        onClose();
      }
  
    } catch (err) {
      console.error("Failed to update candidate:", err);
      setError(err.response?.data?.message || "Failed to update candidate");
      setFormStatus("Ready...");    
    } finally {
      setIsSubmitting(false);
    }
  };
  


  return (
  <form onSubmit={handleSubmit} className="flex flex-col h-full w-full bg-white z-20 border shadow-2xl border-gray-200">
    {/* Header */}
    <div className="flex items-center bg-gray-100 px-4 py-2 border-b border-gray-300">
      <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
        <Edit className="w-5 h-5" />
        Entity Editor
      </div>
    </div>

    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 gap-1 text-xs p-2 h-full">
        {/* Basic Information */}
        {[
          "Last Name",
          "First Name",
          "Candidate ID",
          "Special ID No.",
          "Date of Birth",
          "Start Date",
        ].map((label, idx) => (
          <React.Fragment key={idx}>
            <label className="col-span-1 flex items-center text-gray-700">
              {label}:
            </label>
            <input
              type={label.includes("Date") ? "date" : "text"}
              className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={form[label]}
              onFocus={() => setFormStatus("Editing...")}
              onBlur={() => setFormStatus("Ready...")}
              onChange={(e) => handleChange(label, e.target.value)}
            />
          </React.Fragment>
        ))}

        {/* Socioeconomic Factors */}
        {[
          { label: "Nationality", options: nationalityOptions },
          { label: "Gender", options: genderOptions },
          { label: "Ethnicity", options: ethnicityOptions },
          { label: "Income", options: incomeOptions },
          { label: "Religion", options: religionOptions },
          { label: "Marital Status", options: maritalStatusOptions },
          { label: "Job Type", options: jobTypeOptions },
        ].map(({ label, options }, idx) => (
          <React.Fragment key={idx}>
            <label className="col-span-1 flex items-center text-gray-700">
              {label}:
            </label>
            {label === "Ethnicity" ? (
            <select
              className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={form[label]}
              onFocus={() => setFormStatus("Editing...")}
              onBlur={() => setFormStatus("Ready...")}
              onChange={(e) => handleChange(label, e.target.value)}
            >
              <option value="">Select {label}</option>
              {ethnicities.map((eth) => (
              <option key={eth.id || eth.name} value={eth.name}>
                {eth.name}
              </option>
            ))}
            </select>
          ) : label === "Income" ? (
            <select
              className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={form[label]}
              onFocus={() => setFormStatus("Editing...")}
              onBlur={() => setFormStatus("Ready...")}
              onChange={(e) => handleChange(label, e.target.value)}
            >
              <option value="">Select {label}</option>
              {incomes.map((inc) => (
                <option key={inc.id || inc.name} value={inc.name}>
                  {inc.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={form[label]}
              onFocus={() => setFormStatus("Editing...")}
              onBlur={() => setFormStatus("Ready...")}
              onChange={(e) => handleChange(label, e.target.value)}
            >
              <option value="">Select {label}</option>
              {options.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          </React.Fragment>
        ))}

        {/* Irregularities Table */}
        <div className="col-span-2 pt-4 border-t border-gray-200">
          <h3 className="pb-2 font-semibold text-gray-800">Irregularities</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-center">
                    Irregularities
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center">
                    ID
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center">
                    Comments
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="even:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={row.type}
                        onChange={(e) =>
                          handleRowChange(index, "type", e.target.value)
                        }
                        onFocus={() => setFormStatus("Editing...")}
                        onBlur={() => setFormStatus("Ready...")}
                        className="w-full px-2 py-1 border"
                      >
                        <option value="">Select</option>
                        {irregularityOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                    {index + 1}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={row.comment}
                        maxLength={40}
                        onChange={(e) =>
                          handleRowChange(index, "comment", e.target.value)
                        }
                        onFocus={() => setFormStatus("Editing...")}
                        onBlur={() => setFormStatus("Ready...")}
                        className="w-full px-2 py-1 border"
                        placeholder="Max 40 characters"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedRows = [...rows];
                        updatedRows.splice(index, 1);
                        setRows(updatedRows); // allow empty
                      }}
                      className="px-1 py-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 mt-3 px-3 py-1 bg-gray-500 text-white hover:bg-gray-700"
          >
            <Plus size={18} />
            Add Row
          </button>
        </div>

        {/* Buttons */}
        <div className="col-span-2 pt-4 flex justify-end gap-2">
          <button className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-xs" type="submit" >
            Edit
          </button>
        </div>
      </div>
    </div>
  </form>
);
};

export default CandidateEditor;