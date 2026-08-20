-- ===================================================================
-- «Лакомый кусочек» — схема базы данных для Supabase (PostgreSQL)
-- Как использовать: Supabase → ваш проект → SQL Editor → New query →
-- вставьте весь этот файл целиком → Run.
-- ===================================================================

create table if not exists cakes (
  id text primary key,
  name text not null,
  category text not null,
  weight numeric,
  tiers integer default 1,
  price numeric not null,
  available boolean default true,
  description text,
  media jsonb
);

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null,
  password text not null,
  salt text,
  role text default 'client',
  addresses jsonb
);

create table if not exists orders (
  id text primary key,
  "userId" text,
  items jsonb,
  total numeric,
  status text default 'new',
  date text,
  "deliveryDate" text,
  name text,
  phone text,
  address text,
  comment text
);

create table if not exists settings (
  id integer primary key,
  social jsonb,
  contact jsonb
);

create table if not exists support_chats (
  id text primary key,
  "visitorId" text,
  name text,
  messages jsonb,
  "unreadForAdmin" boolean default false,
  "unreadForUser" boolean default false,
  "updatedAt" bigint
);

-- ===================================================================
-- Права доступа: сайт обращается к базе напрямую из браузера через
-- публичный ("anon") ключ, поэтому доступ на чтение/запись открываем
-- для всех — как и было в упрощённой PHP-версии (без личного кабинета
-- на сервере). Если сайт вырастет в бизнес с реальными платежами —
-- понадобится более строгая защита (RLS-политики с проверкой личности
-- через Supabase Auth). Обращайтесь, когда до этого дойдёт.
-- ===================================================================

alter table cakes enable row level security;
alter table users enable row level security;
alter table orders enable row level security;
alter table settings enable row level security;
alter table support_chats enable row level security;

create policy "public read cakes" on cakes for select using (true);
create policy "public write cakes" on cakes for all using (true) with check (true);

create policy "public read users" on users for select using (true);
create policy "public write users" on users for all using (true) with check (true);

create policy "public read orders" on orders for select using (true);
create policy "public write orders" on orders for all using (true) with check (true);

create policy "public read settings" on settings for select using (true);
create policy "public write settings" on settings for all using (true) with check (true);

create policy "public read support_chats" on support_chats for select using (true);
create policy "public write support_chats" on support_chats for all using (true) with check (true);

-- ===================================================================
-- Включаем Realtime (мгновенные push-обновления при изменении данных)
-- для всех пяти таблиц — без этого сайт видел бы изменения только
-- после перезагрузки страницы.
-- ===================================================================

alter publication supabase_realtime add table cakes;
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table settings;
alter publication supabase_realtime add table support_chats;
