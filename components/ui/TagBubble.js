// /components/ui/TagBubble.js

const TagBubble = ({ text }) => (
  <span style={{
    display: 'inline-block',
    background: '#111',
    color: '#fff',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    marginRight: '8px',
    marginBottom: '8px',
    border: '1px solid #333'
  }}>
    {text}
  </span>
);

export default TagBubble;
