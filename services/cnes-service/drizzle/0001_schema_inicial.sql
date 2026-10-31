CREATE TYPE "public"."sync_modo" AS ENUM('full', 'incremental');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "sync_execucoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"modo" "sync_modo" NOT NULL,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"finalizado_em" timestamp with time zone,
	"qtd_recebidas" integer,
	"qtd_upserts" integer,
	"qtd_inativadas" integer,
	"erro" text,
	CONSTRAINT "sync_finalizado_check" CHECK ("sync_execucoes"."status" = 'running' OR "sync_execucoes"."finalizado_em" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "tipos_unidade" (
	"codigo" integer PRIMARY KEY NOT NULL,
	"descricao" text NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unidades" (
	"codigo_cnes" integer PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"razao_social" text NOT NULL,
	"logradouro" text,
	"numero" text,
	"bairro" text,
	"cep" text,
	"telefone" text,
	"email" text,
	"localizacao" geography(Point, 4326) NOT NULL,
	"codigo_tipo_unidade" integer NOT NULL,
	"turno_atendimento" text,
	"atende_sus" boolean NOT NULL,
	"possui_centro_obstetrico" boolean,
	"possui_centro_cirurgico" boolean,
	"data_atualizacao_cnes" date,
	"ativo" boolean DEFAULT true NOT NULL,
	"verificada" boolean DEFAULT false NOT NULL,
	"sincronizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"horarios" jsonb,
	"servicos" text[],
	"observacoes" text,
	"manual_atualizado_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_codigo_tipo_unidade_tipos_unidade_codigo_fk" FOREIGN KEY ("codigo_tipo_unidade") REFERENCES "public"."tipos_unidade"("codigo") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_execucoes_status_idx" ON "sync_execucoes" USING btree ("status","iniciado_em");--> statement-breakpoint
CREATE INDEX "unidades_localizacao_idx" ON "unidades" USING gist ("localizacao");--> statement-breakpoint
CREATE INDEX "unidades_tipo_idx" ON "unidades" USING btree ("codigo_tipo_unidade");--> statement-breakpoint
CREATE INDEX "unidades_ativo_idx" ON "unidades" USING btree ("ativo");