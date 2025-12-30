-- Supabase schema for chats, messages, payments, commissions

-- Chats table: one row per 1-to-1 conversation between a client (turf owner) and a player
create table if not exists chats (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null,
  player_id uuid not null,
  last_message text,
  unread_count int default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_chats_owner on chats(owner_id);
create index if not exists idx_chats_player on chats(player_id);
create index if not exists idx_chats_updated on chats(updated_at desc);
-- Composite index for fast lookup of specific conversation
create index if not exists idx_chats_owner_player on chats(owner_id, player_id);

-- Messages table: messages belonging to a chat
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid not null,
  sender_role text not null,
  content text not null,
  metadata jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_messages_chat on messages(chat_id);
create index if not exists idx_messages_chat_created on messages(chat_id, created_at);

-- Function to update chat timestamp on new message
create or replace function update_chat_timestamp()
returns trigger as $$
begin
  update chats
  set updated_at = now(),
      last_message = new.content
  where id = new.chat_id;
  return new;
end;
$$ language plpgsql;

-- Trigger for message insertion
drop trigger if exists on_message_insert on messages;
create trigger on_message_insert
after insert on messages
for each row
execute function update_chat_timestamp();

-- Payments table
create table if not exists payments (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid not null,
  turf_id uuid,
  payer_id uuid not null,
  amount numeric(10,2) not null,
  currency varchar(10) default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text not null default 'pending', -- pending, paid, failed, refunded
  admin_cut numeric(10,2) default 0,
  owner_cut numeric(10,2) default 0,
  created_at timestamptz default now()
);

create index if not exists idx_payments_booking on payments(booking_id);

-- Simple earnings table to track admin and owner balances
create table if not exists earnings (
  id uuid default gen_random_uuid() primary key,
  entity_id uuid not null, -- admin account or owner id
  entity_type text not null, -- 'admin' or 'owner'
  amount numeric(12,2) not null default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_earnings_entity on earnings(entity_id, entity_type);

-- Unique constraint for earnings to support upsert
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'earnings_entity_id_entity_type_key') then
    alter table earnings add constraint earnings_entity_id_entity_type_key unique (entity_id, entity_type);
  end if;
end $$;

-- Function to increment earning safely
create or replace function increment_earning(p_entity_id uuid, p_entity_type text, p_amount numeric)
returns void as $$
begin
  insert into earnings (entity_id, entity_type, amount, updated_at)
  values (p_entity_id, p_entity_type, p_amount, now())
  on conflict (entity_id, entity_type)
  do update set amount = earnings.amount + excluded.amount, updated_at = now();
end;
$$ language plpgsql;

-- Contact Messages table
create table if not exists contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text,
  subject text,
  message text,
  admin_email text default 'ankitjetxyz@gmail.com',
  status text default 'unread',
  user_id uuid,
  created_at timestamptz default now()
);
