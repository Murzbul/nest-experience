#!/bin/sh

# Create application-specific tables for permissions and roles
# These tables are used by your AuthSupabaseRepository

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles_has_permissions junction table
CREATE TABLE IF NOT EXISTS public.roles_has_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create users_has_roles junction table (linking auth.users to roles)
CREATE TABLE IF NOT EXISTS public.users_has_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Create RPC function to check user permissions
CREATE OR REPLACE FUNCTION public.get_authorization(
  field_user_id UUID,
  permission_name VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users_has_roles uhr
    JOIN public.roles_has_permissions rhp ON uhr.role_id = rhp.role_id
    JOIN public.permissions p ON rhp.permission_id = p.id
    WHERE uhr.user_id = field_user_id
      AND p.name = permission_name
  );
END;
\$\$;

-- Enable RLS on custom tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_has_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_has_roles ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
-- Allow service_role to do everything
CREATE POLICY "service_role_all_permissions" ON public.permissions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_roles" ON public.roles FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_roles_permissions" ON public.roles_has_permissions FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_users_roles" ON public.users_has_roles FOR ALL TO service_role USING (true);

-- Allow authenticated users to read their own roles and permissions
CREATE POLICY "authenticated_read_permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_user_roles" ON public.users_has_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION public.get_authorization TO anon, authenticated, service_role;

EOSQL

echo "Application tables and permissions created successfully"
