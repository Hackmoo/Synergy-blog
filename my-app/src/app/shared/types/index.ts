export interface User {
  id: string;
  username: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  tags: string[];
  isPrivate: boolean; 
  createdAt: string;
}
