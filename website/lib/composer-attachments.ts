// The composer's attachment registry. One tap = one hidden file input.
// Adding a new attachment type (documents, audio, polls) means appending a
// definition here and teaching the composer to route its `kind` — the
// buttons, inputs, and preview slots come for free.

export type AttachmentKind = "image" | "video";

export type AttachmentDef = {
  key: string;
  label: string;
  kind: AttachmentKind;
  accept: string;
  multiple: boolean;
  hint?: string;
};

export const COMPOSER_ATTACHMENTS: AttachmentDef[] = [
  {
    key: "photo",
    label: "Photo",
    kind: "image",
    accept: "image/*",
    multiple: true,
    hint: "Up to 20",
  },
  {
    key: "video",
    label: "Video",
    kind: "video",
    accept: "video/*",
    multiple: false,
  },
];

export const MAX_COMPOSER_IMAGES = 20;
