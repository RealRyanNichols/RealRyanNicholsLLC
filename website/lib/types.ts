export type PostStatus = "draft" | "published" | "hidden";
export type CommentStatus = "pending" | "approved" | "hidden" | "deleted";
export type ReactionKind = "amen" | "pray" | "support";

export type Post = {
  id: string;
  slug: string;
  title: string;
  body: string;
  image_urls: string[] | null;
  pinned: boolean;
  status: PostStatus;
  author_id: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  verified_linked_account: boolean;
};

export type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  kind: ReactionKind;
  created_at: string;
};
