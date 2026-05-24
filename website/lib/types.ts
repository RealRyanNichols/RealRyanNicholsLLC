export type PostStatus = "draft" | "published" | "hidden";
export type CommentStatus = "pending" | "approved" | "hidden" | "deleted";
export type ReactionKind =
  | "amen"
  | "pray"
  | "support"
  | "fire"
  | "flag"
  | "salute"
  | "laugh"
  | "sad"
  | "mad";
export type PostType = "text" | "note" | "photo" | "video";
export type MuxStatus = "uploading" | "processing" | "ready" | "errored";
export type LiveStreamStatus =
  | "scheduled"
  | "live"
  | "ended"
  | "errored"
  | "disabled";

export type MediaItem = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type Post = {
  id: string;
  slug: string;
  type: PostType;
  title: string | null;
  body: string;
  image_urls: string[] | null;
  media: MediaItem[] | null;
  mux_asset_id: string | null;
  mux_upload_id: string | null;
  mux_playback_id: string | null;
  mux_status: MuxStatus | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  pinned: boolean;
  status: PostStatus;
  author_id: string | null;
  category: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  shares_count: number;
};

export type LiveSimulcastTarget = {
  id: string;
  live_stream_id: string;
  platform: string;
  label: string;
  mux_simulcast_target_id: string | null;
  status: string;
  enabled: boolean;
  destination_host: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveStream = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string | null;
  status: LiveStreamStatus;
  provider: "mux" | string;
  mux_live_stream_id: string | null;
  mux_playback_id: string | null;
  mux_status: string | null;
  mux_asset_id: string | null;
  announce_count: number;
  last_announced_at: string | null;
  created_by: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  live_simulcast_targets?: LiveSimulcastTarget[];
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
