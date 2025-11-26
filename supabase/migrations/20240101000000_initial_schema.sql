-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  first_name text,
  last_name text,
  class text,
  campus text,
  favorite_subject text,
  preference text check (preference in ('frontend', 'backend')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

-- Create daily_words table
create table public.daily_words (
  id uuid default gen_random_uuid() primary key,
  word text not null unique,
  definition text not null,
  date date unique,
  created_at timestamptz default now()
);

-- Create game_attempts table
create table public.game_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  word_id uuid references public.daily_words(id) on delete cascade not null,
  attempts int not null,
  guesses jsonb not null,
  completed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.daily_words enable row level security;
alter table public.game_attempts enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Daily words policies
create policy "Daily words are viewable by everyone."
  on public.daily_words for select
  using ( true );

-- Game attempts policies
create policy "Users can view their own attempts."
  on public.game_attempts for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own attempts."
  on public.game_attempts for insert
  with check ( auth.uid() = user_id );

-- Functions

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Initial data (IT Words) - DISABLED
-- Daily words are now generated dynamically from the dictionary file (dictionnary.dic)
-- using the system in lib/wordle/daily.ts
-- Words are generated automatically when getDailyWord() is called and no word exists for the current date
--
-- If you need to insert initial words for testing, uncomment the lines below:
-- insert into public.daily_words (word, definition, date) values
-- ('REACT', 'Bibliothèque JavaScript pour créer des interfaces utilisateurs.', CURRENT_DATE),
-- ('ALGO', 'Suite d''instructions pour résoudre un problème.', CURRENT_DATE + 1),
-- ('CACHE', 'Mémoire rapide pour stocker des données temporaires.', CURRENT_DATE + 2),
-- ('DEBUG', 'Processus de recherche et correction de bugs.', CURRENT_DATE + 3),
-- ('LINUX', 'Système d''exploitation open-source.', CURRENT_DATE + 4),
-- ('CLOUD', 'Services informatiques fournis via Internet.', CURRENT_DATE + 5),
-- ('PIXEL', 'Le plus petit élément d''une image numérique.', CURRENT_DATE + 6),
-- ('PROXY', 'Intermédiaire entre un client et un serveur.', CURRENT_DATE + 7),
-- ('TOKEN', 'Jeton de sécurité ou d''authentification.', CURRENT_DATE + 8),
-- ('AGILE', 'Méthodologie de développement itérative.', CURRENT_DATE + 9),
-- ('JAVA', 'Langage de programmation orienté objet populaire.', CURRENT_DATE + 10),
-- ('HTML', 'Langage de balisage pour créer des pages web.', CURRENT_DATE + 11),
-- ('CODE', 'Instructions écrites dans un langage de programmation.', CURRENT_DATE + 12),
-- ('DATA', 'Données brutes ou informations traitées.', CURRENT_DATE + 13),
-- ('NODE', 'Environnement d''exécution JavaScript côté serveur.', CURRENT_DATE + 14),
-- ('SASS', 'Préprocesseur CSS pour écrire des styles plus efficacement.', CURRENT_DATE + 15),
-- ('WIFI', 'Technologie de réseau sans fil.', CURRENT_DATE + 16),
-- ('BUG', 'Erreur ou défaut dans un programme informatique.', CURRENT_DATE + 17),
-- ('API', 'Interface permettant à des logiciels de communiquer.', CURRENT_DATE + 18),
-- ('GIT', 'Système de contrôle de version distribué.', CURRENT_DATE + 19),
-- ('JSON', 'Format de données léger pour l''échange d''informations.', CURRENT_DATE + 20),
-- ('RUBY', 'Langage de programmation interprété et orienté objet.', CURRENT_DATE + 21),
-- ('SHELL', 'Interface utilisateur pour accéder aux services d''un OS.', CURRENT_DATE + 22),
-- ('STACK', 'Structure de données LIFO ou ensemble de technologies.', CURRENT_DATE + 23),
-- ('VIEW', 'Interface utilisateur ou table virtuelle en SQL.', CURRENT_DATE + 24),
-- ('BYTE', 'Unité de stockage d''information (octet).', CURRENT_DATE + 25),
-- ('PING', 'Commande pour tester l''accessibilité d''une machine.', CURRENT_DATE + 26),
-- ('LOOP', 'Structure de contrôle répétant des instructions.', CURRENT_DATE + 27),
-- ('ARRAY', 'Structure de données contenant une suite d''éléments.', CURRENT_DATE + 28),
-- ('CLASS', 'Modèle pour créer des objets en POO.', CURRENT_DATE + 29),
-- ('FRAME', 'Unité de transmission de données ou cadre.', CURRENT_DATE + 30),
-- ('LOGIN', 'Processus d''authentification d''un utilisateur.', CURRENT_DATE + 31);
