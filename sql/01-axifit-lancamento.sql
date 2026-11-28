-- ============================================================
-- AXIFIT · HUB DE LANÇAMENTO · cadastro, indicações e cupons do sorteio
-- Rodar no SQL Editor do Supabase (irwvagffrguiljaxrzmd), com "Run without RLS".
-- Seguro rodar de novo: não apaga dados.
-- ============================================================

-- 1) Campanha (página de cadastro e regras do lançamento)
create table if not exists axifit_lead_campanhas (
  id uuid primary key default gen_random_uuid(),
  academia_id text,
  slug text unique not null,
  nome text not null,
  origem text default 'trafego_pago',
  titulo text,
  subtitulo text,
  info text,
  capa_url text,
  cor text,
  sorteio boolean default false,
  perguntas jsonb default '{"idade":true,"treina":true,"parado":true}'::jsonb,
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table axifit_lead_campanhas add column if not exists indicacao boolean default false;
alter table axifit_lead_campanhas add column if not exists codigo_sigla text;
alter table axifit_lead_campanhas add column if not exists indicacao_limite timestamptz;
alter table axifit_lead_campanhas add column if not exists presentes jsonb;
alter table axifit_lead_campanhas add column if not exists convite_img text;
alter table axifit_lead_campanhas add column if not exists capa_convidado text;
alter table axifit_lead_campanhas add column if not exists evento_titulo text;
alter table axifit_lead_campanhas add column if not exists evento_texto text;
alter table axifit_lead_campanhas add column if not exists evento_mapa text;
alter table axifit_lead_campanhas add column if not exists evento_fim timestamptz;
alter table axifit_lead_campanhas add column if not exists oferta_ativa boolean default false;
alter table axifit_lead_campanhas add column if not exists oferta_titulo text;
alter table axifit_lead_campanhas add column if not exists oferta_texto text;
alter table axifit_lead_campanhas add column if not exists oferta_mensagem text;
alter table axifit_lead_campanhas add column if not exists whatsapp_academia text;
alter table axifit_lead_campanhas add column if not exists publico text default 'aluno';
alter table axifit_lead_campanhas add column if not exists campos_extra jsonb default '[]'::jsonb;
-- específicos do lançamento
alter table axifit_lead_campanhas add column if not exists regra_indicacao text;     -- texto mostrado depois do cadastro
alter table axifit_lead_campanhas add column if not exists equipe jsonb default '[]'::jsonb; -- nomes da equipe comercial
alter table axifit_lead_campanhas add column if not exists acesso_pin_hash text;     -- PIN da equipe (SHA-256), definido no primeiro acesso
alter table axifit_lead_campanhas add column if not exists precos jsonb;               -- parcela do anual por lote: novo e renovação
alter table axifit_lead_campanhas add column if not exists lote_atual text default 'lote1';

-- 2) Leads e participantes
create table if not exists axifit_leads (
  id uuid primary key default gen_random_uuid(),
  academia_id text,
  campanha_id uuid references axifit_lead_campanhas(id) on delete set null,
  campanha_slug text,
  nome text not null,
  whatsapp text,
  whatsapp_norm text,
  idade int,
  treina text,
  tempo_parado text,
  respostas jsonb default '{}'::jsonb,
  origem text default 'outro',
  utm_source text, utm_medium text, utm_campaign text, utm_content text,
  pagina text,
  consultora_id text,
  status text default 'novo',
  observacoes text,
  consentimento boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table axifit_leads add column if not exists codigo text;
alter table axifit_leads add column if not exists indicado_por_codigo text;
alter table axifit_leads add column if not exists indicado_por_lead uuid;
alter table axifit_leads add column if not exists indicado_por_nome text;
alter table axifit_leads add column if not exists cargo text;
alter table axifit_leads add column if not exists academia_nome text;
alter table axifit_leads add column if not exists cidade text;
alter table axifit_leads add column if not exists origem_primeira text;
alter table axifit_leads add column if not exists historico jsonb default '[]'::jsonb;
alter table axifit_leads add column if not exists card_id uuid;
alter table axifit_leads add column if not exists demo boolean default false;
alter table axifit_leads add column if not exists oculto boolean default false;
-- venda do plano anual no lançamento
alter table axifit_leads add column if not exists venda_anual boolean default false;
alter table axifit_leads add column if not exists venda_tipo text;          -- novo | upgrade | renovacao | ja_anual
alter table axifit_leads add column if not exists venda_lote text;          -- lote1 | lote2 | inauguracao
alter table axifit_leads add column if not exists venda_parcela numeric;
alter table axifit_leads add column if not exists venda_parcelas int default 12;
alter table axifit_leads add column if not exists venda_total numeric;
alter table axifit_leads add column if not exists venda_data date;
alter table axifit_leads add column if not exists venda_consultor text;
alter table axifit_leads add column if not exists venda_obs text;
alter table axifit_leads add column if not exists matricula text;     -- código da matrícula no SCA

create unique index if not exists axifit_leads_codigo_uidx on axifit_leads (codigo) where codigo is not null;
create index if not exists axifit_leads_acad_idx on axifit_leads (academia_id, created_at desc);
create index if not exists axifit_leads_wpp_idx on axifit_leads (whatsapp_norm);
create index if not exists axifit_leads_ind_idx on axifit_leads (indicado_por_codigo);
create unique index if not exists axifit_leads_matricula_uidx on axifit_leads (academia_id, matricula) where matricula is not null;

-- 3) Cupons do sorteio (numeração única e sequencial)
create table if not exists axifit_cupons (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  academia_id text,
  lead_id uuid not null references axifit_leads(id) on delete cascade,
  tipo text not null,                 -- compra | indicacao
  indicado_lead_id uuid references axifit_leads(id) on delete set null,
  created_at timestamptz default now()
);
create unique index if not exists axifit_cupons_numero_uidx on axifit_cupons (numero);
create unique index if not exists axifit_cupons_compra_uidx on axifit_cupons (lead_id) where tipo = 'compra';
create unique index if not exists axifit_cupons_indicado_uidx on axifit_cupons (indicado_lead_id) where tipo = 'indicacao';

-- Mesmo padrão das demais tabelas da plataforma (não mexe na Retenção).
alter table axifit_lead_campanhas disable row level security;
alter table axifit_leads disable row level security;
alter table axifit_cupons disable row level security;

-- 4) Campanha do lançamento
insert into axifit_lead_campanhas (academia_id, slug, nome, origem, titulo, subtitulo, cor, sorteio, ativo,
  indicacao, codigo_sigla, presentes, regra_indicacao, perguntas)
values ('c240eedb-210a-4b99-afc2-02a466a9defd', 'lancamento', 'Lançamento da nova AxiFit', 'trafego_pago',
  'A nova AxiFit chegou',
  'Cadastre-se em menos de 1 minuto e garanta a condição especial do primeiro lote.',
  '#E10600', false, true,
  false, 'AXI',
  '["Mapeamento completo da sua saúde","Condição especial do lançamento no plano anual","Concorrer a uma scooter elétrica ao garantir o plano anual"]'::jsonb,
  'Envie seu link para até 5 amigos que ainda não treinam na AxiFit. Cada amigo que garantir o plano anual no lançamento vale mais um cupom para você no sorteio da scooter elétrica.',
  '{"idade":true,"treina":true,"parado":true}'::jsonb)
on conflict (slug) do nothing;

-- 5) Só aluno com anual indica: quem apenas se cadastra não recebe código próprio
update axifit_lead_campanhas set indicacao = false where slug = 'lancamento';

-- 6) Valores iniciais dos lotes (só preenche se ainda estiver vazio)
update axifit_lead_campanhas set precos = '{"lote1":{"novo":119.9,"cliente":109.9},"lote2":{"novo":129.9,"cliente":119.9},"inauguracao":{"novo":139.9,"cliente":129.9}}'::jsonb
 where slug = 'lancamento' and precos is null;

-- 7) Acessos individuais e regras do sorteio (17/11/2026)
alter table axifit_lead_campanhas add column if not exists precos jsonb;
alter table axifit_lead_campanhas add column if not exists lote_atual text default 'lote1';
alter table axifit_lead_campanhas add column if not exists acessos jsonb default '[]'::jsonb;  -- nome, papel (consultor | direcao) e PIN (SHA-256)
alter table axifit_lead_campanhas add column if not exists regras jsonb default '{}'::jsonb;   -- chaves liga/desliga do sorteio

-- 8) Central de Leads, Lançar dia e Painel (17/11/2026)
alter table axifit_leads add column if not exists etapa text;
alter table axifit_leads add column if not exists proximo_contato timestamptz;
alter table axifit_leads add column if not exists primeira_tentativa_em timestamptz;
alter table axifit_leads add column if not exists assumido_em timestamptz;
alter table axifit_leads add column if not exists tentativas jsonb default '[]'::jsonb;
alter table axifit_leads add column if not exists agendamento_tipo text;
alter table axifit_leads add column if not exists agendamento_em timestamptz;
alter table axifit_leads add column if not exists perdido_motivo text;
alter table axifit_lead_campanhas add column if not exists investimento jsonb default '{}'::jsonb;
create table if not exists axifit_lancamentos_dia (
  id uuid primary key default gen_random_uuid(),
  academia_id text not null,
  data date not null,
  consultor text not null,
  dados jsonb default '{}'::jsonb,
  obs text,
  lancado_por text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (academia_id, data, consultor)
);
alter table axifit_lancamentos_dia disable row level security;

-- 9) Cupons impressos com número de série (LAN-101, LAN-102...) (17/11/2026)
create table if not exists axifit_cupom_impressoes (
  id uuid primary key default gen_random_uuid(),
  academia_id text not null,
  campanha_slug text not null,
  tipo text not null default 'impressao',
  de int not null,
  ate int not null,
  folhas int not null,
  por text,
  created_at timestamptz default now()
);
create unique index if not exists axifit_cupom_impressoes_serie on axifit_cupom_impressoes (academia_id, campanha_slug, de) where tipo = 'impressao';
alter table axifit_cupom_impressoes disable row level security;

-- 10) Venda com consultor responsável e quem lançou (17/11/2026)
alter table axifit_leads add column if not exists venda_lancado_por text;

-- 11) Condição especial, responsável financeiro e histórico de ajustes (20/11/2026)
alter table axifit_leads add column if not exists venda_condicao jsonb;
alter table axifit_leads add column if not exists wpp_responsavel boolean default false;
alter table axifit_leads add column if not exists responsavel_nome text;
create table if not exists axifit_venda_ajustes (
  id uuid primary key default gen_random_uuid(),
  academia_id text not null,
  lead_id uuid,
  lead_nome text,
  acao text not null,
  motivo text,
  antes jsonb,
  depois jsonb,
  feito_por text,
  autorizado_por text,
  created_at timestamptz default now()
);
alter table axifit_venda_ajustes disable row level security;

-- 12) Ciclo do lançamento: início, encerramento de cada lote e fim do ciclo (24/11/2026)
alter table axifit_lead_campanhas add column if not exists ciclo jsonb default '{}'::jsonb;

-- 13) Funis: Leads novos, Renovação e listas importadas (28/11/2026)
alter table axifit_leads add column if not exists funil text;
alter table axifit_lead_campanhas add column if not exists funis jsonb default '[]'::jsonb;
