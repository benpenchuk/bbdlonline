import React from 'react';
import { Announcement } from '../../core/types';
import { format } from 'date-fns';

interface AnnouncementCardProps {
  announcement: Announcement | null;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  if (!announcement) {
    return (
      <div className="announcement-card-container">
        <h3 className="announcement-card-title">League Manager's Note</h3>
        <div className="announcement-card-separator"></div>
        <div className="announcement-empty-state">
          <p>No announcements at this time</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className="announcement-card-container">
      <h3 className="announcement-card-title">League Manager's Note</h3>
      <div className="announcement-card-separator"></div>
      <div className="announcement-content">
        <h4 className="announcement-title">{announcement.title}</h4>
        <div className="announcement-text">{announcement.content}</div>
        <div className="announcement-meta">
          <span className="announcement-date">Posted {formatDate(announcement.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;

