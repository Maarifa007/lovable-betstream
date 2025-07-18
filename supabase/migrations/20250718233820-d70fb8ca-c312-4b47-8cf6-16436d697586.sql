-- Create interest_settings table for managing user interest preferences
CREATE TABLE public.interest_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  apy_rate DECIMAL(5,4) DEFAULT 0.05, -- 5% APY default
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.interest_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for interest_settings
CREATE POLICY "Users can view their own interest settings" 
ON public.interest_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own interest settings" 
ON public.interest_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interest settings" 
ON public.interest_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all interest settings" 
ON public.interest_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Create interest_payouts table for tracking interest payments
CREATE TABLE public.interest_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  balance_snapshot DECIMAL(10,2) NOT NULL,
  apy_rate DECIMAL(5,4) NOT NULL,
  payout_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interest_payouts ENABLE ROW LEVEL SECURITY;

-- Create policies for interest_payouts
CREATE POLICY "Users can view their own interest payouts" 
ON public.interest_payouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interest payouts" 
ON public.interest_payouts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "System can insert interest payouts" 
ON public.interest_payouts 
FOR INSERT 
WITH CHECK (true);

-- Create withdrawal_requests table for admin approval workflow
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('USDT', 'bKash', 'Nagad')),
  wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" 
ON public.withdrawal_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests" 
ON public.withdrawal_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawal requests" 
ON public.withdrawal_requests 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Create function to calculate daily interest
CREATE OR REPLACE FUNCTION public.calculate_daily_interest()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  daily_interest DECIMAL(10,2);
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Loop through all users with interest enabled
  FOR user_record IN
    SELECT 
      i.user_id,
      i.apy_rate,
      w.bet_points
    FROM interest_settings i
    JOIN wallets w ON w.user_id = i.user_id
    WHERE i.enabled = true
      AND w.bet_points > 0
  LOOP
    -- Calculate daily interest (APY / 365)
    daily_interest := user_record.bet_points * (user_record.apy_rate / 365);
    
    -- Add interest to wallet
    PERFORM update_wallet_balance(
      user_record.user_id,
      daily_interest,
      'interest',
      'Daily interest payout',
      NULL
    );
    
    -- Record the payout
    INSERT INTO interest_payouts (
      user_id,
      amount,
      balance_snapshot,
      apy_rate,
      payout_date
    ) VALUES (
      user_record.user_id,
      daily_interest,
      user_record.bet_points,
      user_record.apy_rate,
      current_date
    );
  END LOOP;
END;
$$;