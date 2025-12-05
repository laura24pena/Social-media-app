// src/api/uploads.js
import { createMedia } from "./media";

/**
 * kind: 'avatar' | 'cover'
 */
export async function uploadProfileImage(file, { kind = "avatar" } = {}) {
  if (!file) throw new Error("File is required");

  const isCover = kind === "cover";

  const media = await createMedia({
    file,
    title: isCover ? "Profile cover" : "Profile avatar",
    description: isCover
      ? "User profile cover image"
      : "User profile avatar image",
    mediaType: "image",
    category: "other",
    visibility: "private",
    // tags: undefined,
    metadata: {
      usage: "profile",
      kind,
    },
  });

  if (!media) {
    throw new Error("No media returned from /api/media");
  }

  let imageUrl;

  if (isCover) {
    imageUrl =
      media.cloudUrl ||
      media.secureUrl ||
      media.secure_url ||
      media.url ||
      media.location ||
      media.thumbnailUrl;
  } else {
    imageUrl =
      media.thumbnailUrl ||
      media.cloudUrl ||
      media.secureUrl ||
      media.secure_url ||
      media.url ||
      media.location;
  }

  if (!imageUrl) {
    console.warn("Media returned from /api/media without obvious url:", media);
    throw new Error("No usable image URL returned from upload");
  }

  return {
    media,
    url: imageUrl,
  };
}
