
-- Criar tabela para armazenar transações financeiras
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas suas próprias transações
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela para configurações de exportação
CREATE TABLE public.export_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_sheets_id TEXT,
  last_export TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela de configurações
ALTER TABLE public.export_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own export configs" ON public.export_configs
  FOR ALL USING (auth.uid() = user_id);
