-- Create events table

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location_type TEXT NOT NULL CHECK (location_type IN ('online', 'in-person')),
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    banner_url TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('public', 'private')),
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_invitations table

CREATE TABLE IF NOT EXISTS event_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'interested', 'going', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);




ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public events are viewable by everyone"
    ON events FOR SELECT
    USING (event_type = 'public' OR organizer_id = auth.uid());
CREATE POLICY "Users can create their own events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their own events"
    ON events FOR UPDATE
    USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their own events"
    ON events FOR DELETE
    USING (auth.uid() = organizer_id);


ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view invitations for their events or sent to them"
    ON event_invitations FOR SELECT
    USING (
        user_id = auth.uid() OR 
        invited_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_invitations.event_id 
            AND events.organizer_id = auth.uid()
        )
    );
CREATE POLICY "Organizers can create invitations"
    ON event_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_id 
            AND events.organizer_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own invitation status"
    ON event_invitations FOR UPDATE
    USING (user_id = auth.uid());
CREATE POLICY "Organizers can delete invitations for their events"
    ON event_invitations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_id 
            AND events.organizer_id = auth.uid()
        )
    );

-- Storage policies for event-banners bucket
CREATE POLICY "Anyone can view event banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-banners');

CREATE POLICY "Authenticated users can upload event banners"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'event-banners' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own event banners"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'event-banners' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own event banners"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'event-banners' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
