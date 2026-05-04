export type JarvisMode = 'diagnostic' | 'spy' | 'genesis';

export interface Analysis {
  id: string;
  timestamp: number;
  mode: JarvisMode;
  files: {
    name: string;
    type: string;
    preview: string;
  }[];
  feedback: string;
  rating: number;
  tags: string[];
  userFeedback?: 'helpful' | 'not-helpful';
}

export interface UserStats {
  totalAnalyses: number;
  averageRating: number;
  topTags: { tag: string; count: number }[];
}
