// /components/ui/RefTrackGallery.js

import RefTrackCard from './RefTrackCard';
import { REF_BANK } from '@/lib/data/refbank';

const RefTrackGallery = ({ onSelect }) => {
  return (
    <div>
      {REF_BANK.map((track) => (
        <RefTrackCard key={track.id} refData={track} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default RefTrackGallery;
