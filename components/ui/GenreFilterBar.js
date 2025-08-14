// /components/ui/GenreFilterBar.js

const genres = ['Trap', 'R&B', 'Pop', 'Afrobeats', 'Electronic', 'Soul', 'HipHop', 'Dancehall', 'Experimental'];

const GenreFilterBar = ({ selectedGenre, onSelect }) => {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => onSelect(genre)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid #444',
            background: selectedGenre === genre ? '#0cf' : '#111',
            color: selectedGenre === genre ? '#000' : '#fff',
          }}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};

export default GenreFilterBar;
