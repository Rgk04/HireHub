import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiEdit3 } from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import { useApp } from "../context/AppContext";
import JobForm from "../components/Job/JobForm";
import EmptyState from "../components/UI/EmptyState";
import { PageLoader } from "../components/UI/Loader";

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get(`/job/${id}`)
      .then(({ data }) => {
        if (!active) return;
        const ownerId = data.job?.postedBy?._id;
        if (
          ownerId &&
          user?._id &&
          String(ownerId) !== String(user._id) &&
          user.role !== "Admin"
        ) {
          setError("You are not authorized to edit this job.");
          return;
        }
        setJob(data.job);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "This job could not be loaded."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const { data } = await api.put(`/job/update/${id}`, payload);
      toast.success(data.message || "Job updated.");
      navigate("/employer/jobs", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update this job."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader label="Loading job listing…" />;

  if (error || !job) {
    return (
      <EmptyState
        icon={<FiEdit3 />}
        title="Unable to edit this job"
        message={error || "This job listing could not be found."}
        action={
          <Link to="/employer/jobs" className="btn btn-primary">
            Back to my jobs
          </Link>
        }
      />
    );
  }

  return (
    <div className="job-editor-page">
      <Link to="/employer/jobs" className="back-link">
        <FiArrowLeft /> Back to my jobs
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiEdit3 /> Update listing
          </span>
          <h1>Edit {job.title}</h1>
          <p>Changes are visible to candidates as soon as you save.</p>
        </div>
        <Link to={`/jobs/${job._id}`} className="btn btn-secondary">
          View public listing
        </Link>
      </div>
      <JobForm
        initialValues={job}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save changes"
        cancelTo="/employer/jobs"
      />
    </div>
  );
};

export default EditJob;
