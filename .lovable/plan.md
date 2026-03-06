

## GymRats-style Challenge System

Build a challenge system where members can create/join time-bound fitness challenges, post workout proofs, and compete on a leaderboard -- all natively within the app.

### Database Schema

**New tables:**

1. **`challenges`** -- stores challenge metadata
   - `id`, `title`, `description`, `created_by` (user_id), `start_date`, `end_date`, `invite_code` (unique 6-char), `status` (active/completed), `created_at`

2. **`challenge_members`** -- who joined which challenge
   - `id`, `challenge_id`, `user_id`, `joined_at`

3. **`challenge_posts`** -- workout proofs posted to a challenge
   - `id`, `challenge_id`, `user_id`, `title`, `description`, `photo_url` (optional), `points` (default 1), `created_at`

**Storage:** Create a `challenge-photos` bucket for workout proof images.

**RLS:** Users can read challenges they belong to, insert own posts, and creators can manage their challenges.

### New Pages & Components

1. **`/desafios`** -- Main challenges page with tabs:
   - **Meus Desafios**: list of active challenges the user is in, with progress bars
   - **Criar Desafio**: form to create a new challenge (title, description, dates)
   - **Entrar por Código**: input to join via invite code

2. **`/desafios/:id`** -- Challenge detail page:
   - Challenge header (title, dates, member count, invite code to share)
   - Leaderboard ranked by total posts/points
   - Feed of workout posts (newest first) with member name, title, photo, timestamp
   - FAB button to post a new workout proof (title + optional photo)

3. **Components:**
   - `ChallengeCard` -- card preview for the challenge list
   - `ChallengeLeaderboard` -- ranked member list within a challenge
   - `ChallengePostForm` -- dialog to submit a workout proof
   - `ChallengeFeed` -- scrollable feed of posts

### Navigation

- Add "Desafios" tab to `BottomNav` with a `Swords` icon
- Add route `/desafios` and `/desafios/:id` to `App.tsx`

### Key Behaviors

- Creating a challenge generates a random 6-character invite code
- Share code via a copy button; joining checks the code and adds the user to `challenge_members`
- Each workout post = 1 point; leaderboard sorts by total points
- Challenge auto-shows as "completed" after `end_date`
- Photo upload is optional (uses Supabase Storage)

### Files to Create/Edit

- **Create:** `src/pages/Desafios.tsx`, `src/pages/DesafioDetalhe.tsx`, `src/components/ChallengeCard.tsx`, `src/components/ChallengePostForm.tsx`
- **Edit:** `src/App.tsx` (add routes), `src/components/BottomNav.tsx` (add nav item)
- **Migration:** Create `challenges`, `challenge_members`, `challenge_posts` tables with RLS
- **Storage:** Create `challenge-photos` bucket

