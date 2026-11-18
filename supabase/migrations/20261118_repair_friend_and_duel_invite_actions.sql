-- Repair user actions for friend requests and duel invitations.
-- Applied in Supabase on 2026-11-18; kept in migrations for repository history.

DROP POLICY IF EXISTS friends_update_recipient_pending ON public.friends;
CREATE POLICY friends_update_recipient_pending
  ON public.friends FOR UPDATE TO authenticated
  USING (
    lower(recipient_username) = lower(public.current_username())
    AND status = 'pending'
  )
  WITH CHECK (
    lower(recipient_username) = lower(public.current_username())
    AND lower(requester_username) <> lower(public.current_username())
    AND status IN ('pending', 'accepted', 'rejected')
  );

DROP POLICY IF EXISTS friends_delete_participant ON public.friends;
CREATE POLICY friends_delete_participant
  ON public.friends FOR DELETE TO authenticated
  USING (
    lower(requester_username) = lower(public.current_username())
    OR lower(recipient_username) = lower(public.current_username())
  );

DROP POLICY IF EXISTS duel_invites_update_participant ON public.duel_invites;
CREATE POLICY duel_invites_update_participant
  ON public.duel_invites FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND (
      lower(from_username) = lower(public.current_username())
      OR lower(to_username) = lower(public.current_username())
    )
  )
  WITH CHECK (
    (
      lower(from_username) = lower(public.current_username())
      OR lower(to_username) = lower(public.current_username())
    )
    AND status IN ('pending', 'accepted', 'rejected', 'cancelled')
  );

NOTIFY pgrst, 'reload schema';
