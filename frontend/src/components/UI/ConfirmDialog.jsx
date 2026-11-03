import Modal from "./Modal";
import Spinner from "./Loader";

const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}) => (
  <Modal
    open={open}
    title={title}
    onClose={loading ? () => {} : onClose}
    size="sm"
    footer={
      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading && <Spinner size="sm" />}
          {confirmLabel}
        </button>
      </div>
    }
  >
    <p className="confirm-message">{message}</p>
  </Modal>
);

export default ConfirmDialog;
