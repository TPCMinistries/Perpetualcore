import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/contacts/[contactId]/network
 * Get comprehensive network data for a contact including:
 * - Direct connections
 * - Mutual connections with other contacts
 * - Suggested connections based on tags, company, industry
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = params.contactId;

    // Get the contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, company, industry, tags, job_title")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (contactError || !contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }

    // Get direct connections (where this contact is either contact_a or contact_b)
    const { data: connectionsA } = await supabase
      .from("contact_connections")
      .select(`
        id,
        relationship_type,
        strength,
        notes,
        created_at,
        connected:contact_b_id(
          id,
          first_name,
          last_name,
          avatar_url,
          company,
          job_title,
          relationship_strength
        )
      `)
      .eq("contact_a_id", contactId);

    const { data: connectionsB } = await supabase
      .from("contact_connections")
      .select(`
        id,
        relationship_type,
        strength,
        notes,
        created_at,
        connected:contact_a_id(
          id,
          first_name,
          last_name,
          avatar_url,
          company,
          job_title,
          relationship_strength
        )
      `)
      .eq("contact_b_id", contactId);

    // Combine and format connections
    const directConnections = [
      ...(connectionsA || []).map((c: any) => ({
        id: c.id,
        contact: c.connected,
        relationship_type: c.relationship_type,
        strength: c.strength,
        notes: c.notes,
        created_at: c.created_at,
      })),
      ...(connectionsB || []).map((c: any) => ({
        id: c.id,
        contact: c.connected,
        relationship_type: c.relationship_type,
        strength: c.strength,
        notes: c.notes,
        created_at: c.created_at,
      })),
    ].filter(c => c.contact);

    // Get IDs of direct connections
    const directConnectionIds = directConnections.map(c => c.contact.id);

    // Find mutual connections - contacts that share connections with this contact
    const mutualConnections: any[] = [];

    if (directConnectionIds.length > 0) {
      // For each direct connection, find their connections
      for (const conn of directConnections.slice(0, 5)) { // Limit to avoid too many queries
        const connId = conn.contact.id;

        // Get this connection's other connections
        const { data: theirConnectionsA } = await supabase
          .from("contact_connections")
          .select("contact_b_id")
          .eq("contact_a_id", connId);

        const { data: theirConnectionsB } = await supabase
          .from("contact_connections")
          .select("contact_a_id")
          .eq("contact_b_id", connId);

        const theirConnectionIds = [
          ...(theirConnectionsA || []).map((c: any) => c.contact_b_id),
          ...(theirConnectionsB || []).map((c: any) => c.contact_a_id),
        ];

        // Find overlap with our direct connections (excluding the original contact and this connection)
        const mutualIds = theirConnectionIds.filter(
          id => directConnectionIds.includes(id) && id !== contactId && id !== connId
        );

        if (mutualIds.length > 0) {
          mutualConnections.push({
            through: conn.contact,
            mutual_count: mutualIds.length,
            mutual_ids: mutualIds,
          });
        }
      }
    }

    // Find suggested connections based on shared attributes
    const suggestions: any[] = [];

    // Get contacts with similar tags
    if (contact.tags && contact.tags.length > 0) {
      const { data: tagMatches } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, avatar_url, company, job_title, tags, relationship_strength")
        .eq("user_id", user.id)
        .neq("id", contactId)
        .overlaps("tags", contact.tags)
        .not("id", "in", `(${[contactId, ...directConnectionIds].join(",")})`)
        .limit(5);

      if (tagMatches) {
        for (const match of tagMatches) {
          const sharedTags = (match.tags || []).filter((t: string) =>
            contact.tags.includes(t)
          );
          if (sharedTags.length > 0) {
            suggestions.push({
              contact: match,
              reason: `Shared interests: ${sharedTags.join(", ")}`,
              reason_type: "tags",
              score: sharedTags.length,
            });
          }
        }
      }
    }

    // Get contacts at the same company
    if (contact.company) {
      const { data: companyMatches } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, avatar_url, company, job_title, relationship_strength")
        .eq("user_id", user.id)
        .eq("company", contact.company)
        .neq("id", contactId)
        .not("id", "in", `(${[contactId, ...directConnectionIds].join(",")})`)
        .limit(5);

      if (companyMatches) {
        for (const match of companyMatches) {
          // Don't add duplicates
          if (!suggestions.find(s => s.contact.id === match.id)) {
            suggestions.push({
              contact: match,
              reason: `Works at ${contact.company}`,
              reason_type: "company",
              score: 3,
            });
          }
        }
      }
    }

    // Get contacts in the same industry
    if (contact.industry) {
      const { data: industryMatches } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, avatar_url, company, job_title, industry, relationship_strength")
        .eq("user_id", user.id)
        .eq("industry", contact.industry)
        .neq("id", contactId)
        .not("id", "in", `(${[contactId, ...directConnectionIds].join(",")})`)
        .limit(5);

      if (industryMatches) {
        for (const match of industryMatches) {
          // Don't add duplicates
          if (!suggestions.find(s => s.contact.id === match.id)) {
            suggestions.push({
              contact: match,
              reason: `Same industry: ${contact.industry}`,
              reason_type: "industry",
              score: 2,
            });
          }
        }
      }
    }

    // Sort suggestions by score
    suggestions.sort((a, b) => b.score - a.score);

    // Build network graph data for visualization
    const nodes = [
      {
        id: contactId,
        name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
        type: "primary",
        company: contact.company,
      },
      ...directConnections.map(c => ({
        id: c.contact.id,
        name: `${c.contact.first_name} ${c.contact.last_name || ""}`.trim(),
        type: "connection",
        company: c.contact.company,
        strength: c.strength,
      })),
    ];

    const links = directConnections.map(c => ({
      source: contactId,
      target: c.contact.id,
      strength: c.strength,
      type: c.relationship_type,
    }));

    return Response.json({
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name || ""}`.trim(),
        company: contact.company,
        industry: contact.industry,
      },
      directConnections,
      mutualConnections: mutualConnections.slice(0, 5),
      suggestedConnections: suggestions.slice(0, 10),
      networkGraph: {
        nodes,
        links,
      },
      stats: {
        totalConnections: directConnections.length,
        closeConnections: directConnections.filter(c => c.strength === "close").length,
        mutualCount: mutualConnections.length,
        suggestionsCount: suggestions.length,
      },
    });
  } catch (error: any) {
    console.error("Network API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/contacts/[contactId]/network
 * Add a new connection between contacts
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = params.contactId;
    const body = await req.json();
    const { connected_contact_id, relationship_type, strength, notes } = body;

    if (!connected_contact_id) {
      return Response.json({ error: "connected_contact_id is required" }, { status: 400 });
    }

    // Verify both contacts belong to the user
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", user.id)
      .in("id", [contactId, connected_contact_id]);

    if (!contacts || contacts.length !== 2) {
      return Response.json({ error: "Invalid contacts" }, { status: 400 });
    }

    // Ensure consistent ordering (contact_a_id < contact_b_id)
    const [contact_a_id, contact_b_id] = [contactId, connected_contact_id].sort();

    // Create connection
    const { data: connection, error } = await supabase
      .from("contact_connections")
      .insert({
        contact_a_id,
        contact_b_id,
        relationship_type: relationship_type || null,
        strength: strength || "known",
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "Connection already exists" }, { status: 409 });
      }
      throw error;
    }

    return Response.json({ connection }, { status: 201 });
  } catch (error: any) {
    console.error("Create connection error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/contacts/[contactId]/network
 * Remove a connection
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
      return Response.json({ error: "connectionId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("contact_connections")
      .delete()
      .eq("id", connectionId);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Delete connection error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
