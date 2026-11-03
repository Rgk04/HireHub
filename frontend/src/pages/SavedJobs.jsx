import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiBookmark, FiSearch } from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import JobCard from "../components/Job/JobCard";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";
import { JobGridSkeleton } from "../components/UI/Loader";

const SavedJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const { savedJobIds, toggleSavedJob } = useApp();

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    totalJobs: 0,
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/job/saved", {
        params: { page, limit: 9 },
      });
      setJobs(data.jobs || []);
      setPagination({
        totalJobs: data.totalJobs || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your saved jobs."));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const setPage = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value <= 1) params.delete("page");
    else params.set("page", value);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleSave = async (job) => {
    const isSaved = savedJobIds.has(String(job._id));
    try {
      await api[isSaved ? "delete" : "post"](`/job/save/${job._id}`);
      toggleSavedJob(job._id, !isSaved);
      if (isSaved) {
        setJobs((prev) => prev.filter((item) => item._id !== job._id));
        setPagination((prev) => ({
          ...prev,
          totalJobs: Math.max(0, prev.totalJobs - 1),
        }));
      }
      toast.success(isSaved ? "Removed from saved jobs." : "Job saved.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="saved-jobs-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiBookmark /> Your shortlist
          </span>
          <h1>Saved jobs</h1>
          <p>Keep interesting roles in one place and apply when you are ready.</p>
        </div>
        <Link to="/jobs" className="btn btn-primary">
          <FiSearch /> Find jobs
        </Link>
      </div>

      {loading ? (
        <JobGridSkeleton count={6} />
      ) : error ? (
        <EmptyState
          icon={<FiBookmark />}
          title="Could not load saved jobs"
          message={error}
          action={
            <button type="button" className="btn btn-primary" onClick={fetchSaved}>
              Try again
            </button>
          }
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<FiBookmark />}
          title="No saved jobs yet"
          message="Tap the bookmark icon on any job to save it for later."
          action={
            <Link to="/jobs" className="btn btn-primary">
              Browse open roles
            </Link>
          }
        />
      ) : (
        <>
          <div className="results-note">
            {pagination.totalJobs}{" "}
            {pagination.totalJobs === 1 ? "saved job" : "saved jobs"}
          </div>
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                saved
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default SavedJobs;
