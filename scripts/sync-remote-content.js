/* eslint-disable no-console */
require("dotenv").config();
const { Pool } = require("pg");

const sanitizeUrl = (value) => {
  if (!value) return "";
  return value.trim().replace(/^"|"$/g, "");
};

const localUrl = sanitizeUrl(process.env.DATABASE_URL);
const remoteUrl = sanitizeUrl(process.env.REMOTE_DATABASE_URL);

if (!localUrl || !remoteUrl) {
  console.error("DATABASE_URL and REMOTE_DATABASE_URL must be set in .env");
  process.exit(1);
}

const local = new Pool({ connectionString: localUrl });
const remote = new Pool({ connectionString: remoteUrl });

const selectAll = async (client, sql, params = []) => {
  const { rows } = await client.query(sql, params);
  return rows;
};

const buildInsert = (table, columns, rows) => {
  if (!rows.length) return null;
  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const offset = rowIndex * columns.length;
    columns.forEach((col) => values.push(row[col]));
    const slots = columns.map((_, colIndex) => `$${offset + colIndex + 1}`);
    return `(${slots.join(", ")})`;
  });
  const quotedCols = columns.map((col) => `"${col}"`).join(", ");
  return {
    text: `INSERT INTO "${table}" (${quotedCols}) VALUES ${placeholders.join(", ")}`,
    values,
  };
};

const fetchUserMappings = async () => {
  const referencedUsers = await selectAll(
    local,
    `
      SELECT DISTINCT "authorId" AS id FROM "Post"
      UNION
      SELECT DISTINCT "authorId" AS id FROM "Comment"
      UNION
      SELECT DISTINCT "userId" AS id FROM "PostLike"
      UNION
      SELECT DISTINCT "userId" AS id FROM "PostScrap"
    `
  );

  if (!referencedUsers.length) {
    return new Map();
  }

  const ids = referencedUsers.map((row) => row.id);
  const localUsers = await selectAll(
    local,
    `SELECT id, email FROM "User" WHERE id = ANY($1::text[])`,
    [ids]
  );

  const localEmailMap = new Map(
    localUsers.map((user) => [user.id, (user.email || "").toLowerCase()])
  );

  const emails = Array.from(new Set(localUsers.map((user) => (user.email || "").toLowerCase())))
    .filter(Boolean);
  if (!emails.length) {
    return new Map();
  }

  const remoteUsers = await selectAll(
    remote,
    `SELECT id, email FROM "User" WHERE lower(email) = ANY($1::text[])`,
    [emails]
  );

  const remoteEmailMap = new Map(
    remoteUsers.map((user) => [(user.email || "").toLowerCase(), user.id])
  );

  const missingEmails = emails.filter((email) => !remoteEmailMap.has(email));
  if (missingEmails.length) {
    console.error(
      `Missing user emails in remote DB (${missingEmails.length}):`,
      missingEmails.slice(0, 10).join(", ")
    );
    if (missingEmails.length > 10) {
      console.error("...and more. Create these users on remote or align emails.");
    }
    process.exit(1);
  }

  const idMap = new Map();
  localEmailMap.forEach((email, localId) => {
    if (email && remoteEmailMap.has(email)) {
      idMap.set(localId, remoteEmailMap.get(email));
    }
  });

  return idMap;
};

const mapUserId = (map, userId) => {
  if (!userId) return null;
  return map.get(userId) || null;
};

const main = async () => {
  try {
    const localHost = new URL(localUrl).hostname;
    const remoteHost = new URL(remoteUrl).hostname;
    console.log(`Local DB host: ${localHost}`);
    console.log(`Remote DB host: ${remoteHost}`);
  } catch {
    // ignore URL parsing issues here; connection will surface errors
  }
  const userMap = await fetchUserMappings();

  const [
    menus,
    menuItems,
    categories,
    contents,
    boards,
    posts,
    attachments,
    comments,
    likes,
    scraps,
  ] = await Promise.all([
    selectAll(local, `SELECT * FROM "Menu"`),
    selectAll(local, `SELECT * FROM "MenuItem"`),
    selectAll(local, `SELECT * FROM "Category"`),
    selectAll(local, `SELECT * FROM "Content"`),
    selectAll(local, `SELECT * FROM "Board"`),
    selectAll(local, `SELECT * FROM "Post"`),
    selectAll(local, `SELECT * FROM "PostAttachment"`),
    selectAll(local, `SELECT * FROM "Comment"`),
    selectAll(local, `SELECT * FROM "PostLike"`),
    selectAll(local, `SELECT * FROM "PostScrap"`),
  ]);

  const mappedPosts = posts.map((post) => ({
    ...post,
    authorId: mapUserId(userMap, post.authorId),
  }));

  const mappedComments = comments.map((comment) => ({
    ...comment,
    authorId: mapUserId(userMap, comment.authorId),
  }));

  const mappedLikes = likes.map((like) => ({
    ...like,
    userId: mapUserId(userMap, like.userId),
  }));

  const mappedScraps = scraps.map((scrap) => ({
    ...scrap,
    userId: mapUserId(userMap, scrap.userId),
  }));

  if (
    mappedPosts.some((post) => !post.authorId) ||
    mappedComments.some((comment) => !comment.authorId) ||
    mappedLikes.some((like) => !like.userId) ||
    mappedScraps.some((scrap) => !scrap.userId)
  ) {
    console.error("User mapping failed for some records. Aborting.");
    process.exit(1);
  }

  const remoteClient = await remote.connect();
  try {
    await remoteClient.query("BEGIN");
    await remoteClient.query(
      `TRUNCATE "PostLike","PostScrap","Comment","PostAttachment","Post","Board","MenuItem","Menu","Content","Category" RESTART IDENTITY`
    );

    const inserts = [
      buildInsert("Menu", ["id", "key", "name", "createdAt", "updatedAt"], menus),
      buildInsert(
        "Category",
        [
          "id",
          "name",
          "slug",
          "description",
          "thumbnailUrl",
          "order",
          "isVisible",
          "requiresAuth",
          "createdAt",
          "updatedAt",
          "listViewEnabled",
          "listViewCount",
          "listViewLabel",
          "cardViewEnabled",
          "cardViewCount",
          "cardViewLabel",
          "displayOrder",
        ],
        categories
      ),
      buildInsert(
        "Content",
        [
          "id",
          "title",
          "content",
          "imageUrl",
          "price",
          "isVisible",
          "createdAt",
          "updatedAt",
          "contentMarkdown",
          "categoryId",
          "contentType",
          "htmlContent",
        ],
        contents
      ),
      buildInsert(
        "MenuItem",
        [
          "id",
          "menuId",
          "label",
          "href",
          "order",
          "isVisible",
          "isExternal",
          "openInNew",
          "requiresAuth",
          "badgeText",
          "thumbnailUrl",
          "createdAt",
          "updatedAt",
          "linkType",
          "linkedCategoryId",
        ],
        menuItems
      ),
      buildInsert(
        "Board",
        [
          "id",
          "key",
          "slug",
          "menuItemId",
          "name",
          "description",
          "order",
          "isVisible",
          "isDeleted",
          "deletedAt",
          "createdAt",
          "updatedAt",
        ],
        boards
      ),
      buildInsert(
        "Post",
        [
          "id",
          "title",
          "content",
          "contentMarkdown",
          "boardId",
          "authorId",
          "viewCount",
          "isPinned",
          "isSecret",
          "likeCount",
          "scrapCount",
          "createdAt",
          "updatedAt",
        ],
        mappedPosts
      ),
      buildInsert(
        "PostAttachment",
        ["id", "postId", "url", "name", "type", "size", "createdAt"],
        attachments
      ),
      buildInsert(
        "Comment",
        ["id", "content", "postId", "authorId", "createdAt", "updatedAt"],
        mappedComments
      ),
      buildInsert(
        "PostLike",
        ["id", "postId", "userId", "createdAt"],
        mappedLikes
      ),
      buildInsert(
        "PostScrap",
        ["id", "postId", "userId", "createdAt"],
        mappedScraps
      ),
    ].filter(Boolean);

    for (const insert of inserts) {
      await remoteClient.query(insert.text, insert.values);
    }

    await remoteClient.query("COMMIT");
    console.log("Remote content sync completed.");
  } catch (error) {
    await remoteClient.query("ROLLBACK");
    console.error("Sync failed:", error.message);
    process.exit(1);
  } finally {
    remoteClient.release();
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await local.end();
    await remote.end();
  });
