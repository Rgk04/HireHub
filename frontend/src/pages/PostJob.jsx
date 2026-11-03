import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiPlusCircle } from "react-icons/fi";
import api, { getErrorMessage } from "../api/axios";
import JobForm from "../components/Job/JobForm";

const PostJob = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/job/post", payload);
      toast.success(data.message || "Job posted successfully.");
      navigate("/employer/jobs", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not publish this job."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="job-editor-page">
      <Link to="/employer/jobs" className="back-link">
        <FiArrowLeft /> Back to my jobs
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiPlusCircle /> New opportunity
          </span>
          <h1>Post a new job</h1>
          <p>Write a clear listing to attract the right candidates.</p>
        </div>
      </div>
      <JobForm
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Publish job"
        cancelTo="/employer/jobs"
      />
    </div>
  );
};

export default PostJob;
