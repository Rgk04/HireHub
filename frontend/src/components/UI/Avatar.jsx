import { initials } from "../../utils/format";

const Avatar = ({ src, name = "", size = "md", className = "", alt }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || `${name || "User"} avatar`}
        className={`avatar avatar-${size} avatar-image ${className}`.trim()}
      />
    );
  }
  return (
    <span
      className={`avatar avatar-${size} ${className}`.trim()}
      aria-hidden="true"
      title={name}
    >
      {initials(name)}
    </span>
  );
};

export default Avatar;
