// /components/ui/RefTrackUploader.js

const RefTrackUploader = ({ onUpload }) => {
  return (
    <label className="upload-label">
      Upload Reference Track
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => onUpload(e.target.files[0])}
        style={{ display: 'none' }}
      />
    </label>
  );
};

export default RefTrackUploader;
