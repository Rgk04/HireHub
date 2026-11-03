import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCamera,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiLock,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import api, { getErrorMessage, multipartConfig } from "../api/axios";
import { useApp } from "../context/AppContext";
import { ROLE } from "../utils/constants";
import { profileCompletion } from "../utils/format";
import Avatar from "../components/UI/Avatar";
import Spinner from "../components/UI/Loader";
import ConfirmDialog from "../components/UI/ConfirmDialog";

const emptyEducation = () => ({
  degree: "",
  institution: "",
  year: "",
  grade: "",
});

const emptyExperience = () => ({
  title: "",
  company: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
});

const Profile = () => {
  const { user, setUser, refreshUser } = useApp();
  const avatarInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    headline: "",
    bio: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    companyName: "",
    companyWebsite: "",
    companySize: "",
    industry: "",
    companyDescription: "",
    skills: "",
    education: [],
    experience: [],
  });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [removeResumeOpen, setRemoveResumeOpen] = useState(false);
  const [removingResume, setRemovingResume] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      headline: user.profile?.headline || "",
      bio: user.profile?.bio || "",
      location: user.profile?.location || "",
      website: user.profile?.website || "",
      linkedin: user.profile?.linkedin || "",
      github: user.profile?.github || "",
      companyName: user.profile?.companyName || "",
      companyWebsite: user.profile?.companyWebsite || "",
      companySize: user.profile?.companySize || "",
      industry: user.profile?.industry || "",
      companyDescription: user.profile?.companyDescription || "",
      skills: (user.skills || []).join(", "),
      education: (user.education || []).map((item) => ({
        degree: item.degree || "",
        institution: item.institution || "",
        year: item.year || "",
        grade: item.grade || "",
      })),
      experience: (user.experience || []).map((item) => ({
        title: item.title || "",
        company: item.company || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        current: Boolean(item.current),
        description: item.description || "",
      })),
    });
  }, [user]);

  if (!user) return null;

  const isSeeker = user.role === ROLE.SEEKER;
  const completion = profileCompletion(user);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const updateEducation = (index, patch) =>
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));

  const updateExperience = (index, patch) =>
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Name, email and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        profile: {
          headline: form.headline,
          bio: form.bio,
          location: form.location,
          website: form.website,
          linkedin: form.linkedin,
          github: form.github,
          ...(isSeeker
            ? {}
            : {
                companyName: form.companyName,
                companyWebsite: form.companyWebsite,
                companySize: form.companySize,
                industry: form.industry,
                companyDescription: form.companyDescription,
              }),
        },
      };

      if (isSeeker) {
        payload.skills = form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean);
        payload.education = form.education.filter(
          (item) => item.degree.trim() || item.institution.trim()
        );
        payload.experience = form.experience
          .filter((item) => item.title.trim() || item.company.trim())
          .map((item) => ({
            ...item,
            endDate: item.current ? "" : item.endDate,
          }));
      }

      const { data } = await api.put("/user/profile", payload);
      setUser(data.user);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save your profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be 2 MB or smaller.");
      return;
    }
    const payload = new FormData();
    payload.append("avatar", file);
    setAvatarUploading(true);
    try {
      const { data } = await api.post("/user/avatar", payload, multipartConfig);
      setUser(data.user);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not upload your photo."));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleResumeChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();
    if (![".pdf", ".doc", ".docx"].includes(extension)) {
      toast.error("Please upload a PDF, DOC or DOCX file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be 5 MB or smaller.");
      return;
    }
    const payload = new FormData();
    payload.append("resume", file);
    setResumeUploading(true);
    try {
      const { data } = await api.post("/user/resume", payload, multipartConfig);
      setUser(data.user);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not upload your resume."));
    } finally {
      setResumeUploading(false);
    }
  };

  const handleRemoveResume = async () => {
    setRemovingResume(true);
    try {
      const { data } = await api.delete("/user/resume");
      setUser(data.user);
      await refreshUser();
      toast.success(data.message);
      setRemoveResumeOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove your resume."));
    } finally {
      setRemovingResume(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please complete all password fields.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      const { data } = await api.put("/user/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setUser(data.user);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update your password."));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <FiUser /> Account settings
          </span>
          <h1>My profile</h1>
          <p>
            {isSeeker
              ? "A complete profile helps employers understand your experience."
              : "Keep your company details up to date for candidates."}
          </p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="panel profile-card">
            <div className="profile-avatar-wrap">
              <Avatar
                src={user.avatar?.url}
                name={user.name}
                size="xl"
                alt="Your profile photo"
              />
              <button
                type="button"
                className="avatar-edit"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Change profile photo"
                disabled={avatarUploading}
              >
                {avatarUploading ? <Spinner size="sm" /> : <FiCamera />}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
            </div>
            <h2>{user.name}</h2>
            <p className="muted">{user.profile?.headline || user.role}</p>
            <span className="badge badge-neutral">{user.role}</span>

            <div className="profile-completion">
              <div className="profile-completion-head">
                <span>Profile completion</span>
                <strong>{completion}%</strong>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${completion}%` }} />
              </div>
            </div>

            <ul className="profile-quick-facts">
              <li>
                <FiCheckCircle /> Member since{" "}
                {new Date(user.createdAt).getFullYear()}
              </li>
              {isSeeker && (
                <li>
                  <FiFileText />{" "}
                  {user.resume?.url ? "Resume uploaded" : "No resume yet"}
                </li>
              )}
            </ul>
          </div>

          {isSeeker && (
            <div className="panel">
              <div className="panel-head">
                <h2>Resume</h2>
                <p>This resume is attached to new applications by default.</p>
              </div>

              {user.resume?.url ? (
                <div className="resume-current">
                  <FiFileText />
                  <div>
                    <strong>{user.resume.originalName || "Resume"}</strong>
                    <span>Saved on your profile</span>
                  </div>
                </div>
              ) : (
                <p className="muted small">No resume uploaded yet.</p>
              )}

              <div className="resume-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={resumeUploading}
                >
                  {resumeUploading ? <Spinner size="sm" /> : <FiUploadCloud />}
                  {user.resume?.url ? "Replace" : "Upload"}
                </button>
                {user.resume?.url && (
                  <>
                    <a
                      href={user.resume.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      <FiDownload /> View
                    </a>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={() => setRemoveResumeOpen(true)}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  </>
                )}
              </div>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                hidden
                onChange={handleResumeChange}
              />
            </div>
          )}
        </aside>

        <div className="profile-main">
          <form className="panel profile-form" onSubmit={handleSave}>
            <div className="panel-head">
              <h2>Basic information</h2>
              <p>How employers and candidates see you.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => update({ name: event.target.value })}
                  maxLength={60}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="profile-email">Email address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="profile-phone">Phone number</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update({ phone: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="profile-location">Location</label>
                <input
                  id="profile-location"
                  type="text"
                  placeholder="City, country"
                  value={form.location}
                  onChange={(event) => update({ location: event.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="field field-span-2">
                <label htmlFor="profile-headline">
                  {isSeeker ? "Professional headline" : "Your role at the company"}
                </label>
                <input
                  id="profile-headline"
                  type="text"
                  placeholder={
                    isSeeker
                      ? "e.g. MERN Stack Developer with 3 years of experience"
                      : "e.g. Talent Acquisition Lead"
                  }
                  value={form.headline}
                  onChange={(event) => update({ headline: event.target.value })}
                  maxLength={160}
                />
              </div>
              <div className="field field-span-2">
                <label htmlFor="profile-bio">About</label>
                <textarea
                  id="profile-bio"
                  rows={5}
                  maxLength={1500}
                  placeholder={
                    isSeeker
                      ? "A short summary of your experience, strengths and what you are looking for."
                      : "A short introduction to you and your team."
                  }
                  value={form.bio}
                  onChange={(event) => update({ bio: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="profile-website">Website</label>
                <input
                  id="profile-website"
                  type="url"
                  placeholder="https://"
                  value={form.website}
                  onChange={(event) => update({ website: event.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="profile-linkedin">LinkedIn</label>
                <input
                  id="profile-linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/…"
                  value={form.linkedin}
                  onChange={(event) => update({ linkedin: event.target.value })}
                />
              </div>
              {isSeeker && (
                <div className="field">
                  <label htmlFor="profile-github">GitHub</label>
                  <input
                    id="profile-github"
                    type="url"
                    placeholder="https://github.com/…"
                    value={form.github}
                    onChange={(event) => update({ github: event.target.value })}
                  />
                </div>
              )}
            </div>

            {!isSeeker && (
              <>
                <div className="panel-head form-section-head">
                  <h2>Company details</h2>
                  <p>Shown on every job you post.</p>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="profile-company">Company name</label>
                    <input
                      id="profile-company"
                      type="text"
                      value={form.companyName}
                      onChange={(event) =>
                        update({ companyName: event.target.value })
                      }
                      maxLength={120}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profile-company-website">Company website</label>
                    <input
                      id="profile-company-website"
                      type="url"
                      placeholder="https://"
                      value={form.companyWebsite}
                      onChange={(event) =>
                        update({ companyWebsite: event.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profile-company-size">Company size</label>
                    <select
                      id="profile-company-size"
                      value={form.companySize}
                      onChange={(event) =>
                        update({ companySize: event.target.value })
                      }
                    >
                      <option value="">Select size</option>
                      {[
                        "1-10 employees",
                        "11-50 employees",
                        "51-200 employees",
                        "201-500 employees",
                        "501-1000 employees",
                        "1000+ employees",
                      ].map((size) => (
                        <option value={size} key={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="profile-industry">Industry</label>
                    <input
                      id="profile-industry"
                      type="text"
                      placeholder="e.g. Information Technology"
                      value={form.industry}
                      onChange={(event) =>
                        update({ industry: event.target.value })
                      }
                      maxLength={120}
                    />
                  </div>
                  <div className="field field-span-2">
                    <label htmlFor="profile-company-description">
                      About the company
                    </label>
                    <textarea
                      id="profile-company-description"
                      rows={5}
                      maxLength={1500}
                      placeholder="What does your company do? What is it like to work there?"
                      value={form.companyDescription}
                      onChange={(event) =>
                        update({ companyDescription: event.target.value })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {isSeeker && (
              <>
                <div className="panel-head form-section-head">
                  <h2>Skills</h2>
                  <p>Separate each skill with a comma.</p>
                </div>
                <div className="field">
                  <input
                    type="text"
                    placeholder="React, JavaScript, Node.js, MongoDB"
                    value={form.skills}
                    onChange={(event) => update({ skills: event.target.value })}
                  />
                </div>

                <div className="panel-head form-section-head panel-head-row">
                  <div>
                    <h2>Education</h2>
                    <p>Add your degrees and certifications.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      update({
                        education: [...form.education, emptyEducation()],
                      })
                    }
                  >
                    <FiPlus /> Add education
                  </button>
                </div>

                {form.education.length === 0 ? (
                  <p className="muted small">No education added yet.</p>
                ) : (
                  <div className="repeat-list">
                    {form.education.map((item, index) => (
                      <div className="repeat-card" key={index}>
                        <div className="repeat-card-head">
                          <strong>Education {index + 1}</strong>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() =>
                              update({
                                education: form.education.filter(
                                  (_, i) => i !== index
                                ),
                              })
                            }
                            aria-label="Remove education"
                          >
                            <FiX />
                          </button>
                        </div>
                        <div className="form-grid">
                          <div className="field">
                            <label>Degree</label>
                            <input
                              type="text"
                              placeholder="e.g. B.Tech Computer Science"
                              value={item.degree}
                              onChange={(event) =>
                                updateEducation(index, {
                                  degree: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Institution</label>
                            <input
                              type="text"
                              placeholder="e.g. Delhi University"
                              value={item.institution}
                              onChange={(event) =>
                                updateEducation(index, {
                                  institution: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Year</label>
                            <input
                              type="text"
                              placeholder="e.g. 2022"
                              value={item.year}
                              onChange={(event) =>
                                updateEducation(index, {
                                  year: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Grade</label>
                            <input
                              type="text"
                              placeholder="e.g. 8.4 CGPA"
                              value={item.grade}
                              onChange={(event) =>
                                updateEducation(index, {
                                  grade: event.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="panel-head form-section-head panel-head-row">
                  <div>
                    <h2>Experience</h2>
                    <p>Your work history and responsibilities.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      update({
                        experience: [...form.experience, emptyExperience()],
                      })
                    }
                  >
                    <FiPlus /> Add experience
                  </button>
                </div>

                {form.experience.length === 0 ? (
                  <p className="muted small">No work experience added yet.</p>
                ) : (
                  <div className="repeat-list">
                    {form.experience.map((item, index) => (
                      <div className="repeat-card" key={index}>
                        <div className="repeat-card-head">
                          <strong>Experience {index + 1}</strong>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() =>
                              update({
                                experience: form.experience.filter(
                                  (_, i) => i !== index
                                ),
                              })
                            }
                            aria-label="Remove experience"
                          >
                            <FiX />
                          </button>
                        </div>
                        <div className="form-grid">
                          <div className="field">
                            <label>Job title</label>
                            <input
                              type="text"
                              placeholder="e.g. Frontend Developer"
                              value={item.title}
                              onChange={(event) =>
                                updateExperience(index, {
                                  title: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Company</label>
                            <input
                              type="text"
                              placeholder="e.g. NovaTech"
                              value={item.company}
                              onChange={(event) =>
                                updateExperience(index, {
                                  company: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Start date</label>
                            <input
                              type="text"
                              placeholder="e.g. Jan 2022"
                              value={item.startDate}
                              onChange={(event) =>
                                updateExperience(index, {
                                  startDate: event.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>End date</label>
                            <input
                              type="text"
                              placeholder="e.g. Dec 2023"
                              value={item.endDate}
                              onChange={(event) =>
                                updateExperience(index, {
                                  endDate: event.target.value,
                                })
                              }
                              disabled={item.current}
                            />
                            <label className="check-row">
                              <input
                                type="checkbox"
                                checked={item.current}
                                onChange={(event) =>
                                  updateExperience(index, {
                                    current: event.target.checked,
                                  })
                                }
                              />
                              <span>I currently work here</span>
                            </label>
                          </div>
                          <div className="field field-span-2">
                            <label>Description</label>
                            <textarea
                              rows={3}
                              placeholder="Key responsibilities and achievements"
                              value={item.description}
                              onChange={(event) =>
                                updateExperience(index, {
                                  description: event.target.value,
                                })
                              }
                              maxLength={1000}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? <Spinner size="sm" /> : <FiSave />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          <form className="panel profile-form" onSubmit={handlePasswordChange}>
            <div className="panel-head">
              <h2>Password &amp; security</h2>
              <p>Use at least 8 characters for your new password.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="current-password">Current password</label>
                <div className="input-wrap">
                  <FiLock className="input-icon" />
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <div className="input-wrap">
                  <FiLock className="input-icon" />
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <div className="input-wrap">
                  <FiLock className="input-icon" />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={changingPassword}
              >
                {changingPassword && <Spinner size="sm" />}
                {changingPassword ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={removeResumeOpen}
        title="Remove your resume?"
        message="Your saved resume will be deleted. Applications you have already submitted keep the resume that was attached to them."
        confirmLabel="Remove resume"
        loading={removingResume}
        onConfirm={handleRemoveResume}
        onClose={() => setRemoveResumeOpen(false)}
      />
    </div>
  );
};

export default Profile;
