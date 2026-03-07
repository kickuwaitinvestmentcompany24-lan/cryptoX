-- Add maintenance mode to platform settings
INSERT INTO public.platform_settings (key, value)
VALUES ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
