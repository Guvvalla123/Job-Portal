const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    /** Nullable after account deletion cascade — orphan companies remain for job refs until admin cleanup */
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
  },
  { timestamps: true }
);

companySchema.index({ createdBy: 1, createdAt: -1 });
companySchema.index({ name: "text" });

companySchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = { Company: mongoose.model("Company", companySchema) };
