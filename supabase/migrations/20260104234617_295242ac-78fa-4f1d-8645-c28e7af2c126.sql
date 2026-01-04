-- Insert simulation mode setting
INSERT INTO public.platform_settings (key, value, description)
VALUES ('simulation_mode_enabled', 'false', 'Habilita o modo de simulação para demonstração do sistema')
ON CONFLICT (key) DO NOTHING;