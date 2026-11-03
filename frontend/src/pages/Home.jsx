import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiGrid,
  FiMapPin,
  FiSearch,
  FiShield,
  FiStar,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import {
  MdAccountBalance,
  MdOutlineAnimation,
  MdOutlineDesignServices,
  MdOutlineWebhook,
} from "react-icons/md";
import { FaReact } from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
import { IoGameController } from "react-icons/io5";
import { TbAppsFilled } from "react-icons/tb";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import { ROLE } from "../utils/constants";
import { formatSalary, initials } from "../utils/format";
import JobCard from "../components/Job/JobCard";
import { JobGridSkeleton } from "../components/UI/Loader";
import EmptyState from "../components/UI/EmptyState";

const categoryIcons = [
  { match: "design", icon: <MdOutlineDesignServices /> },
  { match: "mobile", icon: <TbAppsFilled /> },
  { match: "frontend", icon: <MdOutlineWebhook /> },
  { match: "mern", icon: <FaReact /> },
  { match: "finance", icon: <MdAccountBalance /> },
  { match: "intelligence", icon: <GiArtificialIntelligence /> },
  { match: "animation", icon: <MdOutlineAnimation /> },
  { match: "game", icon: <IoGameController /> },
];

const getCategoryIcon = (name = "") => {
  const lower = name.toLowerCase();
  const found = categoryIcons.find((item) => lower.includes(item.match));
  return found?.icon || <FiGrid />;
};

const whyHireHub = [
  {
    icon: <FiShield />,
    title: "Verified employer accounts",
    text: "Every listing belongs to a registered employer account, so you always know which team is hiring.",
  },
  {
    icon: <FiZap />,
    title: "Apply in minutes",
    text: "Upload your resume once, add a cover letter and apply without leaving the job page.",
  },
  {
    icon: <FiEye />,
    title: "Transparent status",
    text: "Follow each application from pending to shortlisted, hired or rejected in one clear timeline.",
  },
  {
    icon: <FiUsers />,
    title: "Tools for both sides",
    text: "Seekers get saved jobs and alerts. Employers get applicant pipelines, job controls and profile review.",
  },
];

const testimonials = [
  {
    quote:
      "I could see every status change without emailing anyone. The application timeline alone saved me hours.",
    name: "Aarav Mehta",
    role: "Frontend developer",
    initials: "AM",
  },
  {
    quote:
      "Posting a role and reviewing applicants takes minutes. The pipeline view is exactly what a small hiring team needs.",
    name: "Priya Sharma",
    role: "Hiring manager",
    initials: "PS",
  },
  {
    quote:
      "Saved jobs and filters made my search feel focused instead of endless. I always knew what I had applied to.",
    name: "Daniel Kim",
    role: "Product designer",
    initials: "DK",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthorized,
    savedJobIds,
    toggleSavedJob,
  } = useApp();
  const [stats, setStats] = useState({
    openJobs: 0,
    employers: 0,
    seekers: 0,
    applications: 0,
    companies: 0,
  });
  const [categories, setCategories] = useState([]);
  const [latestJobs, setLatestJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ q: "", location: "", category: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get("/job/public/stats"),
      api.get("/job/categories"),
      api.get("/job/latest", { params: { limit: 6 } }),
      api.get("/job/companies"),
    ])
      .then(([statsRes, categoriesRes, jobsRes, companiesRes]) => {
        if (!active) return;
        setStats(statsRes.data.stats || {});
        setCategories((categoriesRes.data.categories || []).slice(0, 8));
        setLatestJobs(jobsRes.data.jobs || []);
        setCompanies(companiesRes.data.companies || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(getErrorMessage(error, "Could not load the latest jobs."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.q.trim()) params.set("q", search.q.trim());
    if (search.location.trim()) params.set("location", search.location.trim());
    if (search.category) params.set("category", search.category);
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleToggleSave = async (job) => {
    if (!user || user.role !== ROLE.SEEKER) return;
    const saved = savedJobIds.has(String(job._id));
    try {
      await api[saved ? "delete" : "post"](`/job/save/${job._id}`);
      toggleSavedJob(job._id, !saved);
      toast.success(saved ? "Removed from saved jobs." : "Job saved.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              <FiAward /> Trusted by growing teams
            </span>
            <h1>
              Find a role that fits <span>your life</span>, not just your
              resume.
            </h1>
            <p className="hero-lead">
              Discover hand-picked opportunities from verified employers, apply
              with your resume in minutes and track every application in one
              place.
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <div className="hero-search-field">
                <FiSearch />
                <input
                  type="search"
                  placeholder="Job title, skill or company"
                  value={search.q}
                  onChange={(event) =>
                    setSearch((prev) => ({ ...prev, q: event.target.value }))
                  }
                  aria-label="Search jobs"
                />
              </div>
              <div className="hero-search-field hero-search-location">
                <FiMapPin />
                <input
                  type="search"
                  placeholder="City or country"
                  value={search.location}
                  onChange={(event) =>
                    setSearch((prev) => ({
                      ...prev,
                      location: event.target.value,
                    }))
                  }
                  aria-label="Search location"
                />
              </div>
              <div className="hero-search-field hero-search-category">
                <FiGrid />
                <select
                  value={search.category}
                  onChange={(event) =>
                    setSearch((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                  aria-label="Search category"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Search jobs
              </button>
            </form>

            <div className="hero-tags">
              <span>Popular:</span>
              {["React", "MERN Stack", "UI/UX Design", "Remote"].map((tag) => (
                <Link key={tag} to={`/jobs?q=${encodeURIComponent(tag)}`}>
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-glow" />
            <div className="mock-board">
              <div className="mock-board-head">
                <div>
                  <span className="mock-dot mock-dot-red" />
                  <span className="mock-dot mock-dot-amber" />
                  <span className="mock-dot mock-dot-green" />
                </div>
                <span className="mock-board-label">Recommended for you</span>
              </div>
              {latestJobs.slice(0, 3).map((job, index) => (
                <div className="mock-job" key={job._id || index}>
                  <span className="mock-company">
                    {initials(job.companyName || job.company || "HireHub")}
                  </span>
                  <div>
                    <strong>{job.title || "Frontend Developer"}</strong>
                    <span>
                      {job.companyName || job.company || "NovaTech"} ·{" "}
                      {job.city || "Remote"}
                    </span>
                  </div>
                  <span className="mock-salary">
                    {job.fixedSalary || job.salaryFrom
                      ? formatSalary(job).split(" /")[0]
                      : "Competitive"}
                  </span>
                </div>
              ))}
              {latestJobs.length === 0 &&
                ["React Frontend Developer", "MERN Stack Developer", "UI/UX Designer"].map(
                  (title, index) => (
                    <div className="mock-job" key={title}>
                      <span className="mock-company">
                        {["NT", "BP", "HL"][index]}
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <span>Hiring now · India</span>
                      </div>
                      <span className="mock-salary">New</span>
                    </div>
                  )
                )}
            </div>

            <div className="floating-card floating-card-top">
              <span className="floating-icon floating-icon-green">
                <FiCheckCircle />
              </span>
              <div>
                <strong>Application shortlisted</strong>
                <span>NovaTech Solutions</span>
              </div>
            </div>
            <div className="floating-card floating-card-bottom">
              <span className="floating-icon floating-icon-blue">
                <FiTrendingUp />
              </span>
              <div>
                <strong>{stats.openJobs || 0} open roles</strong>
                <span>Updated today</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container hero-stats">
          <div>
            <strong>{stats.openJobs || 0}</strong>
            <span>Live jobs</span>
          </div>
          <div>
            <strong>{stats.companies || 0}</strong>
            <span>Companies hiring</span>
          </div>
          <div>
            <strong>{stats.seekers || 0}</strong>
            <span>Job seekers</span>
          </div>
          <div>
            <strong>{stats.applications || 0}</strong>
            <span>Applications made</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Explore by field</span>
              <h2>Popular categories</h2>
              <p>Find roles in the areas that match your strengths.</p>
            </div>
            <Link to="/jobs" className="section-link">
              View all jobs <FiArrowRight />
            </Link>
          </div>

          <div className="category-grid">
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div className="category-card skeleton-card" key={index}>
                    <div className="skeleton skeleton-icon" />
                    <div className="skeleton skeleton-line w-70" />
                    <div className="skeleton skeleton-line w-40" />
                  </div>
                ))
              : categories.map((category) => (
                  <Link
                    to={`/jobs?category=${encodeURIComponent(category.name)}`}
                    className="category-card"
                    key={category.name}
                  >
                    <span className="category-icon">
                      {getCategoryIcon(category.name)}
                    </span>
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">
                      {category.count} open {category.count === 1 ? "role" : "roles"}
                    </span>
                  </Link>
                ))}
          </div>
          {!loading && categories.length === 0 && (
            <EmptyState
              compact
              icon={<FiBriefcase />}
              title="No categories yet"
              message="Jobs will appear here as soon as employers start posting."
              action={
                <Link to="/register" className="btn btn-primary btn-sm">
                  Post the first job
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Fresh opportunities</span>
              <h2>Featured jobs</h2>
              <p>Recently posted roles from employers on HireHub.</p>
            </div>
            <Link to="/jobs" className="section-link">
              Browse all <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <JobGridSkeleton count={6} />
          ) : latestJobs.length > 0 ? (
            <div className="jobs-grid jobs-grid-3">
              {latestJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  saved={savedJobIds.has(String(job._id))}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FiBriefcase />}
              title="No jobs posted yet"
              message="Be the first employer to publish an opportunity on HireHub."
              action={
                <Link
                  to={isAuthorized ? "/employer/jobs/new" : "/register"}
                  className="btn btn-primary"
                >
                  Post a job
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="section" id="why-hirehub">
        <div className="container">
          <div className="section-head section-head-center">
            <div>
              <span className="eyebrow">Why HireHub</span>
              <h2>A calmer, clearer way to hire and get hired</h2>
              <p>
                Built around real accounts, real listings and real application
                statuses — not static demo screens.
              </p>
            </div>
          </div>

          <div className="value-grid">
            {whyHireHub.map((item) => (
              <div className="value-card" key={item.title}>
                <span className="value-icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="container">
          <div className="section-head section-head-center">
            <div>
              <span className="eyebrow">Simple by design</span>
              <h2>How HireHub works</h2>
              <p>Three steps from your first search to your next opportunity.</p>
            </div>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <span className="step-icon">
                <FiUserPlus />
              </span>
              <h3>Create your account</h3>
              <p>
                Sign up as a job seeker or employer. Build a profile with your
                skills, experience and resume.
              </p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <span className="step-icon">
                <FiSearch />
              </span>
              <h3>Discover the right fit</h3>
              <p>
                Search and filter by category, location, salary and employment
                type, then save the roles you love.
              </p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <span className="step-icon">
                <FiCheckCircle />
              </span>
              <h3>Apply and track progress</h3>
              <p>
                Apply with your resume and cover letter. Follow every status
                update from pending to hired.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-muted" id="companies">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Employers on HireHub</span>
              <h2>Companies hiring now</h2>
              <p>Teams of every size use HireHub to find great people.</p>
            </div>
            <Link to="/register" className="section-link">
              Start hiring <FiArrowRight />
            </Link>
          </div>

          {companies.length > 0 ? (
            <div className="company-grid">
              {companies.map((company) => (
                <div className="company-card" key={company.name}>
                  <div className="company-logo">
                    {company.logo ? (
                      <img src={company.logo} alt="" />
                    ) : (
                      <span>{initials(company.name)}</span>
                    )}
                  </div>
                  <div className="company-info">
                    <h3>{company.name}</h3>
                    <p>
                      <FiMapPin />
                      {[company.city || company.location, company.country]
                        .filter(Boolean)
                        .join(", ") || "India"}
                    </p>
                    <span className="company-openings">
                      {company.openPositions} open{" "}
                      {company.openPositions === 1 ? "position" : "positions"}
                    </span>
                  </div>
                  <Link
                    to={`/jobs?q=${encodeURIComponent(company.name)}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View jobs
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={<FiUsers />}
              title="No companies listed yet"
              message="Employer profiles and their open roles will appear here."
            />
          )}
        </div>
      </section>

      <section className="section" id="testimonials">
        <div className="container">
          <div className="section-head section-head-center">
            <div>
              <span className="eyebrow">Voices from the demo</span>
              <h2>What using HireHub feels like</h2>
              <p>
                Illustrative personas from this portfolio build — replace them
                with real quotes before launch.
              </p>
            </div>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <figure className="testimonial-card" key={item.name}>
                <div className="testimonial-stars" aria-label="Five out of five">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FiStar key={index} />
                  ))}
                </div>
                <blockquote>{item.quote}</blockquote>
                <figcaption>
                  <span className="testimonial-avatar">{item.initials}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role} · demo persona</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <span className="eyebrow eyebrow-light">Ready when you are</span>
              <h2>Your next opportunity is one search away.</h2>
              <p>
                Join HireHub today and make your job search simpler, more
                transparent and more human.
              </p>
            </div>
            <div className="cta-actions">
              {isAuthorized ? (
                <Link
                  to={user?.role === ROLE.ADMIN ? "/admin" : "/dashboard"}
                  className="btn btn-light"
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-light">
                    Create an account
                  </Link>
                  <Link to="/jobs" className="btn btn-ghost-light">
                    Browse jobs
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
