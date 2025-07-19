-- Create auto-grading configuration table
CREATE TABLE IF NOT EXISTS public.auto_grading_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  polling_interval_seconds INTEGER NOT NULL DEFAULT 120,
  supported_sports TEXT[] NOT NULL DEFAULT ARRAY['football', 'soccer', 'basketball', 'tennis', 'cricket'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bet positions table
CREATE TABLE IF NOT EXISTS public.bet_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  match_id TEXT NOT NULL,
  market TEXT NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('buy', 'sell', 'win', 'loss', 'draw')),
  bet_price DECIMAL(10,2) NOT NULL,
  stake_amount DECIMAL(10,2) NOT NULL,
  potential_payout DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'cancelled')),
  final_result DECIMAL(10,2),
  profit_loss DECIMAL(10,2),
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auto grading logs table
CREATE TABLE IF NOT EXISTS public.auto_grading_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  final_result DECIMAL(10,2),
  positions_graded INTEGER NOT NULL DEFAULT 0,
  total_payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  grading_method TEXT NOT NULL DEFAULT 'auto' CHECK (grading_method IN ('auto', 'manual')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.auto_grading_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_grading_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for auto_grading_config
CREATE POLICY "Admins can manage auto grading config" 
ON public.auto_grading_config 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS policies for bet_positions
CREATE POLICY "Users can view their own bet positions" 
ON public.bet_positions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bet positions" 
ON public.bet_positions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bet positions" 
ON public.bet_positions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS policies for auto_grading_logs
CREATE POLICY "Admins can view all grading logs" 
ON public.auto_grading_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- Insert default configuration
INSERT INTO public.auto_grading_config (enabled, polling_interval_seconds, supported_sports)
VALUES (false, 120, ARRAY['football', 'soccer', 'basketball', 'tennis', 'cricket', 'mma', 'baseball', 'hockey'])
ON CONFLICT DO NOTHING;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_auto_grading_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_auto_grading_config_updated_at
  BEFORE UPDATE ON public.auto_grading_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auto_grading_updated_at();

CREATE TRIGGER update_bet_positions_updated_at
  BEFORE UPDATE ON public.bet_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auto_grading_updated_at();