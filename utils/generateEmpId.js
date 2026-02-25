import Counter from "../models/counterModel.js";

export const generateEmpId = async () => {
  const year = String(new Date().getFullYear()).slice(-2);

  const counter = await Counter.findOneAndUpdate(
    { name: `employee-${year}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  );

  return `${year}EMP${String(counter.value).padStart(6, "0")}`;
};
