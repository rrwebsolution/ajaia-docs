import { loadEnvLocal } from "./load-env";
loadEnvLocal();

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const DEMO_PASSWORD = "demo1234";

const DEMO_USERS = [
  { email: "owner@ajaia-demo.com", name: "Ryan Reyes" },
  { email: "collaborator@ajaia-demo.com", name: "Alex Chen" },
];

async function main() {
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userIds: Record<string, string> = {};

  for (const demo of DEMO_USERS) {
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", demo.email)
      .maybeSingle();

    if (existing) {
      console.log(`✓ ${demo.email} already exists, skipping creation.`);
      userIds[demo.email] = existing.id;
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: demo.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: demo.name },
    });

    if (error || !data.user) {
      console.error(`✗ Failed to create ${demo.email}:`, error?.message);
      continue;
    }

    userIds[demo.email] = data.user.id;
    console.log(`✓ Created ${demo.email} (password: ${DEMO_PASSWORD})`);
  }

  const ownerId = userIds["owner@ajaia-demo.com"];
  const collaboratorId = userIds["collaborator@ajaia-demo.com"];

  if (ownerId && collaboratorId) {
    const { data: existingDoc } = await admin
      .from("documents")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("title", "Welcome to Ajaia Docs")
      .maybeSingle();

    let docId = existingDoc?.id;

    if (!docId) {
      const { data: doc, error: docError } = await admin
        .from("documents")
        .insert({
          owner_id: ownerId,
          title: "Welcome to Ajaia Docs",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Welcome to Ajaia Docs" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "This document is owned by the demo Owner account and shared with the Collaborator account so you can try the sharing workflow immediately.",
                  },
                ],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Edit this text to see autosave in action" }],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Use the Share button to invite more people" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        })
        .select("id")
        .single();

      if (docError) {
        console.error("✗ Failed to create seed document:", docError.message);
      } else {
        docId = doc?.id;
        console.log("✓ Created seed document 'Welcome to Ajaia Docs'");
      }
    } else {
      console.log("✓ Seed document already exists, skipping creation.");
    }

    if (docId) {
      const { data: existingShare } = await admin
        .from("document_shares")
        .select("id")
        .eq("document_id", docId)
        .eq("user_id", collaboratorId)
        .maybeSingle();

      if (!existingShare) {
        const { error: shareError } = await admin
          .from("document_shares")
          .insert({ document_id: docId, user_id: collaboratorId, permission: "editor" });

        if (shareError) {
          console.error("✗ Failed to share seed document:", shareError.message);
        } else {
          console.log("✓ Shared seed document with the Collaborator account (editor access)");
        }
      } else {
        console.log("✓ Seed document already shared with the Collaborator account.");
      }
    }
  }

  console.log("\nDone. Demo accounts:");
  for (const demo of DEMO_USERS) {
    console.log(`  ${demo.email} / ${DEMO_PASSWORD}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
