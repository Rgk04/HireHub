import { useEffect, useState } from "react";
import { FiBriefcase, FiCalendar, FiMapPin } from "react-icons/fi";
import api, { getErrorMessage } from "../../api/axios";
import Modal from "../UI/Modal";
import Avatar from "../UI/Avatar";
import Spinner from "../UI/Loader";
import EmptyState from "../UI/EmptyState";
import { formatDate } from "../../utils/format";

const CandidateProfileModal = ({ candidateId, open, onClose }) => {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !candidateId) return;
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(`/user/candidate/${candidateId}`)
      .then(({ data }) => {
        if (active) setCandidate(data.candidate);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Could not load this profile."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, candidateId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Candidate profile"
      subtitle="Review the candidate's background before making a decision."
      size="md"
    >
      {loading ? (
        <div className="modal-loader">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState compact icon={<FiBriefcase />} title="Profile unavailable" message={error} />
      ) : candidate ? (
        <div className="candidate-profile">
          <div className="candidate-head">
            <Avatar
              src={candidate.avatar?.url}
              name={candidate.name}
              size="xl"
            />
            <div>
              <h3>{candidate.name}</h3>
              <p className="candidate-headline">
                {candidate.profile?.headline || "Job Seeker"}
              </p>
              <div className="candidate-meta">
                {candidate.profile?.location && (
                  <span>
                    <FiMapPin /> {candidate.profile.location}
                  </span>
                )}
                <span>
                  <FiCalendar /> Joined {formatDate(candidate.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {candidate.profile?.bio && (
            <p className="candidate-bio">{candidate.profile.bio}</p>
          )}

          {candidate.skills?.length > 0 && (
            <div className="candidate-section">
              <h4>Skills</h4>
              <div className="tags">
                {candidate.skills.map((skill) => (
                  <span className="tag" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="candidate-section">
            <h4>Experience</h4>
            {candidate.experience?.length ? (
              <ul className="timeline-list">
                {candidate.experience.map((item) => (
                  <li key={item._id}>
                    <div className="timeline-dot" />
                    <div>
                      <strong>{item.title || "Role"}</strong>
                      <span className="muted">{item.company}</span>
                      <span className="timeline-date">
                        {item.startDate}
                        {item.startDate && (item.current ? " – Present" : item.endDate ? ` – ${item.endDate}` : "")}
                      </span>
                      {item.description && <p>{item.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No work experience added.</p>
            )}
          </div>

          <div className="candidate-section">
            <h4>Education</h4>
            {candidate.education?.length ? (
              <ul className="education-list">
                {candidate.education.map((item) => (
                  <li key={item._id}>
                    <strong>{item.degree || "Degree"}</strong>
                    <span className="muted">{item.institution}</span>
                    <span className="timeline-date">
                      {[item.year, item.grade].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No education details added.</p>
            )}
          </div>

          <p className="modal-note">
            Contact details and the submitted resume are available on the
            application card.
          </p>
        </div>
      ) : null}
    </Modal>
  );
};

export default CandidateProfileModal;
