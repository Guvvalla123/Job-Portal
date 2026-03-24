const { JobAlert } = require("../models/JobAlert");
const { Job } = require("../models/Job");
const { User } = require("../models/User");
const { queueEmail } = require("../queues/emailQueue");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findMatchingAlerts(job) {
  const alerts = await JobAlert.find({ isActive: true }).populate("user", "email fullName");
  const matches = [];

  for (const alert of alerts) {
    let matchesAlert = true;
    if (alert.keywords?.trim()) {
      const terms = alert.keywords.trim().split(/\s+/).map(escapeRegex);
      const pattern = new RegExp(terms.join("|"), "i");
      const text = `${job.title} ${job.description} ${(job.skills || []).join(" ")}`;
      if (!pattern.test(text)) matchesAlert = false;
    }
    if (matchesAlert && alert.location?.trim()) {
      const locPattern = new RegExp(escapeRegex(alert.location.trim()), "i");
      if (!locPattern.test(job.location)) matchesAlert = false;
    }
    if (matchesAlert && alert.employmentType) {
      if (job.employmentType !== alert.employmentType) matchesAlert = false;
    }
    if (matchesAlert && alert.user?.email) {
      matches.push({ alert, user: alert.user });
    }
  }

  return matches;
}

async function notifyAlertsForJob(job) {
  try {
    const populatedJob = await Job.findById(job._id).populate("company", "name");
    if (!populatedJob || populatedJob.isActive === false) return;

    const matches = await findMatchingAlerts(populatedJob);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const jobUrl = `${clientUrl}/jobs/${populatedJob._id}`;

    for (const { user } of matches) {
      try {
        await queueEmail({
          to: user.email,
          subject: `JobPortal: New job matching your alert - ${populatedJob.title}`,
          html: `
          <p>Hi ${user.fullName || "there"},</p>
          <p>A new job was posted that matches your job alert:</p>
          <p><strong>${populatedJob.title}</strong></p>
          <p>${populatedJob.company?.name || "Company"} &middot; ${populatedJob.location}</p>
          <p><a href="${jobUrl}" style="color:#4f46e5;">View job &rarr;</a></p>
        `,
        });
      } catch (err) {
        console.error("[JobAlert] Failed to send email to", user.email, err.message);
      }
    }
  } catch (err) {
    console.error("[JobAlert] notifyAlertsForJob failed", err.message);
  }
}

module.exports = { notifyAlertsForJob };
