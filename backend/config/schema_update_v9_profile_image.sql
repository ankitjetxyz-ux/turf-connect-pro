-- User profile image field for avatars
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_image_url text;