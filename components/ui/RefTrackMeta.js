// /components/ui/RefTrackMeta.js

import TagBubble from './TagBubble';

const RefTrackMeta = ({ fileName, genre, mood }) => {
  if (!fileName) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ fontSize: '14px', color: '#999', marginBottom: '6px' }}>Reference Info</h4>
      <TagBubble text={`File: ${fileName}`} />
      <TagBubble text={`Genre: ${genre}`} />
      <TagBubble text={`Mood: ${mood}`} />
    </div>
  );
};

export default RefTrackMeta;
