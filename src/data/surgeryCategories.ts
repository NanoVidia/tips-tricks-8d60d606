import type { SurgeryCategory } from "@/data/surgeriesData";

export const surgeryCategories: { id: SurgeryCategory | "All"; label: string; color: string }[] = [
  { id: "All", label: "All", color: "from-slate-500 to-slate-700" },
  { id: "Obstetric", label: "Obstetric", color: "from-rose-500 to-pink-600" },
  { id: "Benign Gyn", label: "Benign Gyn", color: "from-blue-500 to-indigo-600" },
  { id: "Oncology", label: "Oncology", color: "from-purple-600 to-fuchsia-700" },
  { id: "Urogyn", label: "Urogyn", color: "from-cyan-500 to-teal-600" },
  { id: "Reproductive", label: "Reproductive", color: "from-emerald-500 to-green-600" },
  { id: "Emergency", label: "Emergency", color: "from-red-500 to-rose-600" },
  { id: "Minimally Invasive", label: "MIS / Lap", color: "from-violet-500 to-purple-600" },
  { id: "Vaginal", label: "Vaginal", color: "from-amber-500 to-orange-600" },
  { id: "Hysteroscopic", label: "Hysteroscopy", color: "from-teal-500 to-cyan-600" },
];