import type { JSONContent } from "@tiptap/react";

export type SharePermission = "editor" | "viewer";

export interface DocumentRecord {
  id: string;
  owner_id: string;
  title: string;
  content: JSONContent;
  created_at: string;
  updated_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  user_id: string;
  permission: SharePermission;
  created_at: string;
}

export interface DocumentShareWithUser extends DocumentShare {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/** A document as listed on the dashboard, enriched with owner + access info. */
export interface DocumentListItem {
  id: string;
  title: string;
  updated_at: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  isOwner: boolean;
  permission: SharePermission | "owner";
}

export const EMPTY_DOCUMENT_CONTENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
