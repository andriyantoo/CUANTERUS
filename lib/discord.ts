const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
const DISCORD_API = "https://discord.com/api/v10";

function headers() {
  return {
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/**
 * Add a role to a Discord guild member
 */
export async function addRole(discordUserId: string, roleId: string): Promise<boolean> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    { method: "PUT", headers: headers() }
  );
  return res.ok;
}

/**
 * Remove a role from a Discord guild member
 */
export async function removeRole(discordUserId: string, roleId: string): Promise<boolean> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    { method: "DELETE", headers: headers() }
  );
  return res.ok;
}

/**
 * Get Discord user info from OAuth access token
 */
export async function getDiscordUser(accessToken: string) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; username: string; discriminator: string; avatar: string }>;
}

/**
 * Add user to guild (requires bot in server + guilds.join scope)
 */
export async function addToGuild(discordUserId: string, accessToken: string, roleIds: string[] = []): Promise<boolean> {
  const res = await fetch(
    `${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
    {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({
        access_token: accessToken,
        roles: roleIds,
      }),
    }
  );
  return res.ok || res.status === 204;
}

/**
 * Get guild member info
 */
export async function getGuildMember(discordUserId: string) {
  const res = await fetch(
    `${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
    { headers: headers() }
  );
  if (!res.ok) return null;
  return res.json();
}

/**
 * Sync roles for a user based on their active subscriptions
 * Adds roles for active subs, removes roles for expired/no subs
 */
export async function syncRoles(
  discordUserId: string,
  activeProductIds: string[],
  roleMappings: { product_id: string; discord_role_id: string }[]
): Promise<{ added: string[]; removed: string[] }> {
  const added: string[] = [];
  const removed: string[] = [];

  for (const mapping of roleMappings) {
    const shouldHaveRole = activeProductIds.includes(mapping.product_id);

    if (shouldHaveRole) {
      const ok = await addRole(discordUserId, mapping.discord_role_id);
      if (ok) added.push(mapping.discord_role_id);
    } else {
      const ok = await removeRole(discordUserId, mapping.discord_role_id);
      if (ok) removed.push(mapping.discord_role_id);
    }
  }

  return { added, removed };
}
