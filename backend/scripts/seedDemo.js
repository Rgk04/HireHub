import "../config/env.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import config from "../config/env.js";
import { connectDB } from "../database/dbConnection.js";
import { User } from "../models/userSchema.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import { Notification } from "../models/notificationSchema.js";
import { ROLES } from "../utils/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsResumeDir = path.resolve(__dirname, "../uploads/resumes");
const demoResumeName = "demo-resume.pdf";
const demoResumePath = path.join(uploadsResumeDir, demoResumeName);

const demoResume = {
  public_id: `resumes/${demoResumeName}`,
  url: `${config.backendUrl}/uploads/resumes/${demoResumeName}`,
  originalName: "Demo-Candidate-Resume.pdf",
  mimeType: "application/pdf",
  size: 1024,
  storage: "local",
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const ensureResumeFile = async () => {
  await fs.mkdir(uploadsResumeDir, { recursive: true });
  try {
    await fs.access(demoResumePath);
  } catch {
    const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 92>>stream
BT /F1 22 Tf 60 760 Td (HireHub Demo Candidate Resume) Tj ET
BT /F1 12 Tf 60 730 Td (This is a sample resume generated for demo data.) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
    await fs.writeFile(demoResumePath, pdf, "utf8");
  }
};

const ensureUser = async (data) => {
  const email = data.email.toLowerCase();
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ ...data, email });
    console.log(`Created ${data.role}: ${email}`);
  }
  return user;
};

const employers = [
  {
    name: "Aarav Mehta",
    email: "employer@hirehub.com",
    password: "Employer@123",
    phone: "9876543210",
    role: ROLES.EMPLOYER,
    profile: {
      headline: "Talent Acquisition Lead",
      location: "Bengaluru, Karnataka",
      companyName: "NovaTech Solutions",
      companyWebsite: "https://novatech.example.com",
      companySize: "51-200 employees",
      industry: "Software & IT Services",
      companyDescription:
        "NovaTech Solutions builds modern web and cloud products for clients across India and Southeast Asia.",
    },
  },
  {
    name: "Sara Khan",
    email: "employer2@hirehub.com",
    password: "Employer@123",
    phone: "9876500011",
    role: ROLES.EMPLOYER,
    profile: {
      headline: "People Operations Manager",
      location: "Pune, Maharashtra",
      companyName: "BrightPath Labs",
      companyWebsite: "https://brightpath.example.com",
      companySize: "11-50 employees",
      industry: "Design & Product",
      companyDescription:
        "BrightPath Labs is a product studio focused on delightful digital experiences.",
    },
  },
];

const seekers = [
  {
    name: "Priya Sharma",
    email: "seeker@hirehub.com",
    password: "Seeker@123",
    phone: "9988776655",
    role: ROLES.SEEKER,
    profile: {
      headline: "Frontend Developer (React)",
      bio: "Frontend developer with a passion for building accessible, responsive interfaces. I enjoy turning complex problems into clean product experiences.",
      location: "Bengaluru, Karnataka",
      github: "https://github.com/priyasharma",
      linkedin: "https://linkedin.com/in/priyasharma",
    },
    skills: ["React", "JavaScript", "HTML", "CSS", "Redux", "Vite", "Git"],
    education: [
      {
        degree: "B.Tech in Computer Science",
        institution: "Visvesvaraya Technological University",
        year: "2021 - 2025",
        grade: "8.7 CGPA",
      },
    ],
    experience: [
      {
        title: "Frontend Developer Intern",
        company: "PixelCraft Studio",
        startDate: "Jan 2025",
        endDate: "Jun 2025",
        current: false,
        description:
          "Built reusable React components and improved Lighthouse performance from 68 to 94.",
      },
    ],
    resume: demoResume,
  },
  {
    name: "Rohan Verma",
    email: "seeker2@hirehub.com",
    password: "Seeker@123",
    phone: "9988771122",
    role: ROLES.SEEKER,
    profile: {
      headline: "Node.js Backend Developer",
      bio: "Backend engineer focused on REST APIs, MongoDB data modelling and reliable deployments.",
      location: "Hyderabad, Telangana",
    },
    skills: ["Node.js", "Express", "MongoDB", "Mongoose", "AWS", "Docker"],
    education: [
      {
        degree: "MCA",
        institution: "University of Hyderabad",
        year: "2020 - 2023",
      },
    ],
    resume: demoResume,
  },
  {
    name: "Ananya Rao",
    email: "seeker3@hirehub.com",
    password: "Seeker@123",
    phone: "9988773344",
    role: ROLES.SEEKER,
    profile: {
      headline: "UI/UX Designer",
      bio: "Designer who loves research-led product design, design systems and prototyping.",
      location: "Mumbai, Maharashtra",
    },
    skills: ["Figma", "UI Design", "UX Research", "Design Systems", "Prototyping"],
    education: [
      {
        degree: "B.Des in Interaction Design",
        institution: "NID Ahmedabad",
        year: "2019 - 2023",
      },
    ],
    resume: demoResume,
  },
];

const jobTemplates = [
  {
    title: "React Frontend Developer",
    category: "Frontend Web Development",
    company: "NovaTech Solutions",
    country: "India",
    city: "Bengaluru",
    location: "Hebbal, Bengaluru (Hybrid)",
    employmentType: "Full-time",
    experienceLevel: "Mid Level",
    salaryFrom: 700000,
    salaryTo: 1100000,
    currency: "INR",
    skills: ["React", "JavaScript", "CSS", "Redux", "REST APIs"],
    vacancies: 3,
    deadlineDays: 35,
    postedDaysAgo: 1,
    description:
      "We are looking for a React frontend developer to build polished, responsive interfaces for our client dashboard. You will work closely with designers and backend engineers to ship features every sprint, write reusable components, and keep accessibility and performance top of mind.",
    employerIndex: 0,
  },
  {
    title: "MERN Stack Developer",
    category: "MERN Stack Development",
    company: "NovaTech Solutions",
    country: "India",
    city: "Bengaluru",
    location: "Whitefield, Bengaluru (On-site)",
    employmentType: "Full-time",
    experienceLevel: "Senior",
    fixedSalary: 1800000,
    currency: "INR",
    skills: ["MongoDB", "Express", "React", "Node.js", "Mongoose", "JWT"],
    vacancies: 2,
    deadlineDays: 45,
    postedDaysAgo: 3,
    description:
      "Join our product engineering team to design and ship full-stack features using MongoDB, Express, React and Node.js. You will own APIs end to end, review code, improve reliability and mentor two junior engineers. Experience with secure authentication and role-based access is important.",
    employerIndex: 0,
  },
  {
    title: "Backend Engineer (Node.js)",
    category: "Backend Development",
    company: "NovaTech Solutions",
    country: "India",
    city: "Hyderabad",
    location: "HITEC City, Hyderabad (Hybrid)",
    employmentType: "Full-time",
    experienceLevel: "Mid Level",
    salaryFrom: 900000,
    salaryTo: 1400000,
    currency: "INR",
    skills: ["Node.js", "Express", "MongoDB", "AWS", "Docker"],
    vacancies: 2,
    deadlineDays: 28,
    postedDaysAgo: 6,
    description:
      "We need a backend engineer to build reliable REST APIs, improve database performance and support our growing infrastructure. You will work with MongoDB, Express and AWS, write integration tests and participate in on-call rotation. Clean, well-tested code is expected.",
    employerIndex: 0,
  },
  {
    title: "UI/UX Designer",
    category: "UI/UX Design",
    company: "BrightPath Labs",
    country: "India",
    city: "Pune",
    location: "Koregaon Park, Pune (Hybrid)",
    employmentType: "Full-time",
    experienceLevel: "Entry Level",
    fixedSalary: 600000,
    currency: "INR",
    skills: ["Figma", "UI Design", "UX Research", "Prototyping", "Design Systems"],
    vacancies: 1,
    deadlineDays: 21,
    postedDaysAgo: 2,
    description:
      "We are hiring a UI/UX designer to shape intuitive experiences for early-stage products. You will run discovery interviews, create wireframes and prototypes in Figma, and work with developers to polish the final build. A strong portfolio showing process and outcomes is required.",
    employerIndex: 1,
  },
  {
    title: "Product Designer (Design Systems)",
    category: "Graphics & Design",
    company: "BrightPath Labs",
    country: "India",
    city: "Pune",
    location: "Baner, Pune (Remote)",
    employmentType: "Remote",
    experienceLevel: "Mid Level",
    salaryFrom: 800000,
    salaryTo: 1200000,
    currency: "INR",
    skills: ["Figma", "Design Systems", "Accessibility", "HTML", "CSS"],
    vacancies: 1,
    deadlineDays: 40,
    postedDaysAgo: 8,
    description:
      "BrightPath Labs is looking for a product designer to own our design system. You will define components, document usage, partner with frontend engineers and make accessibility a default. Experience maintaining a production design system is a strong plus.",
    employerIndex: 1,
  },
  {
    title: "Data Analyst",
    category: "Data Science & Analytics",
    company: "NovaTech Solutions",
    country: "India",
    city: "Bengaluru",
    location: "Indiranagar, Bengaluru (Hybrid)",
    employmentType: "Full-time",
    experienceLevel: "Entry Level",
    salaryFrom: 500000,
    salaryTo: 800000,
    currency: "INR",
    skills: ["SQL", "Python", "Excel", "Power BI", "Data Visualization"],
    vacancies: 2,
    deadlineDays: 30,
    postedDaysAgo: 4,
    description:
      "We are looking for a data analyst to turn product and hiring data into clear insights. You will write SQL, build dashboards, collaborate with product managers and present findings to leadership. Strong attention to detail and clear communication are essential.",
    employerIndex: 0,
  },
  {
    title: "DevOps Engineer",
    category: "DevOps & Cloud",
    company: "NovaTech Solutions",
    country: "India",
    city: "Remote",
    location: "Remote (India)",
    employmentType: "Remote",
    experienceLevel: "Senior",
    fixedSalary: 2000000,
    currency: "INR",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
    vacancies: 1,
    deadlineDays: 50,
    postedDaysAgo: 10,
    description:
      "Own our cloud infrastructure and developer experience. You will automate deployments with CI/CD, harden AWS environments, improve observability and mentor the team on infrastructure best practices. Deep Linux and Kubernetes knowledge required.",
    employerIndex: 0,
  },
  {
    title: "Digital Marketing Intern",
    category: "Marketing & Sales",
    company: "BrightPath Labs",
    country: "India",
    city: "Pune",
    location: "Kalyani Nagar, Pune (On-site)",
    employmentType: "Internship",
    experienceLevel: "Entry Level",
    fixedSalary: 20000,
    currency: "INR",
    skills: ["SEO", "Content Marketing", "Google Analytics", "Social Media"],
    vacancies: 2,
    deadlineDays: 18,
    postedDaysAgo: 1,
    description:
      "Join our growth team for a six-month internship. You will help plan content, run social campaigns, track performance in Google Analytics and learn how a product studio grows. A stipend of 20,000 per month is provided along with a certificate and mentorship.",
    employerIndex: 1,
  },
  {
    title: "HR Executive",
    category: "Human Resources",
    company: "NovaTech Solutions",
    country: "India",
    city: "Bengaluru",
    location: "MG Road, Bengaluru (On-site)",
    employmentType: "Full-time",
    experienceLevel: "Entry Level",
    salaryFrom: 400000,
    salaryTo: 600000,
    currency: "INR",
    skills: ["Recruitment", "Communication", "HR Operations", "Excel"],
    vacancies: 1,
    deadlineDays: 25,
    postedDaysAgo: 5,
    description:
      "Support end-to-end recruitment and HR operations for a growing engineering team. You will coordinate interviews, maintain candidate pipelines, help with onboarding and keep HR records accurate. Excellent communication and discretion are required.",
    employerIndex: 0,
  },
  {
    title: "Content Writer (Tech)",
    category: "Content Writing",
    company: "BrightPath Labs",
    country: "India",
    city: "Remote",
    location: "Remote (India)",
    employmentType: "Part-time",
    experienceLevel: "Mid Level",
    salaryFrom: 30000,
    salaryTo: 45000,
    currency: "INR",
    skills: ["Technical Writing", "SEO", "Editing", "Research"],
    vacancies: 1,
    deadlineDays: 32,
    postedDaysAgo: 12,
    description:
      "Write clear, useful content about design systems, frontend development and product strategy. You will interview subject-matter experts, edit drafts and optimise articles for search while keeping a human tone. Portfolio required.",
    employerIndex: 1,
  },
  {
    title: "Customer Support Specialist",
    category: "Customer Support",
    company: "NovaTech Solutions",
    country: "India",
    city: "Kochi",
    location: "Infopark, Kochi (Hybrid)",
    employmentType: "Full-time",
    experienceLevel: "Entry Level",
    fixedSalary: 380000,
    currency: "INR",
    skills: ["Communication", "CRM", "Problem Solving", "English"],
    vacancies: 4,
    deadlineDays: 20,
    postedDaysAgo: 7,
    description:
      "Be the voice of our product for customers across India. You will resolve issues over chat and email, document common problems and share insights with the product team. Prior customer-facing experience and strong written English are preferred.",
    employerIndex: 0,
  },
  {
    title: "Junior Game Developer",
    category: "Game Development",
    company: "BrightPath Labs",
    country: "India",
    city: "Pune",
    location: "Viman Nagar, Pune (On-site)",
    employmentType: "Contract",
    experienceLevel: "Entry Level",
    salaryFrom: 450000,
    salaryTo: 700000,
    currency: "INR",
    skills: ["Unity", "C#", "Game Design", "Git"],
    vacancies: 1,
    deadlineDays: 15,
    postedDaysAgo: 0,
    description:
      "Help build a casual mobile game from prototype to launch. You will implement gameplay systems in Unity and C#, fix bugs and collaborate with artists. A playable portfolio or game jam project is required.",
    employerIndex: 1,
  },
];

const run = async () => {
  await connectDB();
  await ensureResumeFile();

  const employerDocs = [];
  for (const employer of employers) {
    employerDocs.push(await ensureUser(employer));
  }

  const seekerDocs = [];
  for (const seeker of seekers) {
    seekerDocs.push(await ensureUser(seeker));
  }

  const jobs = [];
  for (const template of jobTemplates) {
    let job = await Job.findOne({
      title: template.title,
      company: template.company,
    });
    if (!job) {
      const {
        deadlineDays,
        postedDaysAgo,
        employerIndex,
        ...jobData
      } = template;
      job = await Job.create({
        ...jobData,
        deadline: daysFromNow(deadlineDays),
        jobPostedOn: daysAgo(postedDaysAgo),
        postedBy: employerDocs[employerIndex]._id,
      });
      console.log(`Created job: ${job.title}`);
    }
    jobs.push(job);
  }

  const applicationPlan = [
    { job: 0, seeker: 0, status: "shortlisted", days: 6 },
    { job: 1, seeker: 0, status: "pending", days: 4 },
    { job: 2, seeker: 1, status: "hired", days: 9 },
    { job: 3, seeker: 2, status: "shortlisted", days: 3 },
    { job: 5, seeker: 1, status: "pending", days: 2 },
    { job: 4, seeker: 2, status: "pending", days: 1 },
    { job: 8, seeker: 2, status: "rejected", days: 7 },
    { job: 6, seeker: 1, status: "rejected", days: 10 },
    { job: 10, seeker: 0, status: "pending", days: 1 },
    { job: 7, seeker: 2, status: "pending", days: 0 },
  ];

  for (const plan of applicationPlan) {
    const job = jobs[plan.job];
    const seeker = seekerDocs[plan.seeker];
    if (!job || !seeker) continue;

    const exists = await Application.findOne({
      jobId: job._id,
      applicantID: seeker._id,
    });
    if (exists) continue;

    const history = [
      {
        status: "pending",
        changedAt: daysAgo(plan.days),
        changedBy: seeker._id,
      },
    ];
    if (plan.status !== "pending") {
      history.push({
        status: plan.status,
        changedAt: daysAgo(Math.max(0, plan.days - 1)),
        changedBy: job.postedBy,
      });
    }

    const application = await Application.create({
      jobId: job._id,
      applicantID: seeker._id,
      employerID: job.postedBy,
      name: seeker.name,
      email: seeker.email,
      phone: seeker.phone,
      address: seeker.profile?.location || "India",
      coverLetter: `I am excited to apply for the ${job.title} role at ${job.company}. My experience with ${job.skills
        .slice(0, 3)
        .join(", ")} matches the requirements, and I would love to contribute to your team.`,
      resume: seeker.resume || demoResume,
      status: plan.status,
      statusHistory: history,
      createdAt: daysAgo(plan.days),
      updatedAt: daysAgo(Math.max(0, plan.days - 1)),
    });

    await createDemoNotifications(application, job, seeker, plan.status);
  }

  const allJobs = await Job.find();
  for (const job of allJobs) {
    const count = await Application.countDocuments({ jobId: job._id });
    if (job.applicationsCount !== count) {
      job.applicationsCount = count;
      await job.save({ validateBeforeSave: false });
    }
  }

  const notificationCount = await Notification.countDocuments();
  console.log(`\nDemo data ready (${jobs.length} jobs, ${notificationCount} notifications).`);
  console.log("--------------------------------------------------");
  console.log("Job Seeker : seeker@hirehub.com  / Seeker@123");
  console.log("Employer   : employer@hirehub.com / Employer@123");
  console.log("Second Emp : employer2@hirehub.com / Employer@123");
  console.log("--------------------------------------------------");
  console.log("Run `npm run seed:admin` to create the admin account.");

  await mongoose.disconnect();
};

const createDemoNotifications = async (application, job, seeker, status) => {
  const existing = await Notification.findOne({
    application: application._id,
    user: job.postedBy,
    type: "application",
  });
  if (!existing) {
    await Notification.create({
      user: job.postedBy,
      title: "New application received",
      message: `${seeker.name} applied for ${job.title}.`,
      type: "application",
      application: application._id,
      job: job._id,
      createdAt: application.createdAt,
    });
  }

  if (status !== "pending") {
    const statusExists = await Notification.findOne({
      application: application._id,
      user: seeker._id,
      type: "status",
    });
    if (!statusExists) {
      await Notification.create({
        user: seeker._id,
        title: "Application status updated",
        message: `Your application for ${job.title} at ${job.company} is now ${status}.`,
        type: "status",
        application: application._id,
        job: job._id,
        createdAt: application.updatedAt,
      });
    }
  }
};

run().catch(async (error) => {
  console.error("Demo seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
