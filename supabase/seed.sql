/**
 * ファイル名: seed.sql
 *
 * 【概要】
 * 開発・テスト用のサンプルデータ投入スクリプト
 */

-- 開発用ユーザー（test@example.com / password123）
-- ID: d53bf865-d101-4427-bdf2-7a802a96de5a
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd53bf865-d101-4427-bdf2-7a802a96de5a',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

INSERT INTO public.users (
  id,
  display_name,
  avatar_url,
  bio
) VALUES (
  'd53bf865-d101-4427-bdf2-7a802a96de5a',
  '開発太郎',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  '開発用のアカウントです。'
);

INSERT INTO public.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd53bf865-d101-4427-bdf2-7a802a96de5a',
  '{"sub":"d53bf865-d101-4427-bdf2-7a802a96de5a","email":"test@example.com"}',
  'email',
  current_timestamp,
  current_timestamp,
  current_timestamp
);
