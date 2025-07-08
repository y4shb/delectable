// Shared TypeScript types for Delectable

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  followers: number;
  following: number;
  level: number;
  bio?: string;
}

export interface Review {
  id: string;
  userId: string;
  venueId: string;
  rating: number;
  text: string;
  photos: string[];
  createdAt: string;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  items: PlaylistItem[];
  createdAt: string;
}

export interface PlaylistItem {
  id: string;
  venueId: string;
  caption?: string;
  photoUrl?: string;
  dateAdded: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  cuisine: string;
  rating: number;
  photoUrl?: string;
  tags?: string[];
}
